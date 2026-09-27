'use client'

import { useRouter } from 'next/navigation'

import type { RunStatus } from '@/sanity/lib/dashboard'
import { ImplementationIcon } from './implementation-icon'
import { StatusBadge } from './status-badge'
import { TransportBadge } from './transport-badge'

export type TestRunTableItem = {
  _id: string
  _createdAt: string
  version: string
  transport: 'stdio' | 'streamable-http'
  status: RunStatus
  startedAt?: string
  testedOn?: string
  evidenceCount: number
  findingCount: number
  implementation?: { name: string; slug: string } | null
  scenario?: { name: string; category?: string } | null
}

function recordedAt(run: TestRunTableItem) {
  return run.startedAt ?? run.testedOn ?? run._createdAt
}

function displayDate(run: TestRunTableItem) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(recordedAt(run)))
}

export function TestRunTable({
  runs,
  showImplementation = true,
  dateLabel = 'Recorded',
}: {
  runs: TestRunTableItem[]
  showImplementation?: boolean
  dateLabel?: string
}) {
  const router = useRouter()
  const openRun = (id: string) =>
    router.push(`/test-runs/${encodeURIComponent(id)}`)

  return (
    <div className="runs-table-wrap">
      <table className="runs-table">
        <thead>
          <tr>
            {showImplementation && <th>Implementation</th>}
            <th>Scenario</th>
            {!showImplementation && <th>Version</th>}
            <th>Transport</th>
            <th>Status</th>
            <th>{dateLabel}</th>
            <th>Context</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr
              className="runs-table-row-link"
              key={run._id}
              role="link"
              tabIndex={0}
              aria-label={`View ${run.implementation?.name ?? ''} test run for ${run.scenario?.name ?? 'unknown scenario'}`.trim()}
              onClick={() => openRun(run._id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openRun(run._id)
                }
              }}
            >
              {showImplementation && (
                <td>
                  <div className="run-implementation">
                    <ImplementationIcon
                      name={run.implementation?.name ?? 'Unknown'}
                      slug={run.implementation?.slug}
                    />
                    <span>
                      {run.implementation?.slug ? (
                        <button
                          className="run-implementation-link"
                          type="button"
                          onKeyDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation()
                            router.push(
                              `/implementations/${encodeURIComponent(run.implementation!.slug)}`,
                            )
                          }}
                        >
                          {run.implementation.name}
                        </button>
                      ) : (
                        <strong>Unknown</strong>
                      )}
                      <small>v{run.version}</small>
                    </span>
                  </div>
                </td>
              )}
              <td>
                <strong>{run.scenario?.name ?? 'Unknown scenario'}</strong>
                <small>{run.scenario?.category ?? 'uncategorized'}</small>
              </td>
              {!showImplementation && (
                <td>
                  <strong>v{run.version}</strong>
                </td>
              )}
              <td>
                <TransportBadge transport={run.transport} />
              </td>
              <td>
                <StatusBadge status={run.status} />
              </td>
              <td>
                <time dateTime={recordedAt(run)}>{displayDate(run)}</time>
              </td>
              <td>
                <span className="context-count">
                  {run.evidenceCount} evidence
                </span>
                <span className="context-count">
                  {run.findingCount} findings
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
