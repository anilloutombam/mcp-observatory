import { z } from 'zod'

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const stableIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)
const httpsUrlSchema = z.url().refine((value) => value.startsWith('https://'), {
  message: 'Use an HTTPS URL.',
})
const failureLabReportUrlSchema = httpsUrlSchema.refine(
  (value) =>
    value.startsWith(
      'https://github.com/anilloutombam/mcp-failure-lab/blob/main/docs/compatibility/',
    ),
  { message: 'Use an MCP Failure Lab compatibility report URL.' },
)

const sourceRunSchema = z.tuple([
  stableIdSchema,
  z.enum(['stdio', 'streamable-http']),
  z.enum(['passed', 'failed', 'needs-review']),
  z.number().nonnegative().finite().nullable(),
  z.string().trim().min(1),
])

const sourceFindingSchema = z
  .object({
    id: stableIdSchema,
    run: z.string().min(3),
    statement: z.string().trim().min(1),
    category: z.enum([
      'compatibility',
      'recovery',
      'protocol-behavior',
      'transport',
      'reliability',
      'other',
    ]),
    reportingStatus: z.enum(['reported', 'already-reported']),
    repository: z.string().regex(/^[^/\s]+\/[^/\s]+$/),
    issueNumber: z.number().int().positive(),
    issueUrl: httpsUrlSchema,
    commentUrl: httpsUrlSchema.optional(),
    reportedAt: z.iso.datetime(),
  })
  .strict()
  .superRefine((finding, context) => {
    const expectedPath = `/${finding.repository}/issues/${finding.issueNumber}`
    const issueUrl = new URL(finding.issueUrl)
    if (
      issueUrl.hostname !== 'github.com' ||
      issueUrl.pathname !== expectedPath ||
      issueUrl.search ||
      issueUrl.hash
    ) {
      context.addIssue({
        code: 'custom',
        path: ['issueUrl'],
        message: `Issue URL must match ${finding.repository}#${finding.issueNumber}.`,
      })
    }

    if (finding.commentUrl) {
      const commentUrl = new URL(finding.commentUrl)
      if (
        commentUrl.hostname !== 'github.com' ||
        commentUrl.pathname !== expectedPath ||
        commentUrl.search ||
        !/^#issuecomment-\d+$/.test(commentUrl.hash)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['commentUrl'],
          message: `Comment URL must point to a comment on ${finding.repository}#${finding.issueNumber}.`,
        })
      }
    }
  })

const sourceReportSchema = z
  .object({
    id: stableIdSchema,
    testedOn: z.iso.date(),
    sourceUrl: failureLabReportUrlSchema,
    implementation: z
      .object({
        name: z.string().trim().min(1),
        slug: slugSchema,
        version: z.string().trim().min(1),
        kind: z.enum(['client', 'server', 'proxy']),
        repositoryUrl: httpsUrlSchema,
      })
      .strict(),
    outcomes: z
      .array(
        z
          .object({
            scenario: z.tuple([
              z.string().trim().min(1),
              slugSchema,
              z.enum([
                'baseline',
                'timing',
                'transport',
                'protocol',
                'lifecycle',
                'other',
              ]),
            ]),
            runs: z.array(sourceRunSchema).min(1),
          })
          .strict(),
      )
      .min(1),
    findings: z.array(sourceFindingSchema).optional(),
  })
  .strict()

const sourceDataSchema = z
  .object({
    schemaVersion: z.literal(1),
    reports: z.array(sourceReportSchema).min(1),
  })
  .strict()

export type SourceRun = z.infer<typeof sourceRunSchema>
export type SourceFinding = z.infer<typeof sourceFindingSchema>
export type SourceReport = z.infer<typeof sourceReportSchema>
export type SourceData = z.infer<typeof sourceDataSchema>

export function runSourceKey(
  reportId: string,
  scenarioSlug: string,
  runKey: string,
) {
  return `mcp-failure-lab:${reportId}:${scenarioSlug}:${runKey}`
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`)
    seen.add(value)
  }
}

export function validateSource(input: unknown): SourceData {
  const data = sourceDataSchema.parse(input)
  assertUnique(
    data.reports.map((report) => report.id),
    'report',
  )

  const sourceKeys: string[] = []
  const implementationIdentities = new Map<string, string>()
  const scenarioIdentities = new Map<string, string>()

  for (const report of data.reports) {
    const implementationIdentity = JSON.stringify({
      name: report.implementation.name,
      slug: report.implementation.slug,
      kind: report.implementation.kind,
      repositoryUrl: report.implementation.repositoryUrl,
    })
    const previousImplementation = implementationIdentities.get(
      report.implementation.slug,
    )
    if (
      previousImplementation &&
      previousImplementation !== implementationIdentity
    ) {
      throw new Error(
        `Conflicting implementation metadata: ${report.implementation.slug}`,
      )
    }
    implementationIdentities.set(
      report.implementation.slug,
      implementationIdentity,
    )

    const runAliases: string[] = []
    for (const outcome of report.outcomes) {
      const [scenarioName, scenarioSlug, scenarioCategory] = outcome.scenario
      const scenarioIdentity = `${scenarioName}\u0000${scenarioCategory}`
      const previousScenario = scenarioIdentities.get(scenarioSlug)
      if (previousScenario && previousScenario !== scenarioIdentity) {
        throw new Error(`Conflicting scenario metadata: ${scenarioSlug}`)
      }
      scenarioIdentities.set(scenarioSlug, scenarioIdentity)

      for (const [key] of outcome.runs) {
        const alias = `${scenarioSlug}:${key}`
        runAliases.push(alias)
        sourceKeys.push(runSourceKey(report.id, scenarioSlug, key))
      }
    }
    assertUnique(runAliases, `run alias in ${report.id}`)

    const findingIds = (report.findings ?? []).map((finding) => finding.id)
    assertUnique(findingIds, `finding id in ${report.id}`)
    const availableRuns = new Set(runAliases)
    for (const finding of report.findings ?? []) {
      if (!availableRuns.has(finding.run)) {
        throw new Error(
          `Finding ${report.id}:${finding.id} references missing run ${finding.run}.`,
        )
      }
    }
  }

  assertUnique(sourceKeys, 'source key')
  return data
}
