import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@sanity/client'
import { sourceCounts, syncFailureLabData } from './lib/failure-lab-sync'
import { validateSource } from './lib/upstream-import'

const args = process.argv.slice(2)
const write = args.includes('--write')

function option(name: string) {
  const prefix = `--${name}=`
  return args.find((value) => value.startsWith(prefix))?.slice(prefix.length)
}

const source =
  option('source') ??
  process.env.MCP_FAILURE_LAB_SYNC_SOURCE ??
  new URL('./data/upstream-compatibility-reports.json', import.meta.url)
    .pathname

async function readSource(value: string) {
  if (/^https?:\/\//.test(value)) {
    const response = await fetch(value, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok)
      throw new Error(`Could not read source (${response.status}).`)
    return { raw: await response.text(), sourceUrl: value }
  }

  return { raw: await readFile(resolve(value), 'utf8'), sourceUrl: undefined }
}

async function main() {
  const loaded = await readSource(source)
  const data = validateSource(JSON.parse(loaded.raw))

  const counts = sourceCounts(data)
  const revision =
    option('revision') ??
    process.env.MCP_FAILURE_LAB_REVISION ??
    createHash('sha256').update(loaded.raw).digest('hex')

  if (!write) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          source,
          revision,
          ...counts,
          message: 'Source is valid. Re-run with --write to update Sanity.',
        },
        null,
        2,
      ),
    )
    return
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!projectId || !dataset || !token) {
    throw new Error(
      'Writing requires NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN.',
    )
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2026-09-28',
    useCdn: false,
  })
  const result = await syncFailureLabData(client, data, {
    revision,
    sourceUrl: loaded.sourceUrl,
    onProgress: (message) => console.log(message),
  })

  console.log(JSON.stringify({ mode: 'write', source, ...result }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Sync failed.')
  process.exit(1)
})
