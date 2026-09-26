'use client'

import { useMemo, useState, type ReactNode } from 'react'
import type {
  DashboardData,
  DashboardRun,
  RunStatus,
} from '@/sanity/lib/dashboard'
import { ImplementationIcon } from './implementation-icon'
import { SummaryCard } from './summary-card'
import { AppSidebar } from './app-sidebar'
import { StatusBadge, StatusIcon, statusLabels } from './status-badge'
import { TransportBadge } from './transport-badge'

const featureFlags = {
  runNewTest: false,
} as const

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    overview: (
      <>
        <path d="m12 3-8 4.5 8 4.5 8-4.5L12 3Z" />
        <path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
      </>
    ),
    runs: (
      <>
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v6h-6M9 12l2 2 4-4" />
      </>
    ),
    layers: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </>
    ),
    compare: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </>
    ),
    finding: (
      <>
        <path d="M9 18h6M10 22h4" />
        <path d="M8.2 14.7A7 7 0 1 1 15.8 14.7c-.9.7-1.3 1.4-1.3 2.3h-5c0-.9-.4-1.6-1.3-2.3Z" />
      </>
    ),
    workflow: (
      <>
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="15" y="3" width="6" height="6" rx="1" />
        <rect x="9" y="15" width="6" height="6" rx="1" />
        <path d="M9 6h6M6 9v3a3 3 0 0 0 3 3M18 9v3a3 3 0 0 1-3 3" />
      </>
    ),
    evidence: (
      <>
        <path d="M8 3h8l3 3v15H5V6l3-3Z" />
        <path d="M9 11h6M9 15h6M9 7h3" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 15l2 2-4 4-2-2a8 8 0 0 1-3 1l-1 3H7l-1-3a8 8 0 0 1-2-2l-3-1v-5l3-1a8 8 0 0 1 1-3L3 6l3-3 2 2a8 8 0 0 1 3-1l1-3h4l1 3a8 8 0 0 1 2 2l3 1v5l-3 1Z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    github: (
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.17-1.11-1.48-1.11-1.48-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    ),
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.evidence}
    </svg>
  )
}

