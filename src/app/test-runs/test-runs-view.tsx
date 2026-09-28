'use client'

import Link from 'next/link'
import { useMemo, useState, type ChangeEvent } from 'react'

import type { TestRunsData } from '@/sanity/lib/test-runs'
import { AppPageShell } from '../app-page-shell'
import { CopyPageLinkButton, useShareableUrl } from '../shareable-url'
import { statusLabels } from '../status-badge'
import { SummaryCard } from '../summary-card'
import { TestRunTable } from '../test-run-table'
import { SiteFooter } from '../site-footer'

const PAGE_SIZE = 15
const validSorts = new Set(['newest', 'oldest', 'implementation'])
const validTransports = new Set(['stdio', 'streamable-http'])

export type TestRunUrlFilters = {
  q?: string
  implementation?: string
  scenario?: string
  status?: string
  transport?: string
  sort?: string
  page?: string
}

function initialPage(value?: string) {
  const page = Number.parseInt(value ?? '', 10)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
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

export function TestRunsView({
  data,
  initialFilters,
}: {
  data: TestRunsData
  initialFilters: TestRunUrlFilters
}) {
  const [search, setSearch] = useState(initialFilters.q ?? '')
  const [implementation, setImplementation] = useState(
    data.implementations.some(
      (item) => item.slug === initialFilters.implementation,
    )
      ? (initialFilters.implementation ?? '')
      : '',
  )
  const [scenario, setScenario] = useState(
    data.scenarios.some((item) => item.slug === initialFilters.scenario)
      ? (initialFilters.scenario ?? '')
      : '',
  )
  const [status, setStatus] = useState(
    initialFilters.status && initialFilters.status in statusLabels
      ? initialFilters.status
      : '',
  )
  const [transport, setTransport] = useState(
    initialFilters.transport && validTransports.has(initialFilters.transport)
      ? initialFilters.transport
      : '',
  )
  const [sort, setSort] = useState(
    initialFilters.sort && validSorts.has(initialFilters.sort)
      ? initialFilters.sort
      : 'newest',
  )
  const [page, setPage] = useState(initialPage(initialFilters.page))

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const matches = data.runs.filter(
      (run) =>
        (!term ||
          run.implementation?.name.toLowerCase().includes(term) ||
          run.scenario?.name.toLowerCase().includes(term) ||
          run.version.toLowerCase().includes(term)) &&
        (!implementation || run.implementation?.slug === implementation) &&
        (!scenario || run.scenario?.slug === scenario) &&
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

  useShareableUrl({
    q: search.trim() || undefined,
    implementation: implementation || undefined,
    scenario: scenario || undefined,
    status: status || undefined,
    transport: transport || undefined,
    sort: sort === 'newest' ? undefined : sort,
    page: current > 1 ? current : undefined,
  })

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
    <AppPageShell
      active="runs"
      title="Test Runs"
      description="Browse and compare every recorded compatibility test."
      action={
        <Link className="button button-secondary" href="/">
          ← Overview
        </Link>
      }
    >
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
          value={data.runs.filter((run) => run.status === 'unsupported').length}
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
          <div className="runs-results-actions">
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
            <CopyPageLinkButton />
          </div>
        </div>
        {rows.length ? (
          <>
            <TestRunTable runs={rows} />
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
      <SiteFooter />
    </AppPageShell>
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
  items: Array<{ _id: string; name: string; slug: string }>
}) {
  return (
    <select value={value} onChange={onChange} aria-label={label}>
      <option value="">{first}</option>
      {items.map((item) => (
        <option key={item._id} value={item.slug}>
          {item.name}
        </option>
      ))}
    </select>
  )
}
