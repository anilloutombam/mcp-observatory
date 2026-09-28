export type SourceRun = [
  key: string,
  transport: 'stdio' | 'streamable-http',
  status: 'passed' | 'failed' | 'needs-review',
  durationMs: number | null,
  observation: string,
]

export type SourceFinding = {
  id: string
  run: string
  statement: string
  category:
    | 'compatibility'
    | 'recovery'
    | 'protocol-behavior'
    | 'transport'
    | 'reliability'
    | 'other'
  reportingStatus: 'reported' | 'already-reported'
  repository: string
  issueNumber: number
  issueUrl: string
  commentUrl?: string
  reportedAt: string
}

export type SourceReport = {
  id: string
  testedOn: string
  sourceUrl: string
  implementation: {
    name: string
    slug: string
    version: string
    kind: 'server' | 'proxy'
    repositoryUrl: string
  }
  outcomes: Array<{
    scenario: [name: string, slug: string, category: string]
    runs: SourceRun[]
  }>
  findings?: SourceFinding[]
}

export type SourceData = {
  schemaVersion: number
  reports: SourceReport[]
}

export function runSourceKey(
  reportId: string,
  scenarioSlug: string,
  runKey: string,
) {
  return `mcp-failure-lab:${reportId}:${scenarioSlug}:${runKey}`
}

export function validateSource(data: SourceData) {
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
