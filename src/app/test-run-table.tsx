'use client'

import Link from 'next/link'
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
    <div
      className="runs-table-wrap"
      role="region"
      aria-label="Test runs table"
      tabIndex={0}
    >
      <table className="runs-table">
        <caption className="sr-only">
          Recorded MCP compatibility test runs
        </caption>
        <thead>
          <tr>
            {showImplementation && <th scope="col">Implementation</th>}
            <th scope="col">Scenario</th>
            {!showImplementation && <th scope="col">Version</th>}
            <th scope="col">Transport</th>
            <th scope="col">Status</th>
            <th scope="col">{dateLabel}</th>
            <th scope="col">Context</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr
              className="runs-table-row-link"
              key={run._id}
              onClick={() => openRun(run._id)}
            >
              {showImplementation && (
                <td data-label="Implementation">
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
              <td data-label="Scenario">
                <Link
                  className="run-scenario-link"
                  href={`/test-runs/${encodeURIComponent(run._id)}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  {run.scenario?.name ?? 'Unknown scenario'}
                </Link>
                <small>{run.scenario?.category ?? 'uncategorized'}</small>
              </td>
              {!showImplementation && (
                <td data-label="Version">
                  <strong>v{run.version}</strong>
                </td>
              )}
              <td data-label="Transport">
                <TransportBadge transport={run.transport} />
              </td>
              <td data-label="Status">
                <StatusBadge status={run.status} />
              </td>
              <td data-label={dateLabel}>
                <time dateTime={recordedAt(run)}>{displayDate(run)}</time>
              </td>
              <td data-label="Context">
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
