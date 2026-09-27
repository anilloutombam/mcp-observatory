import { createClient } from '@sanity/client'

type Implementation = {
  _id: string
  name: string
  slug: string
  repositoryUrl?: string
}

const repositories: Record<string, string> = {
  'c-mcp-sdk': 'https://github.com/modelcontextprotocol/csharp-sdk',
  'go-mcp-sdk': 'https://github.com/modelcontextprotocol/go-sdk',
  'mcp-inspector-cli': 'https://github.com/modelcontextprotocol/inspector',
  'python-mcp-sdk': 'https://github.com/modelcontextprotocol/python-sdk',
  'rust-mcp-sdk': 'https://github.com/modelcontextprotocol/rust-sdk',
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

async function main() {
  const implementations = await client.fetch<Implementation[]>(
    `*[_type == "implementation"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      repositoryUrl
    }`,
  )
  const missing = implementations.filter((item) => !item.repositoryUrl)
  const unmapped = missing.filter((item) => !repositories[item.slug])

  if (unmapped.length) {
    throw new Error(
      `Missing repository mapping for: ${unmapped
        .map((item) => `${item.name} (${item.slug})`)
        .join(', ')}`,
    )
  }

  let updated = 0
  let unchanged = 0

  for (const implementation of implementations) {
    const repositoryUrl = repositories[implementation.slug]

    if (!repositoryUrl || implementation.repositoryUrl) {
      unchanged += 1
      continue
    }

    await client
      .patch(implementation._id)
      .setIfMissing({ repositoryUrl })
      .commit()

    updated += 1
    console.log(`Updated: ${implementation.name} → ${repositoryUrl}`)
  }

  console.log(
    `Repository backfill complete: ${updated} updated, ${unchanged} unchanged`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
