import { randomUUID } from 'node:crypto'
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
type ExistingDocument = Record<string, unknown> & {
  _id: string
  _type: string
  sourceKey?: string
  slug?: { current?: string }
}
type Mutation =
  | {
      action: 'create'
      document: Record<string, unknown> & { _id: string; _type: string }
    }
  | {
      action: 'patch'
      id: string
      set?: Record<string, unknown>
      setIfMissing?: Record<string, unknown>
      unset?: string[]
    }

const BATCH_SIZE = 75
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

function hasSameValues(
  document: ExistingDocument,
  values: Record<string, unknown>,
) {
  return Object.entries(values).every(
    ([key, value]) => JSON.stringify(document[key]) === JSON.stringify(value),
  )
}

async function commitMutations(
  client: SanityClient,
  mutations: Mutation[],
  progress?: (message: string) => void,
) {
  for (let offset = 0; offset < mutations.length; offset += BATCH_SIZE) {
    const batch = mutations.slice(offset, offset + BATCH_SIZE)
    const transaction = client.transaction()
    for (const mutation of batch) {
      if (mutation.action === 'create') transaction.create(mutation.document)
      else
        transaction.patch(mutation.id, {
          ...(mutation.set ? { set: mutation.set } : {}),
          ...(mutation.setIfMissing
            ? { setIfMissing: mutation.setIfMissing }
            : {}),
          ...(mutation.unset ? { unset: mutation.unset } : {}),
        })
    }
    await transaction.commit()
    progress?.(
      `Committed ${Math.min(offset + batch.length, mutations.length)}/${mutations.length} Sanity mutations.`,
    )
  }
}

