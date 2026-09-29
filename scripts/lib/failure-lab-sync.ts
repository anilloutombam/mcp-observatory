import type { SanityClient } from '@sanity/client'
import {
  runSourceKey,
  type SourceData,
  validateSource,
} from './upstream-import'
import { z } from 'zod'

type ImportedType =
  'implementation' | 'scenario' | 'testRun' | 'evidence' | 'finding'

export type SyncCounters = Record<
  ImportedType,
  { created: number; updated: number; preserved: number }
>

const syncOptionsSchema = z
  .object({
    revision: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9._-]+$/),
    sourceUrl: z
      .url()
      .refine((value) => value.startsWith('https://'))
      .optional(),
    completedAt: z.iso.datetime().optional(),
  })
  .strict()

export function sourceCounts(data: SourceData) {
  return data.reports.reduce(
    (counts, report) => {
      counts.runs += report.outcomes.reduce(
        (total, outcome) => total + outcome.runs.length,
        0,
      )
      counts.findings += report.findings?.length ?? 0
      return counts
    },
    { reports: data.reports.length, runs: 0, findings: 0 },
  )
}

function emptyCounters(): SyncCounters {
  const initial = () => ({ created: 0, updated: 0, preserved: 0 })
  return {
    implementation: initial(),
    scenario: initial(),
    testRun: initial(),
    evidence: initial(),
    finding: initial(),
  }
}

async function findBySlug(
  client: SanityClient,
  type: 'implementation' | 'scenario',
  slug: string,
) {
  return client.fetch<{ _id: string } | null>(
    `*[_type == $type && slug.current == $slug][0]{_id}`,
    { type, slug },
  )
}

async function findBySourceKey(
  client: SanityClient,
  type: 'testRun' | 'evidence' | 'finding' | 'dataSync',
  sourceKey: string,
) {
  return client.fetch<{ _id: string } | null>(
    `*[_type == $type && sourceKey == $sourceKey][0]{_id}`,
    { type, sourceKey },
  )
}

