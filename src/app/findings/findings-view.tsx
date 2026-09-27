'use client'

import Link from 'next/link'
import { useMemo, useState, type ChangeEvent } from 'react'

import type {
  FindingListItem,
  FindingReviewStatus,
  FindingsData,
} from '@/sanity/lib/findings'
import { AppSidebar } from '../app-sidebar'
import {
  FindingReportingBadge,
  reportingLabels,
} from '../finding-reporting-badge'
import { ImplementationIcon } from '../implementation-icon'
import { SummaryCard } from '../summary-card'

const PAGE_SIZE = 10
const reviewLabels: Record<FindingReviewStatus, string> = {
  'needs-review': 'Needs review',
  verified: 'Verified',
  rejected: 'Rejected',
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

function ReviewBadge({ status }: { status: FindingReviewStatus }) {
  return (
    <span className={`review-state review-${status}`}>
      {reviewLabels[status]}
    </span>
  )
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children} ↗
    </a>
  )
}

function FindingCard({ finding }: { finding: FindingListItem }) {
  const implementation = finding.testRun?.implementation

  return (
    <article className="finding-list-card">
      <div className="finding-list-main">
        <div className="finding-list-heading">
          <div className="finding-badges">
            <ReviewBadge status={finding.status} />
            <FindingReportingBadge status={finding.reportingStatus} />
          </div>
          <span className="finding-category">{finding.category}</span>
        </div>
        <h2>{finding.statement}</h2>
        {finding.resolutionSummary && (
          <p className="finding-resolution">{finding.resolutionSummary}</p>
        )}
        <div className="finding-context">
          {implementation && (
            <span className="finding-implementation">
              <ImplementationIcon
                name={implementation.name}
                slug={implementation.slug}
              />
              <span>
                <strong>{implementation.name}</strong>
                <small>v{finding.testRun?.version}</small>
              </span>
            </span>
          )}
          {finding.testRun?.scenario && (
            <span>
              <small>Scenario</small>
              <strong>{finding.testRun.scenario.name}</strong>
            </span>
          )}
          {finding.upstreamRepository && (
            <span>
              <small>Repository</small>
              <strong>{finding.upstreamRepository}</strong>
            </span>
          )}
          <span>
            <small>Evidence</small>
            <strong>{finding.supportingEvidenceCount}</strong>
          </span>
        </div>
      </div>
      <div className="finding-list-actions">
        {finding.testRun && (
          <Link href={`/test-runs/${encodeURIComponent(finding.testRun._id)}`}>
            View test run
          </Link>
        )}
        {finding.upstreamIssueUrl && (
          <ExternalLink href={finding.upstreamIssueUrl}>
            {finding.upstreamIssueNumber
              ? `Issue #${finding.upstreamIssueNumber}`
              : 'Upstream issue'}
          </ExternalLink>
        )}
        {finding.upstreamCommentUrl && (
          <ExternalLink href={finding.upstreamCommentUrl}>
            Evidence comment
          </ExternalLink>
        )}
      </div>
    </article>
  )
}

