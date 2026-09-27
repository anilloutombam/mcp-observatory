import Link from 'next/link'

import type {
  TestRunDetail,
  TestRunFinding,
} from '@/sanity/lib/test-run-detail'
import { FindingReportingBadge } from '../../finding-reporting-badge'
import { ImplementationIcon } from '../../implementation-icon'
import { StatusBadge } from '../../status-badge'
import { TransportBadge } from '../../transport-badge'

function formatDate(value?: string) {
  if (!value) return null
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined) return null
  if (durationMs < 1000) return `${durationMs} ms`
  return `${(durationMs / 1000).toFixed(durationMs < 10000 ? 1 : 0)} s`
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children} ↗
    </a>
  )
}

function FindingCard({ finding }: { finding: TestRunFinding }) {
  return (
    <article className="detail-card finding-card">
      <div className="detail-card-heading">
        <div>
          <span className="detail-kicker">{finding.category}</span>
          <h3>{finding.statement}</h3>
        </div>
        <FindingReportingBadge status={finding.reportingStatus} />
      </div>
      <dl className="inline-metadata">
        <div>
          <dt>Review</dt>
          <dd>{finding.status}</dd>
        </div>
        {finding.upstreamRepository && (
          <div>
            <dt>Repository</dt>
            <dd>{finding.upstreamRepository}</dd>
          </div>
        )}
        {finding.upstreamIssueState && (
          <div>
            <dt>Issue state</dt>
            <dd>{finding.upstreamIssueState}</dd>
          </div>
        )}
        {finding.reportedAt && (
          <div>
            <dt>Reported</dt>
            <dd>{formatDate(finding.reportedAt)}</dd>
          </div>
        )}
      </dl>
      {finding.resolutionSummary && <p>{finding.resolutionSummary}</p>}
      {(finding.upstreamIssueUrl || finding.upstreamCommentUrl) && (
        <div className="detail-links">
          {finding.upstreamIssueUrl && (
            <ExternalLink href={finding.upstreamIssueUrl}>
              {finding.upstreamIssueNumber
                ? `View issue #${finding.upstreamIssueNumber}`
                : 'View upstream issue'}
            </ExternalLink>
          )}
          {finding.upstreamCommentUrl && (
            <ExternalLink href={finding.upstreamCommentUrl}>
              View evidence comment
            </ExternalLink>
          )}
        </div>
      )}
    </article>
  )
}

export function TestRunDetailView({ run }: { run: TestRunDetail }) {
  const recorded = formatDate(run.startedAt ?? run.testedOn ?? run._createdAt)
  const duration = formatDuration(run.durationMs)

  return (
    <div className="runs-content test-run-detail">
      <section className="detail-summary" aria-label="Test run summary">
        <Link
          className="detail-implementation"
          href={
            run.implementation?.slug
              ? `/implementations/${encodeURIComponent(run.implementation.slug)}`
              : '/'
          }
        >
          <ImplementationIcon
            name={run.implementation?.name ?? 'Unknown'}
            slug={run.implementation?.slug}
          />
          <span>
            <small>Implementation</small>
            <strong>{run.implementation?.name ?? 'Unknown'}</strong>
            <em>v{run.version}</em>
          </span>
        </Link>
        <div className="detail-summary-item">
          <small>Status</small>
          <StatusBadge status={run.status} />
        </div>
        <div className="detail-summary-item">
          <small>Transport</small>
          <TransportBadge transport={run.transport} />
        </div>
        {recorded && (
          <div className="detail-summary-item">
            <small>Tested</small>
            <strong>{recorded}</strong>
          </div>
        )}
        {duration && (
          <div className="detail-summary-item">
            <small>Duration</small>
            <strong>{duration}</strong>
          </div>
        )}
      </section>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="detail-section">
            <div className="detail-section-heading">
              <div>
                <h2>Observations</h2>
                <p>Recorded behavior from this compatibility test.</p>
              </div>
            </div>
            {run.observations?.length ? (
              <ul className="observation-list">
                {run.observations.map((observation, index) => (
                  <li key={`${index}-${observation}`}>{observation}</li>
                ))}
              </ul>
            ) : (
              <p className="detail-empty">No observations were recorded.</p>
            )}
          </section>

          {run.evidence.length > 0 && (
            <section className="detail-section">
              <div className="detail-section-heading">
                <div>
                  <h2>Evidence</h2>
                  <p>Supporting records captured for this run.</p>
                </div>
                <span>{run.evidence.length}</span>
              </div>
              <div className="detail-card-list">
                {run.evidence.map((evidence) => (
                  <article
                    className="detail-card evidence-card"
                    key={evidence._id}
                  >
                    <div className="detail-card-heading">
                      <div>
                        <span className="detail-kicker">{evidence.type}</span>
                        <h3>{evidence.summary}</h3>
                      </div>
                      {evidence.capturedAt && (
                        <time>{formatDate(evidence.capturedAt)}</time>
                      )}
                    </div>
                    {evidence.source && <p>Source: {evidence.source}</p>}
                    {evidence.raw && (
                      <details className="raw-evidence">
                        <summary>View raw evidence</summary>
                        <pre>{evidence.raw}</pre>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {run.findings.length > 0 && (
            <section className="detail-section">
              <div className="detail-section-heading">
                <div>
                  <h2>Findings</h2>
                  <p>Reviewed conclusions and upstream reporting state.</p>
                </div>
                <span>{run.findings.length}</span>
              </div>
              <div className="detail-card-list">
                {run.findings.map((finding) => (
                  <FindingCard finding={finding} key={finding._id} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="detail-aside">
          <section className="detail-section">
            <h2>Run details</h2>
            <dl className="detail-metadata">
              <div>
                <dt>Scenario</dt>
                <dd>{run.scenario?.name ?? 'Unknown'}</dd>
              </div>
              {run.scenario?.category && (
                <div>
                  <dt>Category</dt>
                  <dd>{run.scenario.category}</dd>
                </div>
              )}
              <div>
                <dt>Version</dt>
                <dd>{run.version}</dd>
              </div>
              <div>
                <dt>Run ID</dt>
                <dd className="run-id">{run._id}</dd>
              </div>
            </dl>
            {(run.sourceReportUrl || run.implementation?.repositoryUrl) && (
              <div className="detail-links detail-aside-links">
                {run.sourceReportUrl && (
                  <ExternalLink href={run.sourceReportUrl}>
                    Source report
                  </ExternalLink>
                )}
                {run.implementation?.repositoryUrl && (
                  <ExternalLink href={run.implementation.repositoryUrl}>
                    Implementation repository
                  </ExternalLink>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
