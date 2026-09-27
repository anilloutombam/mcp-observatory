import { readFile } from 'node:fs/promises'
import { createClient } from '@sanity/client'

type RunStatus = 'passed' | 'failed'
type Transport = 'stdio' | 'streamable-http'
type SourceRun = {
  scenario: [name: string, slug: string, category: string]
  transport: Transport
  status: RunStatus
  observation: string
  raw: string
}
type SourceImplementation = {
  name: string
  slug: string
  version: string
  repositoryUrl: string
  runs: SourceRun[]
}
type SourceFinding = {
  id: string
  implementationSlug: string
  scenarioSlug: string
  statement: string
  category: string
  repository: string
  issueNumber: number
  issueUrl: string
  commentUrl: string
  reportedAt: string
}
type SourceData = {
  schemaVersion: number
  release: string
  testedOn: string
  capturedAt: string
  sourceUrl: string
  implementations: SourceImplementation[]
  findings: SourceFinding[]
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
  created: { scenario: 0, testRun: 0, evidence: 0, finding: 0 },
  reused: { scenario: 0, testRun: 0, evidence: 0, finding: 0 },
}

async function findBySlug(type: 'implementation' | 'scenario', slug: string) {
  return client.fetch<{ _id: string } | null>(
    `*[_type == $type && slug.current == $slug][0]{_id}`,
    { type, slug },
  )
}

async function resolveScenario(source: SourceRun['scenario']) {
  const [name, slug, category] = source
  const existing = await findBySlug('scenario', slug)
  if (existing) {
    counters.reused.scenario += 1
    return existing._id
  }

  const created = await client.create({
    _type: 'scenario',
    name,
    slug: { _type: 'slug', current: slug },
    category,
    description: `Lifecycle fault scenario introduced by MCP Failure Lab 0.11.0.`,
  })
  counters.created.scenario += 1
  return created._id
}

async function findOrCreate(
  type: 'testRun' | 'evidence' | 'finding',
  sourceKey: string,
  values: Record<string, unknown>,
) {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == $type && sourceKey == $sourceKey][0]{_id}`,
    { type, sourceKey },
  )
  if (existing) {
    counters.reused[type] += 1
    return existing._id
  }

  const created = await client.create({ _type: type, sourceKey, ...values })
  counters.created[type] += 1
  return created._id
}

function validate(data: SourceData) {
  if (data.schemaVersion !== 1) throw new Error('Unsupported source schema.')
  if (data.release !== '0.11.0') throw new Error('Unexpected release identity.')

  const implementationSlugs = new Set<string>()
  const runKeys = new Set<string>()
  for (const implementation of data.implementations) {
    if (implementationSlugs.has(implementation.slug)) {
      throw new Error(`Duplicate implementation: ${implementation.slug}`)
    }
    implementationSlugs.add(implementation.slug)
    for (const run of implementation.runs) {
      const key = `${implementation.slug}:${run.scenario[1]}:${run.transport}`
      if (runKeys.has(key)) throw new Error(`Duplicate run: ${key}`)
      runKeys.add(key)
    }
  }

  for (const finding of data.findings) {
    const matchingRun = [...runKeys].some((key) =>
      key.startsWith(`${finding.implementationSlug}:${finding.scenarioSlug}:`),
    )
    if (!matchingRun)
      throw new Error(`Finding references missing run: ${finding.id}`)
  }
}

async function main() {
  const raw = await readFile(
    new URL('./data/lifecycle-compatibility-v0.11.0.json', import.meta.url),
    'utf8',
  )
  const data = JSON.parse(raw) as SourceData
  validate(data)

  const importedRuns = new Map<
    string,
    { testRunId: string; evidenceId: string; version: string }
  >()

  for (const implementation of data.implementations) {
    const implementationDocument = await findBySlug(
      'implementation',
      implementation.slug,
    )
    if (!implementationDocument) {
      throw new Error(`Missing implementation: ${implementation.slug}`)
    }

    await client
      .patch(implementationDocument._id)
      .setIfMissing({ repositoryUrl: implementation.repositoryUrl })
      .commit()

    for (const run of implementation.runs) {
      const scenarioId = await resolveScenario(run.scenario)
      const scenarioSlug = run.scenario[1]
      const sourceKey = `mcp-failure-lab:0.11.0:${implementation.slug}:${scenarioSlug}:${run.transport}`
      const testRunId = await findOrCreate('testRun', sourceKey, {
        implementation: {
          _type: 'reference',
          _ref: implementationDocument._id,
        },
        version: implementation.version,
        scenario: { _type: 'reference', _ref: scenarioId },
        transport: run.transport,
        status: run.status,
        testedOn: data.testedOn,
        sourceReportUrl: data.sourceUrl,
        observations: [run.observation],
      })
      const evidenceId = await findOrCreate(
        'evidence',
        `${sourceKey}:evidence`,
        {
          testRun: { _type: 'reference', _ref: testRunId },
          type: run.status === 'failed' ? 'error' : 'recovery',
          summary: run.observation,
          raw: run.raw,
          capturedAt: data.capturedAt,
          source: data.sourceUrl,
        },
      )
      importedRuns.set(`${implementation.slug}:${scenarioSlug}`, {
        testRunId,
        evidenceId,
        version: implementation.version,
      })
    }
  }

  for (const finding of data.findings) {
    const linkedRun = importedRuns.get(
      `${finding.implementationSlug}:${finding.scenarioSlug}`,
    )
    if (!linkedRun) throw new Error(`Missing imported run: ${finding.id}`)

    await findOrCreate(
      'finding',
      `mcp-failure-lab:0.11.0:finding:${finding.id}`,
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
        affectedVersions: [linkedRun.version],
        reportingStatus: 'already-reported',
        upstreamRepository: finding.repository,
        upstreamIssueUrl: finding.issueUrl,
        upstreamIssueNumber: finding.issueNumber,
        upstreamCommentUrl: finding.commentUrl,
        reportedAt: finding.reportedAt,
        upstreamIssueState: 'open',
      },
    )
  }

  console.log(JSON.stringify(counters, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Import failed.')
  process.exit(1)
})
