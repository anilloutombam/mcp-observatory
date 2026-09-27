'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type ChangeEvent } from 'react'

import type { TestRunListItem, TestRunsData } from '@/sanity/lib/test-runs'
import { AppSidebar } from '../app-sidebar'
import { ImplementationIcon } from '../implementation-icon'
import { StatusBadge, statusLabels } from '../status-badge'
import { SummaryCard } from '../summary-card'
import { TransportBadge } from '../transport-badge'

const PAGE_SIZE = 15
function displayDate(run: TestRunListItem) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(run.startedAt ?? run.testedOn ?? run._createdAt))
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  )
}

export function TestRunsView({ data }: { data: TestRunsData }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [implementation, setImplementation] = useState('')
  const [scenario, setScenario] = useState('')
  const [status, setStatus] = useState('')
  const [transport, setTransport] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const matches = data.runs.filter(
      (run) =>
        (!term ||
          run.implementation?.name.toLowerCase().includes(term) ||
          run.scenario?.name.toLowerCase().includes(term) ||
          run.version.toLowerCase().includes(term)) &&
        (!implementation || run.implementation?._id === implementation) &&
        (!scenario || run.scenario?._id === scenario) &&
        (!status || run.status === status) &&
        (!transport || run.transport === transport),
    )
    return [...matches].sort((a, b) =>
      sort === 'oldest'
        ? a._createdAt.localeCompare(b._createdAt)
        : sort === 'implementation'
          ? (a.implementation?.name ?? '').localeCompare(
              b.implementation?.name ?? '',
            )
          : b._createdAt.localeCompare(a._createdAt),
    )
  }, [data.runs, implementation, scenario, search, sort, status, transport])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const update =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(event.target.value)
      setPage(1)
    }
  const clear = () => {
    setSearch('')
    setImplementation('')
    setScenario('')
    setStatus('')
    setTransport('')
    setSort('newest')
    setPage(1)
  }

  return (
    <div className="app-shell runs-page">
      <AppSidebar active="runs" />
      <main className="runs-workspace">
        <header className="runs-topbar">
          <div>
            <p className="eyebrow">Compatibility intelligence</p>
            <h1>Test Runs</h1>
            <p>Browse and compare every recorded compatibility test.</p>
          </div>
          <Link className="button button-secondary" href="/">
            ← Overview
          </Link>
        </header>
        <div className="runs-content">
          <section className="runs-summary">
            <SummaryCard
              value={data.runs.length}
              label="Total runs"
              detail="Across all scenarios"
              icon="runs"
              tone="blue"
            />
            <SummaryCard
              value={data.runs.filter((run) => run.status === 'passed').length}
              label="Passed"
              detail="Successful outcomes"
              icon="passed"
              tone="green"
            />
            <SummaryCard
              value={data.runs.filter((run) => run.status === 'failed').length}
              label="Failed"
              detail="Recorded failures"
              icon="failed"
              tone="red"
            />
            <SummaryCard
              value={
                data.runs.filter((run) => run.status === 'unsupported').length
              }
              label="Unsupported"
              detail="Unsupported combinations"
              icon="unsupported"
              tone="purple"
            />
          </section>
          <section className="runs-panel">
            <div className="runs-toolbar">
              <label className="runs-search">
                <SearchIcon />
                <input
                  value={search}
                  onChange={update(setSearch)}
                  placeholder="Search implementation, scenario, or version"
                  aria-label="Search test runs"
                />
              </label>
              <Filter
                value={implementation}
                onChange={update(setImplementation)}
                label="Filter by implementation"
                first="All implementations"
                items={data.implementations}
              />
              <Filter
                value={scenario}
                onChange={update(setScenario)}
                label="Filter by scenario"
                first="All scenarios"
                items={data.scenarios}
              />
              <select
                value={status}
                onChange={update(setStatus)}
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={transport}
                onChange={update(setTransport)}
                aria-label="Filter by transport"
              >
                <option value="">All transports</option>
                <option value="stdio">stdio</option>
                <option value="streamable-http">Streamable HTTP</option>
              </select>
              <select
                value={sort}
                onChange={update(setSort)}
                aria-label="Sort test runs"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="implementation">Implementation A–Z</option>
              </select>
            </div>
            <div className="runs-results-bar">
              <span>
                <strong>{filtered.length}</strong> results
              </span>
              {(search ||
                implementation ||
                scenario ||
                status ||
                transport ||
                sort !== 'newest') && (
                <button type="button" onClick={clear}>
                  Clear filters
                </button>
              )}
            </div>
            {rows.length ? (
              <>
                <div className="runs-table-wrap">
                  <table className="runs-table">
                    <thead>
                      <tr>
                        <th>Implementation</th>
                        <th>Scenario</th>
                        <th>Transport</th>
                        <th>Status</th>
                        <th>Recorded</th>
                        <th>Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((run) => (
                        <tr
                          className="runs-table-row-link"
                          key={run._id}
                          role="link"
                          tabIndex={0}
                          aria-label={`View ${run.implementation?.name ?? 'unknown implementation'} test run for ${run.scenario?.name ?? 'unknown scenario'}`}
                          onClick={() =>
                            router.push(
                              `/test-runs/${encodeURIComponent(run._id)}`,
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              router.push(
                                `/test-runs/${encodeURIComponent(run._id)}`,
                              )
                            }
                          }}
                        >
                          <td>
                            <div className="run-implementation">
                              <ImplementationIcon
                                name={run.implementation?.name ?? 'Unknown'}
                                slug={run.implementation?.slug}
                              />
                              <span>
                                <strong className="run-detail-link">
                                  {run.implementation?.name ?? 'Unknown'}
                                </strong>
                                <small>v{run.version}</small>
                              </span>
                            </div>
                          </td>
                          <td>
                            <strong>{run.scenario?.name ?? 'Unknown'}</strong>
                            <small>
                              {run.scenario?.category ?? 'uncategorized'}
                            </small>
                          </td>
                          <td>
                            <TransportBadge transport={run.transport} />
                          </td>
                          <td>
                            <StatusBadge status={run.status} />
                          </td>
                          <td>
                            <time>{displayDate(run)}</time>
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
                <div className="pagination">
                  <span>
                    Page {current} of {pages}
                  </span>
                  <div>
                    <button
                      disabled={current === 1}
                      onClick={() => setPage(current - 1)}
                    >
                      Previous
                    </button>
                    <button
                      disabled={current === pages}
                      onClick={() => setPage(current + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span>◇</span>
                <strong>No test runs found</strong>
                <p>Adjust your filters or clear the search.</p>
                <button type="button" onClick={clear}>
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function Filter({
  value,
  onChange,
  label,
  first,
  items,
}: {
  value: string
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  label: string
  first: string
  items: Array<{ _id: string; name: string }>
}) {
  return (
    <select value={value} onChange={onChange} aria-label={label}>
      <option value="">{first}</option>
      {items.map((item) => (
        <option key={item._id} value={item._id}>
          {item.name}
        </option>
      ))}
    </select>
  )
}
