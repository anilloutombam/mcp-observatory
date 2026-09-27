import { readFile } from 'node:fs/promises'
import { createClient } from '@sanity/client'

type Transport = 'stdio' | 'streamable-http'
type RunStatus = 'passed' | 'failed' | 'needs-review'
type ImplementationKind = 'server' | 'proxy'
type FindingCategory =
  | 'compatibility'
  | 'recovery'
  | 'protocol-behavior'
  | 'transport'
  | 'reliability'
  | 'other'
type ReportingStatus = 'reported' | 'already-reported'

type SourceRun = [
  key: string,
  transport: Transport,
  status: RunStatus,
  durationMs: number | null,
  observation: string,
]

type SourceFinding = {
  id: string
  run: string
  statement: string
  category: FindingCategory
  reportingStatus: ReportingStatus
  repository: string
  issueNumber: number
  issueUrl: string
  commentUrl?: string
  reportedAt: string
}

type SourceReport = {
  id: string
  testedOn: string
  sourceUrl: string
  implementation: {
    name: string
    slug: string
    version: string
    kind: ImplementationKind
    repositoryUrl: string
  }
  outcomes: Array<{
    scenario: [name: string, slug: string, category: string]
    runs: SourceRun[]
  }>
  findings?: SourceFinding[]
}

type SourceData = {
  schemaVersion: number
  reports: SourceReport[]
}

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

function runSourceKey(reportId: string, scenarioSlug: string, runKey: string) {
  return `mcp-failure-lab:${reportId}:${scenarioSlug}:${runKey}`
}

function validateSource(data: SourceData) {
  if (data.schemaVersion !== 1) throw new Error('Unsupported source schema.')

  const reportIds = new Set<string>()
  const sourceKeys = new Set<string>()

  for (const report of data.reports) {
    if (reportIds.has(report.id))
      throw new Error(`Duplicate report: ${report.id}`)
    reportIds.add(report.id)

    const runAliases = new Set<string>()
    for (const outcome of report.outcomes) {
      const [, scenarioSlug] = outcome.scenario
      for (const [key] of outcome.runs) {
        const alias = `${scenarioSlug}:${key}`
        const sourceKey = runSourceKey(report.id, scenarioSlug, key)
        if (runAliases.has(alias))
          throw new Error(`Duplicate run alias: ${report.id}:${alias}`)
        if (sourceKeys.has(sourceKey))
          throw new Error(`Duplicate source key: ${sourceKey}`)
        runAliases.add(alias)
        sourceKeys.add(sourceKey)
      }
    }

    for (const finding of report.findings ?? []) {
      if (!runAliases.has(finding.run)) {
        throw new Error(
          `Finding ${report.id}:${finding.id} references missing run ${finding.run}.`,
        )
      }
    }
  }
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
