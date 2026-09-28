import type {
  ImplementationDetail,
  ImplementationRun,
} from '@/sanity/lib/implementation-detail'
import type { RunStatus } from '@/sanity/lib/dashboard'
import { ExternalLink } from '../../external-link'
import { ImplementationIcon } from '../../implementation-icon'
import { TestRunTable } from '../../test-run-table'

type VersionSummary = {
  version: string
  runs: ImplementationRun[]
}

function runDate(run: ImplementationRun) {
  return run.startedAt ?? run.testedOn ?? run._createdAt
}

function formatDate(value?: string) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function statusCount(runs: ImplementationRun[], status: RunStatus) {
  return runs.filter((run) => run.status === status).length
}

function buildVersions(runs: ImplementationRun[]) {
  const grouped = new Map<string, ImplementationRun[]>()
  runs.forEach((run) => {
    grouped.set(run.version, [...(grouped.get(run.version) ?? []), run])
  })
  return [...grouped].map(([version, versionRuns]) => ({
    version,
    runs: versionRuns,
  }))
}

function VersionCard({ summary }: { summary: VersionSummary }) {
  const datedRuns = summary.runs
    .map(runDate)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))

  return (
    <article className="version-card">
      <div>
        <small>Version</small>
        <h3>v{summary.version}</h3>
      </div>
      <dl>
        <div>
          <dt>Runs</dt>
          <dd>{summary.runs.length}</dd>
        </div>
        <div>
          <dt>Passed</dt>
          <dd className="version-passed">
            {statusCount(summary.runs, 'passed')}
          </dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd className="version-failed">
            {statusCount(summary.runs, 'failed')}
          </dd>
        </div>
        <div>
          <dt>Last tested</dt>
          <dd>{formatDate(datedRuns[0])}</dd>
        </div>
      </dl>
    </article>
  )
}

export function ImplementationDetailView({
  implementation,
}: {
  implementation: ImplementationDetail
}) {
  const versions = buildVersions(implementation.runs)
  const scenarios = new Set(
    implementation.runs.flatMap((run) => run.scenario?._id ?? []),
  ).size

  return (
    <div className="implementation-detail">
      <section className="implementation-profile">
        <div className="implementation-profile-identity">
          <ImplementationIcon
            name={implementation.name}
            slug={implementation.slug}
          />
          <div>
            <small>{implementation.kind}</small>
            <h2>{implementation.name}</h2>
            {implementation.repositoryUrl && (
              <ExternalLink href={implementation.repositoryUrl}>
                <span>View repository</span>
              </ExternalLink>
            )}
          </div>
        </div>
        <div className="implementation-profile-stat">
          <small>Versions</small>
          <strong>{versions.length}</strong>
        </div>
        <div className="implementation-profile-stat">
          <small>Test runs</small>
          <strong>{implementation.runs.length}</strong>
        </div>
        <div className="implementation-profile-stat">
          <small>Scenarios</small>
          <strong>{scenarios}</strong>
        </div>
        <div className="implementation-profile-stat">
          <small>Passed</small>
          <strong>{statusCount(implementation.runs, 'passed')}</strong>
        </div>
      </section>

      {versions.length > 0 && (
        <section className="implementation-section">
          <div className="detail-section-heading">
            <div>
              <h2>Version history</h2>
              <p>Recorded outcomes grouped by tested version.</p>
            </div>
            <span>{versions.length}</span>
          </div>
          <div className="version-grid">
            {versions.map((summary) => (
              <VersionCard key={summary.version} summary={summary} />
            ))}
          </div>
        </section>
      )}

      <section className="implementation-section">
        <div className="detail-section-heading">
          <div>
            <h2>Compatibility history</h2>
            <p>
              Every recorded scenario and transport result for this
              implementation.
            </p>
          </div>
          <span>{implementation.runs.length}</span>
        </div>
        {implementation.runs.length ? (
          <TestRunTable
            runs={implementation.runs}
            showImplementation={false}
            dateLabel="Tested"
          />
        ) : (
          <div className="detail-empty">
            No compatibility tests are recorded for this implementation.
          </div>
        )}
      </section>
    </div>
  )
}