export async function syncFailureLabData(
  client: SanityClient,
  input: SourceData,
  options: {
    revision: string
    sourceUrl?: string
    completedAt?: string
    onProgress?: (message: string) => void
  },
) {
  const data = validateSource(input)
  const { onProgress, ...rawSyncOptions } = options
  const syncOptions = syncOptionsSchema.parse(rawSyncOptions)
  const counts = sourceCounts(data)
  const counters = emptyCounters()
  const implementationSlugs = new Set<string>()
  const scenarioSlugs = new Set<string>()
  const sourceKeys = new Set<string>()

  for (const report of data.reports) {
    implementationSlugs.add(report.implementation.slug)
    for (const outcome of report.outcomes) {
      const scenarioSlug = outcome.scenario[1]
      scenarioSlugs.add(scenarioSlug)
      for (const [key] of outcome.runs) {
        const runKey = runSourceKey(report.id, scenarioSlug, key)
        sourceKeys.add(runKey)
        sourceKeys.add(`${runKey}:evidence`)
      }
    }
    for (const finding of report.findings ?? [])
      sourceKeys.add(`mcp-failure-lab:${report.id}:finding:${finding.id}`)
  }
  const syncSourceKey = `mcp-failure-lab:${syncOptions.revision}`
  sourceKeys.add(syncSourceKey)

  onProgress?.(`Loading existing Sanity records for ${counts.runs} runs.`)
  const existingDocuments = await client.fetch<ExistingDocument[]>(
    `*[
      (_type == "implementation" && slug.current in $implementationSlugs) ||
      (_type == "scenario" && slug.current in $scenarioSlugs) ||
      (_type in ["testRun", "evidence", "finding", "dataSync"] && sourceKey in $sourceKeys)
    ]`,
    {
      implementationSlugs: [...implementationSlugs],
      scenarioSlugs: [...scenarioSlugs],
      sourceKeys: [...sourceKeys],
    },
  )
  const bySlug = new Map(
    existingDocuments
      .filter((document) => document.slug?.current)
      .map((document) => [document.slug!.current!, document]),
  )
  const bySourceKey = new Map(
    existingDocuments
      .filter((document) => document.sourceKey)
      .map((document) => [document.sourceKey!, document]),
  )
  const implementationIds = new Map<string, string>()
  const scenarioIds = new Map<string, string>()
  const mutations: Mutation[] = []
  let processedRuns = 0

  for (const report of data.reports) {
    let implementationId = implementationIds.get(report.implementation.slug)
    if (!implementationId) {
      const existing = bySlug.get(report.implementation.slug)
      if (existing) {
        implementationId = existing._id
        if (existing.repositoryUrl === undefined)
          mutations.push({
            action: 'patch',
            id: existing._id,
            setIfMissing: {
              repositoryUrl: report.implementation.repositoryUrl,
            },
          })
        counters.implementation.preserved += 1
      } else {
        implementationId = randomUUID()
        mutations.push({
          action: 'create',
          document: {
            _id: implementationId,
            _type: 'implementation',
            name: report.implementation.name,
            slug: { _type: 'slug', current: report.implementation.slug },
            kind: report.implementation.kind,
            repositoryUrl: report.implementation.repositoryUrl,
            description: 'Compatibility data imported from MCP Failure Lab.',
          },
        })
        counters.implementation.created += 1
      }
      implementationIds.set(report.implementation.slug, implementationId)
    }

    const runIds = new Map<string, { testRunId: string; evidenceId: string }>()
    for (const outcome of report.outcomes) {
      const [scenarioName, scenarioSlug, scenarioCategory] = outcome.scenario
      let scenarioId = scenarioIds.get(scenarioSlug)
      if (!scenarioId) {
        const existing = bySlug.get(scenarioSlug)
        if (existing) {
          scenarioId = existing._id
          counters.scenario.preserved += 1
        } else {
          scenarioId = randomUUID()
          mutations.push({
            action: 'create',
            document: {
              _id: scenarioId,
              _type: 'scenario',
              name: scenarioName,
              slug: { _type: 'slug', current: scenarioSlug },
              category: scenarioCategory,
              description: 'Scenario imported from MCP Failure Lab.',
            },
          })
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
        const existingRun = bySourceKey.get(sourceKey)
        let testRunId: string
        if (existingRun) {
          testRunId = existingRun._id
          const durationMatches =
            durationMs == null
              ? existingRun.durationMs === undefined
              : existingRun.durationMs === durationMs
          if (hasSameValues(existingRun, testRunValues) && durationMatches)
            counters.testRun.preserved += 1
          else {
            mutations.push({
              action: 'patch',
              id: testRunId,
              set: testRunValues,
              ...(durationMs == null ? { unset: ['durationMs'] } : {}),
            })
            counters.testRun.updated += 1
          }
        } else {
          testRunId = randomUUID()
          mutations.push({
            action: 'create',
            document: {
              _id: testRunId,
              _type: 'testRun',
              sourceKey,
              ...testRunValues,
            },
          })
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
        const existingEvidence = bySourceKey.get(evidenceKey)
        let evidenceId: string
        if (existingEvidence) {
          evidenceId = existingEvidence._id
          if (hasSameValues(existingEvidence, evidenceValues))
            counters.evidence.preserved += 1
          else {
            mutations.push({
              action: 'patch',
              id: evidenceId,
              set: evidenceValues,
            })
            counters.evidence.updated += 1
          }
        } else {
          evidenceId = randomUUID()
          mutations.push({
            action: 'create',
            document: {
              _id: evidenceId,
              _type: 'evidence',
              sourceKey: evidenceKey,
              ...evidenceValues,
            },
          })
          counters.evidence.created += 1
        }
        runIds.set(`${scenarioSlug}:${key}`, { testRunId, evidenceId })
        processedRuns += 1
        if (processedRuns % 100 === 0 || processedRuns === counts.runs)
          onProgress?.(`Prepared ${processedRuns}/${counts.runs} runs.`)
      }
    }

    for (const finding of report.findings ?? []) {
      const linkedRun = runIds.get(finding.run)
      if (!linkedRun)
        throw new Error(`Missing imported run ${report.id}:${finding.run}`)
      const sourceKey = `mcp-failure-lab:${report.id}:finding:${finding.id}`
      if (bySourceKey.has(sourceKey)) {
        counters.finding.preserved += 1
        continue
      }
      mutations.push({
        action: 'create',
        document: {
          _id: randomUUID(),
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
        },
      })
      counters.finding.created += 1
    }
  }

  const completedAt = syncOptions.completedAt ?? new Date().toISOString()
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
  const existingSync = bySourceKey.get(syncSourceKey)
  if (existingSync)
    mutations.push({ action: 'patch', id: existingSync._id, set: syncValues })
  else
    mutations.push({
      action: 'create',
      document: {
        _id: randomUUID(),
        _type: 'dataSync',
        sourceKey: syncSourceKey,
        ...syncValues,
      },
    })

  onProgress?.(
    `Committing ${mutations.length} mutations in batches of ${BATCH_SIZE}.`,
  )
  await commitMutations(client, mutations, onProgress)
  return { revision: syncOptions.revision, completedAt, ...counts, counters }
}