export function FindingsView({ data }: { data: FindingsData }) {
  const [search, setSearch] = useState('')
  const [reviewStatus, setReviewStatus] = useState('')
  const [reportingStatus, setReportingStatus] = useState('')
  const [repository, setRepository] = useState('')
  const [category, setCategory] = useState('')
  const [implementation, setImplementation] = useState('')
  const [page, setPage] = useState(1)

  const repositories = useMemo(
    () =>
      [
        ...new Set(
          data.findings.flatMap((item) => item.upstreamRepository ?? []),
        ),
      ]
        .filter(Boolean)
        .sort(),
    [data.findings],
  )
  const categories = useMemo(
    () => [...new Set(data.findings.map((item) => item.category))].sort(),
    [data.findings],
  )
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.findings.filter((finding) => {
      const implementationIds = [
        finding.testRun?.implementation?._id,
        ...finding.affectedImplementations.map((item) => item._id),
      ]
      return (
        (!term ||
          finding.statement.toLowerCase().includes(term) ||
          finding.upstreamRepository?.toLowerCase().includes(term) ||
          finding.testRun?.implementation?.name.toLowerCase().includes(term)) &&
        (!reviewStatus || finding.status === reviewStatus) &&
        (!reportingStatus || finding.reportingStatus === reportingStatus) &&
        (!repository || finding.upstreamRepository === repository) &&
        (!category || finding.category === category) &&
        (!implementation || implementationIds.includes(implementation))
      )
    })
  }, [
    category,
    data.findings,
    implementation,
    reportingStatus,
    repository,
    reviewStatus,
    search,
  ])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const update =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(event.target.value)
      setPage(1)
    }
  const clear = () => {
    setSearch('')
    setReviewStatus('')
    setReportingStatus('')
    setRepository('')
    setCategory('')
    setImplementation('')
    setPage(1)
  }

  return (
    <div className="app-shell runs-page findings-page">
      <AppSidebar active="findings" />
      <main className="runs-workspace">
        <header className="runs-topbar">
          <div>
            <p className="eyebrow">Compatibility intelligence</p>
            <h1>Findings</h1>
            <p>Review confirmed behavior and its upstream reporting state.</p>
          </div>
          <Link className="button button-secondary" href="/">
            ← Overview
          </Link>
        </header>
        <div className="runs-content">
          <section className="runs-summary">
            <SummaryCard
              value={data.findings.length}
              label="Total findings"
              detail="Across all test runs"
              icon="finding"
              tone="blue"
            />
            <SummaryCard
              value={
                data.findings.filter((item) => item.status === 'verified')
                  .length
              }
              label="Verified"
              detail="Human-confirmed findings"
              icon="verified"
              tone="green"
            />
            <SummaryCard
              value={
                data.findings.filter((item) => item.status === 'needs-review')
                  .length
              }
              label="Needs review"
              detail="Awaiting confirmation"
              icon="finding"
              tone="purple"
            />
            <SummaryCard
              value={
                data.findings.filter((item) =>
                  ['reported', 'already-reported', 'resolved'].includes(
                    item.reportingStatus,
                  ),
                ).length
              }
              label="Upstream linked"
              detail="Issues or evidence comments"
              icon="passed"
              tone="green"
            />
          </section>

          <section className="runs-panel">
            <div className="findings-toolbar">
              <label className="runs-search">
                <SearchIcon />
                <input
                  value={search}
                  onChange={update(setSearch)}
                  placeholder="Search finding, implementation, or repository"
                  aria-label="Search findings"
                />
              </label>
              <select
                value={reviewStatus}
                onChange={update(setReviewStatus)}
                aria-label="Filter by review status"
              >
                <option value="">All review statuses</option>
                {Object.entries(reviewLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={reportingStatus}
                onChange={update(setReportingStatus)}
                aria-label="Filter by reporting status"
              >
                <option value="">All reporting states</option>
                {Object.entries(reportingLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={repository}
                onChange={update(setRepository)}
                aria-label="Filter by repository"
              >
                <option value="">All repositories</option>
                {repositories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={category}
                onChange={update(setCategory)}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={implementation}
                onChange={update(setImplementation)}
                aria-label="Filter by implementation"
              >
                <option value="">All implementations</option>
                {data.implementations.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="runs-results-bar">
              <span>
                <strong>{filtered.length}</strong> results
              </span>
              {(search ||
                reviewStatus ||
                reportingStatus ||
                repository ||
                category ||
                implementation) && (
                <button type="button" onClick={clear}>
                  Clear filters
                </button>
              )}
            </div>

            {visible.length ? (
              <>
                <div className="finding-list">
                  {visible.map((finding) => (
                    <FindingCard finding={finding} key={finding._id} />
                  ))}
                </div>
                <div className="pagination">
                  <span>
                    Page {current} of {pages}
                  </span>
                  <div>
                    <button
                      type="button"
                      disabled={current === 1}
                      onClick={() => setPage(current - 1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
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
                <strong>No findings found</strong>
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
