import { createClient } from '@sanity/client'

type ReportingStatus =
  | 'not-reported'
  | 'reported'
  | 'already-reported'
  | 'resolved'
  | 'not-actionable'

type Finding = {
  _id: string
  statement?: string
  reportingStatus?: ReportingStatus
  affectedVersions?: string[]
  resolutionSummary?: string
}

type Backfill = {
  testRunId: string
  values: Pick<
    Finding,
    'reportingStatus' | 'affectedVersions' | 'resolutionSummary'
  >
}

const backfills: Backfill[] = [
  {
    testRunId:
      'test-run-0-10-0-typescript-mcp-sdk-1-30-0-stdio-duplicate-response',
    values: {
      reportingStatus: 'not-actionable',
      affectedVersions: ['1.30.0'],
      resolutionSummary:
        'Verified compatibility behavior: the TypeScript SDK reported the duplicate response through its error callback, preserved the first result, and remained usable for a same-session ping. No upstream defect was identified in the source report.',
    },
  },
]

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

async function main() {
  let updated = 0
  let unchanged = 0

  for (const backfill of backfills) {
    const findings = await client.fetch<Finding[]>(
      `*[_type == "finding" && testRun._ref == $testRunId]{
        _id,
        statement,
        reportingStatus,
        affectedVersions,
        resolutionSummary
      }`,
      { testRunId: backfill.testRunId },
    )

    if (findings.length !== 1) {
      throw new Error(
        `Expected one finding for ${backfill.testRunId}, found ${findings.length}.`,
      )
    }

    const finding = findings[0]
    const missingValues = Object.fromEntries(
      Object.entries(backfill.values).filter(
        ([field]) => finding[field as keyof Finding] == null,
      ),
    )

    if (Object.keys(missingValues).length === 0) {
      unchanged += 1
      console.log(`Unchanged: ${finding._id}`)
      continue
    }

    await client.patch(finding._id).setIfMissing(missingValues).commit()
    updated += 1
    console.log(
      `Updated: ${finding._id} (${Object.keys(missingValues).join(', ')})`,
    )
  }

  console.log(`Backfill complete: ${updated} updated, ${unchanged} unchanged`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