export async function syncFailureLabData(
  client: SanityClient,
  input: SourceData,
  options: { revision: string; sourceUrl?: string; completedAt?: string },
) {
  const data = validateSource(input)
  const syncOptions = syncOptionsSchema.parse(options)
  const counts = sourceCounts(data)
  const counters = emptyCounters()
  const implementationIds = new Map<string, string>()
  const scenarioIds = new Map<string, string>()

  for (const report of data.reports) {
    let implementationId = implementationIds.get(report.implementation.slug)
    if (!implementationId) {
      const existing = await findBySlug(
        client,
        'implementation',
        report.implementation.slug,
      )
      if (existing) {
        implementationId = existing._id
        await client
          .patch(existing._id)
          .setIfMissing({ repositoryUrl: report.implementation.repositoryUrl })
          .commit()
        counters.implementation.preserved += 1
      } else {
        const created = await client.create({
          _type: 'implementation',
          name: report.implementation.name,
          slug: { _type: 'slug', current: report.implementation.slug },
          kind: report.implementation.kind,
          repositoryUrl: report.implementation.repositoryUrl,
          description: 'Compatibility data imported from MCP Failure Lab.',
        })
        implementationId = created._id
        counters.implementation.created += 1
      }
      implementationIds.set(report.implementation.slug, implementationId)
    }

    const runIds = new Map<string, { testRunId: string; evidenceId: string }>()
    for (const outcome of report.outcomes) {
      const [scenarioName, scenarioSlug, scenarioCategory] = outcome.scenario
      let scenarioId = scenarioIds.get(scenarioSlug)
      if (!scenarioId) {
        const existing = await findBySlug(client, 'scenario', scenarioSlug)
        if (existing) {
          scenarioId = existing._id
          counters.scenario.preserved += 1
        } else {
          const created = await client.create({
            _type: 'scenario',
            name: scenarioName,
            slug: { _type: 'slug', current: scenarioSlug },
            category: scenarioCategory,
            description: 'Scenario imported from MCP Failure Lab.',
          })
          scenarioId = created._id
          counters.scenario.created += 1
        }
        scenarioIds.set(scenarioSlug, scenarioId)
      }

      for (const [
        key,
        transport,
        status,
        durationMs,
        observation,
      ] of outcome.runs) {
        const sourceKey = runSourceKey(report.id, scenarioSlug, key)
        const testRunValues = {
          implementation: { _type: 'reference', _ref: implementationId },
          version: report.implementation.version,
          scenario: { _type: 'reference', _ref: scenarioId },
          transport,
          status,
          testedOn: report.testedOn,
          sourceReportUrl: report.sourceUrl,
          observations: [observation],
          ...(durationMs == null ? {} : { durationMs }),
        }
        const existingRun = await findBySourceKey(client, 'testRun', sourceKey)
        let testRunId: string
        if (existingRun) {
          testRunId = existingRun._id
          const patch = client.patch(testRunId).set(testRunValues)
          if (durationMs == null) patch.unset(['durationMs'])
          await patch.commit()
          counters.testRun.updated += 1
        } else {
          const created = await client.create({
            _type: 'testRun',
            sourceKey,
            ...testRunValues,
          })
          testRunId = created._id
          counters.testRun.created += 1
        }

        const evidenceKey = `${sourceKey}:evidence`
        const evidenceValues = {
          testRun: { _type: 'reference', _ref: testRunId },
          type: status === 'failed' ? 'error' : 'observation',
          summary: observation,
          raw: observation,
          source: report.sourceUrl,
        }
        const existingEvidence = await findBySourceKey(
          client,
          'evidence',
          evidenceKey,
        )
        let evidenceId: string
        if (existingEvidence) {
          evidenceId = existingEvidence._id
          await client.patch(evidenceId).set(evidenceValues).commit()
          counters.evidence.updated += 1
        } else {
          const created = await client.create({
            _type: 'evidence',
            sourceKey: evidenceKey,
            ...evidenceValues,
          })
          evidenceId = created._id
          counters.evidence.created += 1
        }
        runIds.set(`${scenarioSlug}:${key}`, { testRunId, evidenceId })
      }
    }

    for (const finding of report.findings ?? []) {
      const linkedRun = runIds.get(finding.run)
      if (!linkedRun)
        throw new Error(`Missing imported run ${report.id}:${finding.run}`)

      const sourceKey = `mcp-failure-lab:${report.id}:finding:${finding.id}`
      const existing = await findBySourceKey(client, 'finding', sourceKey)
      if (existing) {
        counters.finding.preserved += 1
        continue
      }

      await client.create({
        _type: 'finding',
        sourceKey,
        testRun: { _type: 'reference', _ref: linkedRun.testRunId },
        statement: finding.statement,
        category: finding.category,
        confidence: 1,
        status: 'needs-review',
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
      })
      counters.finding.created += 1
    }
  }

  const completedAt = syncOptions.completedAt ?? new Date().toISOString()
  const syncSourceKey = `mcp-failure-lab:${syncOptions.revision}`
  const syncValues = {
    source: 'mcp-failure-lab',
    sourceRevision: syncOptions.revision,
    ...(syncOptions.sourceUrl ? { sourceUrl: syncOptions.sourceUrl } : {}),
    status: 'succeeded',
    completedAt,
    reportCount: counts.reports,
    runCount: counts.runs,
    findingCount: counts.findings,
  }
  const existingSync = await findBySourceKey(client, 'dataSync', syncSourceKey)
  if (existingSync)
    await client.patch(existingSync._id).set(syncValues).commit()
  else
    await client.create({
      _type: 'dataSync',
      sourceKey: syncSourceKey,
      ...syncValues,
    })

  return { revision: syncOptions.revision, completedAt, ...counts, counters }
}