function MatrixMark({ status }: { status?: RunStatus }) {
  return status ? (
    <span
      className={`matrix-mark status-${status}`}
      title={statusLabels[status]}
      aria-label={statusLabels[status]}
    >
      <StatusIcon status={status} />
    </span>
  ) : (
    <span
      className="matrix-mark status-empty"
      title="No data"
      aria-label="No data"
    >
      —
    </span>
  )
}
function formatDate(run: DashboardRun) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(run.startedAt ?? run._createdAt))
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const scenarios = useMemo(() => {
    const map = new Map<string, { _id: string; name: string; slug: string }>()
    for (const item of data.implementations)
      for (const run of item.runs)
        if (run.scenario) map.set(run.scenario._id, run.scenario)
    return [...map.values()]
  }, [data.implementations])
  const implementations = data.implementations.filter(
    (item) =>
      !normalizedQuery ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.runs.some((run) =>
        run.scenario?.name.toLowerCase().includes(normalizedQuery),
      ),
  )
  const runs = data.recentRuns.filter(
    (run) =>
      !normalizedQuery ||
      run.implementation?.name.toLowerCase().includes(normalizedQuery) ||
      run.scenario?.name.toLowerCase().includes(normalizedQuery) ||
      run.status.includes(normalizedQuery),
  )
  return (
    <div className="app-shell">
      <AppSidebar active="overview" />
      <main className="workspace" id="overview">
        <header className="topbar">
          <label className="search">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search implementations, scenarios, statuses…"
              aria-label="Search dashboard"
            />
          </label>
        </header>
        <div className="dashboard-wrap">
          <section className="hero">
            <div>
              <p className="eyebrow">Compatibility intelligence</p>
              <h1>MCP Failure Observatory</h1>
              <p>
                Explore how MCP implementations handle real failure scenarios
                across transports.
              </p>
            </div>
            <div className="hero-actions">
              <a
                className="button button-secondary"
                href="https://github.com/anilloutombam/mcp-observatory"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="github" />
                View on GitHub
              </a>
              {featureFlags.runNewTest && (
                <span className="button button-primary">▷ Run New Test</span>
              )}
            </div>
          </section>
          <section className="stats" aria-label="Dataset summary">
            <SummaryCard
              icon="layers"
              tone="blue"
              label="Implementations"
              value={data.implementationCount}
              detail={`${data.scenarioCount} scenarios represented`}
            />
            <SummaryCard
              icon="runs"
              tone="purple"
              label="Test Runs"
              value={data.testRunCount}
              detail="Across all scenarios"
            />
            <SummaryCard
              icon="finding"
              tone="red"
              label="Findings"
              value={data.findingCount}
              detail="Captured observations"
            />
            <SummaryCard
              icon="verified"
              tone="green"
              label="Verified"
              value={data.verifiedFindingCount}
              detail="Human-confirmed findings"
            />
          </section>
          <div className="dashboard-grid">
            <section className="panel matrix-panel" id="compare">
              <PanelHeading
                title="Compatibility Matrix"
                subtitle="Latest recorded outcome for each implementation and scenario"
                badge={`${scenarios.length} scenarios`}
              />
              {implementations.length && scenarios.length ? (
                <div className="table-scroll">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Implementation</th>
                        {scenarios.map((scenario) => (
                          <th key={scenario._id} title={scenario.name}>
                            {scenario.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {implementations.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div className="implementation">
                              <ImplementationIcon
                                name={item.name}
                                slug={item.slug}
                              />
                              <span>
                                <strong>{item.name}</strong>
                                <small>v{item.runs[0]?.version ?? '—'}</small>
                              </span>
                            </div>
                          </td>
                          {scenarios.map((scenario) => {
                            const matches = item.runs.filter(
                              (run) => run.scenario?._id === scenario._id,
                            )
                            const status =
                              matches.find((run) => run.transport === 'stdio')
                                ?.status ?? matches[0]?.status
                            return (
                              <td key={scenario._id}>
                                <MatrixMark status={status} />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  message={
                    normalizedQuery
                      ? 'No matrix results match your search.'
                      : 'No compatibility results are available yet.'
                  }
                />
              )}
              <div className="matrix-footer">
                <div
                  className="status-legend"
                  aria-label="Result status legend"
                >
                  {(Object.keys(statusLabels) as RunStatus[]).map((status) => (
                    <span key={status}>
                      <StatusIcon status={status} />
                      {statusLabels[status]}
                    </span>
                  ))}
                </div>
                <p className="matrix-note">
                  Shows stdio when available. Transport detail remains in each
                  test run.
                </p>
              </div>
            </section>
            <section className="panel recent-panel" id="runs">
              <PanelHeading
                title="Recent Test Runs"
                subtitle="Latest records added to the observatory"
                badge={`${data.recentRuns.length} shown`}
              />
              {runs.length ? (
                <div className="recent-list">
                  {runs.map((run) => (
                    <article className="run-row" key={run._id}>
                      <ImplementationIcon
                        name={
                          run.implementation?.name ?? 'Unknown implementation'
                        }
                        slug={run.implementation?.slug}
                      />
                      <div className="run-primary">
                        <strong>
                          {run.implementation?.name ?? 'Unknown implementation'}
                        </strong>
                        <span>{run.scenario?.name ?? 'Unknown scenario'}</span>
                      </div>
                      <div className="run-meta">
                        <TransportBadge transport={run.transport} />
                        <StatusBadge status={run.status} />
                        <time dateTime={run.startedAt ?? run._createdAt}>
                          {formatDate(run)}
                        </time>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  message={
                    normalizedQuery
                      ? 'No recent test runs match your search.'
                      : 'No test runs are available yet.'
                  }
                />
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function PanelHeading({
  title,
  subtitle,
  badge,
}: {
  title: string
  subtitle: string
  badge: string
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <span>{badge}</span>
    </div>
  )
}
function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <span>◇</span>
      <strong>Nothing to show</strong>
      <p>{message}</p>
    </div>
  )
}
