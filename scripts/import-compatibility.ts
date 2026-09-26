import { readFile } from 'node:fs/promises'
import { createClient } from '@sanity/client'

type Transport = 'stdio' | 'streamable-http'

type RunStatus =
  | 'passed'
  | 'failed'
  | 'needs-review'
  | 'unsupported'
  | 'not-run'
  | 'not-applicable'

type FocusedCompatibilityRun = {
  implementation: string
  version: string
  transport: Transport
  status: RunStatus
  duplicateBehavior: string
  recoveryPassed: boolean
}

type FocusedCompatibilityData = {
  schemaVersion: number
  failureLabVersion: string
  testedOn: string
  scenario: {
    name: string
    slug: string
    category: string
    description: string
  }
  runs: FocusedCompatibilityRun[]
}

type MatrixOutcome =
  | RunStatus
  | {
      status: RunStatus
      observation: string
    }

type MatrixCompatibilityData = {
  schemaVersion: number
  failureLabVersion: string
  testedOn: string
  implementations: Array<{
    name: string
    version: string
  }>
  scenarios: Array<{
    name: string
    slug: string
    category: string
    results: Record<string, [MatrixOutcome, MatrixOutcome]>
  }>
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
  apiVersion: '2026-09-26',
  useCdn: false,
})

function toId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function findOrCreateBySlug(
  type: 'implementation' | 'scenario',
  slug: string,
  document: Record<string, unknown>,
) {
  const existingId = await client.fetch<string | null>(
    `*[_type == $type && slug.current == $slug][0]._id`,
    {
      type,
      slug,
    },
  )

  if (existingId) {
    console.log(`Reusing ${type}: ${existingId}`)
    return existingId
  }

  const id = `${type}-${slug}`

  await client.createIfNotExists({
    _id: id,
    _type: type,
    ...document,
  })

  console.log(`Created ${type}: ${id}`)

  return id
}

async function resolveImplementations(implementations: string[]) {
  const implementationIds = new Map<string, string>()

  for (const implementation of implementations) {
    const slug = toId(implementation)

    const implementationId = await findOrCreateBySlug('implementation', slug, {
      name: implementation,
      slug: {
        _type: 'slug',
        current: slug,
      },
      kind: 'client',
    })

    implementationIds.set(implementation, implementationId)
    console.log(`Implementation ready: ${implementationId}`)
  }

  return implementationIds
}

function makeTestRunId(
  failureLabVersion: string,
  implementation: string,
  version: string,
  transport: Transport,
  scenarioSlug: string,
) {
  return [
    'test-run',
    failureLabVersion,
    toId(implementation),
    version,
    transport,
    scenarioSlug,
  ]
    .map(toId)
    .join('-')
}

async function createTestRun({
  failureLabVersion,
  implementation,
  implementationId,
  version,
  scenarioId,
  scenarioSlug,
  transport,
  status,
  observations = [],
}: {
  failureLabVersion: string
  implementation: string
  implementationId: string
  version: string
  scenarioId: string
  scenarioSlug: string
  transport: Transport
  status: RunStatus
  observations?: string[]
}) {
  const testRunId = makeTestRunId(
    failureLabVersion,
    implementation,
    version,
    transport,
    scenarioSlug,
  )

  await client.createIfNotExists({
    _id: testRunId,
    _type: 'testRun',
    implementation: {
      _type: 'reference',
      _ref: implementationId,
    },
    version,
    scenario: {
      _type: 'reference',
      _ref: scenarioId,
    },
    transport,
    status,
    ...(observations.length > 0 ? { observations } : {}),
  })

  console.log(`Test run ready: ${testRunId}`)
}

async function importFocusedCompatibility() {
  const raw = await readFile(
    new URL('./data/compatibility-v0.10.0.json', import.meta.url),
    'utf8',
  )

  const data = JSON.parse(raw) as FocusedCompatibilityData

  const scenarioId = await findOrCreateBySlug('scenario', data.scenario.slug, {
    name: data.scenario.name,
    slug: {
      _type: 'slug',
      current: data.scenario.slug,
    },
    category: data.scenario.category,
    description: data.scenario.description,
  })

  console.log(`Scenario ready: ${scenarioId}`)

  const implementationIds = await resolveImplementations([
    ...new Set(data.runs.map((run) => run.implementation)),
  ])

  console.log(`MCP Failure Lab: ${data.failureLabVersion}`)
  console.log(`Tested on: ${data.testedOn}`)
  console.log(`Scenario: ${data.scenario.name}`)
  console.log(`Runs: ${data.runs.length}`)

  for (const run of data.runs) {
    const implementationId = implementationIds.get(run.implementation)

    if (!implementationId) {
      throw new Error(`Missing implementation: ${run.implementation}`)
    }

    await createTestRun({
      failureLabVersion: data.failureLabVersion,
      implementation: run.implementation,
      implementationId,
      version: run.version,
      scenarioId,
      scenarioSlug: data.scenario.slug,
      transport: run.transport,
      status: run.status,
      observations: [
        run.duplicateBehavior,
        run.recoveryPassed
          ? 'Same-session ping succeeded after the duplicate response.'
          : 'Same-session recovery did not succeed.',
      ],
    })
  }
}

async function importCompatibilityMatrix() {
  const raw = await readFile(
    new URL('./data/compatibility-v0.9.0.json', import.meta.url),
    'utf8',
  )

  const data = JSON.parse(raw) as MatrixCompatibilityData
  const implementationIds = await resolveImplementations(
    data.implementations.map(({ name }) => name),
  )
  const transports: Transport[] = ['stdio', 'streamable-http']

  console.log(`MCP Failure Lab: ${data.failureLabVersion}`)
  console.log(`Tested on: ${data.testedOn}`)
  console.log(`Scenarios: ${data.scenarios.length}`)
  console.log(
    `Runs: ${data.scenarios.length * data.implementations.length * transports.length}`,
  )

  for (const scenario of data.scenarios) {
    const scenarioId = await findOrCreateBySlug('scenario', scenario.slug, {
      name: scenario.name,
      slug: {
        _type: 'slug',
        current: scenario.slug,
      },
      category: scenario.category,
    })

    console.log(`Scenario ready: ${scenarioId}`)

    for (const implementation of data.implementations) {
      const implementationId = implementationIds.get(implementation.name)
      const outcomes = scenario.results[implementation.name]

      if (!implementationId || !outcomes) {
        throw new Error(
          `Missing matrix data for ${implementation.name} / ${scenario.name}`,
        )
      }

      for (const [index, transport] of transports.entries()) {
        const outcome = outcomes[index]
        const status = typeof outcome === 'string' ? outcome : outcome.status
        const observations =
          typeof outcome === 'string' ? [] : [outcome.observation]

        await createTestRun({
          failureLabVersion: data.failureLabVersion,
          implementation: implementation.name,
          implementationId,
          version: implementation.version,
          scenarioId,
          scenarioSlug: scenario.slug,
          transport,
          status,
          observations,
        })
      }
    }
  }
}

async function main() {
  await importFocusedCompatibility()
  await importCompatibilityMatrix()

  const documentCount = await client.fetch<number>('count(*)')
  console.log(`Sanity documents: ${documentCount}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
