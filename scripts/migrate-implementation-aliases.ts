import { createClient, type SanityClient } from '@sanity/client'
import { implementationSlugAliases } from './lib/implementation-aliases'

type Implementation = {
  _id: string
  name: string
  slug: string
}

type TestRun = {
  _id: string
  implementationId?: string
}

type Finding = {
  _id: string
  affectedImplementations?: Array<{
    _key?: string
    _type: 'reference'
    _ref: string
  }>
}

const write = process.argv.slice(2).includes('--write')
const batchSize = 75

function requiredEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}.`)
  return value
}

async function commitPatches(
  client: SanityClient,
  patches: Array<{ id: string; set: Record<string, unknown> }>,
) {
  for (let offset = 0; offset < patches.length; offset += batchSize) {
    const transaction = client.transaction()
    for (const patch of patches.slice(offset, offset + batchSize))
      transaction.patch(patch.id, { set: patch.set })
    await transaction.commit()
  }
}

async function main() {
  const client = createClient({
    projectId: requiredEnvironment('NEXT_PUBLIC_SANITY_PROJECT_ID'),
    dataset: requiredEnvironment('NEXT_PUBLIC_SANITY_DATASET'),
    token: write ? requiredEnvironment('SANITY_API_WRITE_TOKEN') : undefined,
    apiVersion: '2026-09-28',
    useCdn: false,
  })
  const data = await client.fetch<{
    implementations: Implementation[]
    testRuns: TestRun[]
    findings: Finding[]
  }>(`{
    "implementations": *[_type == "implementation" && !(_id in path("drafts.**"))]{
      _id, name, "slug": slug.current
    },
    "testRuns": *[_type == "testRun" && !(_id in path("drafts.**"))]{
      _id, "implementationId": implementation._ref
    },
    "findings": *[_type == "finding" && !(_id in path("drafts.**"))]{
      _id, affectedImplementations
    }
  }`)
  const bySlug = new Map(data.implementations.map((item) => [item.slug, item]))
  const plans = Object.entries(implementationSlugAliases).flatMap(
    ([alias, canonical]) => {
      const source = bySlug.get(alias)
      if (!source) return []
      const target = bySlug.get(canonical)
      const testRuns = data.testRuns.filter(
        (run) => run.implementationId === source._id,
      )
      const findings = data.findings.filter((finding) =>
        finding.affectedImplementations?.some(
          (reference) => reference._ref === source._id,
        ),
      )
      return [{ alias, canonical, source, target, testRuns, findings }]
    },
  )

  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        migrations: plans.map((plan) => ({
          from: plan.alias,
          to: plan.canonical,
          action: plan.target ? 'merge-and-delete-alias' : 'rename-alias',
          testRuns: plan.testRuns.length,
          findings: plan.findings.length,
        })),
        message: write
          ? 'Applying canonical implementation identities.'
          : 'No documents changed. Re-run with --write after reviewing this plan.',
      },
      null,
      2,
    ),
  )
  if (!write) return

  for (const plan of plans) {
    if (!plan.target) {
      await client
        .patch(plan.source._id)
        .set({ slug: { _type: 'slug', current: plan.canonical } })
        .commit()
      continue
    }

    const patches = [
      ...plan.testRuns.map((run) => ({
        id: run._id,
        set: {
          implementation: { _type: 'reference', _ref: plan.target!._id },
        },
      })),
      ...plan.findings.map((finding) => ({
        id: finding._id,
        set: {
          affectedImplementations: finding.affectedImplementations?.map(
            (reference) =>
              reference._ref === plan.source._id
                ? { ...reference, _ref: plan.target!._id }
                : reference,
          ),
        },
      })),
    ]
    await commitPatches(client, patches)

    const remainingReferences = await client.fetch<
      Array<{ _id: string; _type: string }>
    >(`*[references($sourceId)]{_id, _type}`, {
      sourceId: plan.source._id,
    })
    if (remainingReferences.length > 0) {
      throw new Error(
        `Cannot delete ${plan.alias}; ${remainingReferences.length} references remain.`,
      )
    }
    await client.delete(plan.source._id)
    console.log(
      `Merged ${plan.alias} into ${plan.canonical} and deleted the empty alias document.`,
    )
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Migration failed.')
  process.exit(1)
})
