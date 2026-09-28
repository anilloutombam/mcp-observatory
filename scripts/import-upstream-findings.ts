import { readFile } from 'node:fs/promises'
import { createClient } from '@sanity/client'
import {
  runSourceKey,
  type SourceData,
  validateSource,
} from './lib/upstream-import'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  throw new Error('Missing Sanity environment variables')
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-09-27',
  useCdn: false,
})

const counters = {
  created: {
    implementation: 0,
    scenario: 0,
    testRun: 0,
    evidence: 0,
    finding: 0,
  },
  reused: {
    implementation: 0,
    scenario: 0,
    testRun: 0,
    evidence: 0,
    finding: 0,
  },
}

async function findOrCreateBySlug(
  type: 'implementation' | 'scenario',
  slug: string,
  document: Record<string, unknown>,
) {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == $type && slug.current == $slug][0]{_id}`,
    { type, slug },
  )

  if (existing) {
    counters.reused[type] += 1
    return existing._id
  }

  const created = await client.create({ _type: type, ...document })
  counters.created[type] += 1
  return created._id
}

async function findOrCreateBySourceKey(
  type: 'testRun' | 'evidence' | 'finding',
  sourceKey: string,
  document: Record<string, unknown>,
) {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == $type && sourceKey == $sourceKey][0]{_id}`,
    { type, sourceKey },
  )

  if (existing) {
    counters.reused[type] += 1
    return existing._id
  }

  const created = await client.create({
    _type: type,
    sourceKey,
    ...document,
  })
  counters.created[type] += 1
  return created._id
}

async function main() {
  const raw = await readFile(
    new URL('./data/upstream-compatibility-reports.json', import.meta.url),
    'utf8',
  )
  const data = JSON.parse(raw) as SourceData
  validateSource(data)

  for (const report of data.reports) {
    const implementationId = await findOrCreateBySlug(
      'implementation',
      report.implementation.slug,
      {
        name: report.implementation.name,
        slug: { _type: 'slug', current: report.implementation.slug },
        kind: report.implementation.kind,
        repositoryUrl: report.implementation.repositoryUrl,
        description: `Compatibility results imported from MCP Failure Lab report ${report.id}.`,
      },
    )

    const runIds = new Map<string, { testRunId: string; evidenceId: string }>()

    for (const outcome of report.outcomes) {
      const [scenarioName, scenarioSlug, scenarioCategory] = outcome.scenario
      const scenarioId = await findOrCreateBySlug('scenario', scenarioSlug, {
        name: scenarioName,
        slug: { _type: 'slug', current: scenarioSlug },
        category: scenarioCategory,
        description: `Scenario recorded by MCP Failure Lab report ${report.id}.`,
      })

      for (const [
        key,
        transport,
        status,
        durationMs,
        observation,
      ] of outcome.runs) {
        const sourceKey = runSourceKey(report.id, scenarioSlug, key)
        const testRunId = await findOrCreateBySourceKey('testRun', sourceKey, {
          implementation: { _type: 'reference', _ref: implementationId },
          version: report.implementation.version,
          scenario: { _type: 'reference', _ref: scenarioId },
          transport,
          status,
          testedOn: report.testedOn,
          sourceReportUrl: report.sourceUrl,
          ...(durationMs == null ? {} : { durationMs }),
          observations: [observation],
        })

        const evidenceId = await findOrCreateBySourceKey(
          'evidence',
          `${sourceKey}:evidence`,
          {
            testRun: { _type: 'reference', _ref: testRunId },
            type: status === 'failed' ? 'error' : 'observation',
            summary: observation,
            raw: observation,
            source: report.sourceUrl,
          },
        )

        runIds.set(`${scenarioSlug}:${key}`, { testRunId, evidenceId })
      }
    }

    for (const finding of report.findings ?? []) {
      const linkedRun = runIds.get(finding.run)
      if (!linkedRun)
        throw new Error(`Missing imported run ${report.id}:${finding.run}`)

      await findOrCreateBySourceKey(
        'finding',
        `mcp-failure-lab:${report.id}:finding:${finding.id}`,
        {
          testRun: { _type: 'reference', _ref: linkedRun.testRunId },
          statement: finding.statement,
          category: finding.category,
          confidence: 1,
          status: 'verified',
          supportingEvidence: [
            {
              _key: 'primary-evidence',
              _type: 'reference',
              _ref: linkedRun.evidenceId,
            },
          ],
          proposedBy: 'importer',
          affectedVersions: [report.implementation.version],
          reportingStatus: finding.reportingStatus,
          upstreamRepository: finding.repository,
          upstreamIssueUrl: finding.issueUrl,
          upstreamIssueNumber: finding.issueNumber,
          ...(finding.commentUrl
            ? { upstreamCommentUrl: finding.commentUrl }
            : {}),
          reportedAt: finding.reportedAt,
          upstreamIssueState: 'open',
        },
      )
    }

    console.log(`Imported report: ${report.id}`)
  }

  console.log(JSON.stringify(counters, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Import failed.')
  process.exit(1)
})
