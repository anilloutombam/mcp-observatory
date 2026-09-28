import type { Metadata } from 'next'
import Link from 'next/link'

import type { RunStatus } from '@/sanity/lib/dashboard'
import { AppPageShell } from '../app-page-shell'
import { ExternalLink } from '../external-link'
import { FindingReportingBadge } from '../finding-reporting-badge'
import { SiteFooter } from '../site-footer'
import { StatusBadge } from '../status-badge'

export const metadata: Metadata = {
  title: 'Methodology & Limitations',
  description:
    'How MCP Failure Observatory records tests, reviews evidence, assigns statuses, and reports findings upstream.',
  alternates: { canonical: '/methodology' },
  openGraph: {
    title: 'Methodology & Limitations',
    description:
      'How MCP Failure Observatory records tests, reviews evidence, assigns statuses, and reports findings upstream.',
    url: '/methodology',
  },
}

const testStatuses: Array<{ status: RunStatus; definition: string }> = [
  {
    status: 'passed',
    definition: 'The observed result matched the expectation for this test.',
  },
  {
    status: 'failed',
    definition: 'The observed result did not match the expectation.',
  },
  {
    status: 'needs-review',
    definition:
      'The result is recorded, but a person still needs to confirm its meaning.',
  },
  {
    status: 'unsupported',
    definition:
      'The implementation or transport does not support the capability required by the scenario.',
  },
  {
    status: 'not-run',
    definition: 'No completed test result was produced.',
  },
  {
    status: 'not-applicable',
    definition:
      'The scenario does not apply to this implementation or transport.',
  },
]

const reportingStates = [
  {
    status: 'reported',
    definition: 'The project opened a new upstream issue for the finding.',
  },
  {
    status: 'already-reported',
    definition:
      'A relevant issue already existed, so the project added its evidence there.',
  },
  {
    status: 'not-reported',
    definition: 'No upstream report is linked yet.',
  },
  {
    status: 'resolved',
    definition: 'The linked upstream problem is recorded as resolved.',
  },
  {
    status: 'not-actionable',
    definition:
      'The behavior is documented but does not represent an upstream defect to report.',
  },
]

export default function MethodologyPage() {
  return (
    <AppPageShell
      eyebrow="About the data"
      title="Methodology & limitations"
      description="How results enter the Observatory and how to interpret them."
      className="methodology-page"
      contentClassName="methodology-content"
      action={
        <Link className="button button-secondary" href="/">
          ← Overview
        </Link>
      }
    >
      <section className="methodology-intro">
        <span>Independent, evidence-backed research</span>
        <p>
          MCP Failure Observatory publishes structured results from MCP Failure
          Lab. It is an evidence index, not a certification program or a
          complete measure of implementation quality.
        </p>
      </section>

      <section className="methodology-section">
        <h2>How records are produced</h2>
        <ol className="methodology-steps">
          <li>
            A defined failure scenario is run against a named implementation
            version and transport.
          </li>
          <li>
            The observed behavior, timing, and source report are retained as
            evidence.
          </li>
          <li>A Test Run records the outcome for that specific combination.</li>
          <li>
            Material observations are reviewed before becoming verified
            Findings.
          </li>
          <li>
            When appropriate, the Finding links to a new upstream issue or to
            evidence added to an existing issue.
          </li>
        </ol>
      </section>

      <section className="methodology-section">
        <h2>Test status meanings</h2>
        <div className="definition-grid">
          {testStatuses.map(({ status, definition }) => (
            <article key={status}>
              <StatusBadge status={status} />
              <p>{definition}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="methodology-section">
        <h2>Upstream reporting meanings</h2>
        <div className="definition-grid">
          {reportingStates.map(({ status, definition }) => (
            <article key={status}>
              <FindingReportingBadge status={status} />
              <p>{definition}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="methodology-section">
        <h2>Sources and review</h2>
        <p>
          Test Runs and evidence originate in the public MCP Failure Lab
          reports. Implementation repository links identify the codebase tested.
          Findings retain their supporting evidence and, where available, links
          to upstream issues and comments. A “verified” Finding means a person
          reviewed the recorded evidence; it does not mean the upstream
          maintainers accepted the conclusion.
        </p>
      </section>

      <section className="methodology-section limitations">
        <h2>Limitations</h2>
        <ul>
          <li>
            Results apply only to the recorded version, environment, transport,
            and scenario.
          </li>
          <li>
            A missing matrix cell means there is no recorded result, not that an
            implementation failed.
          </li>
          <li>New releases may behave differently from the version shown.</li>
          <li>
            Timing results can vary by machine and should not be treated as
            general performance benchmarks.
          </li>
          <li>
            The dataset is selective and does not cover every MCP feature,
            implementation, or deployment environment.
          </li>
        </ul>
      </section>

      <section className="methodology-links">
        <ExternalLink
          href="https://github.com/anilloutombam/mcp-failure-lab/tree/main/docs/compatibility"
          iconWrapperClassName="methodology-link-icon"
        >
          <span>
            <small>Evidence archive</small>
            <strong>Read the source reports</strong>
          </span>
        </ExternalLink>
        <ExternalLink
          href="https://github.com/anilloutombam/mcp-observatory"
          iconWrapperClassName="methodology-link-icon"
        >
          <span>
            <small>Open source</small>
            <strong>Review the Observatory source</strong>
          </span>
        </ExternalLink>
      </section>

      <SiteFooter />
    </AppPageShell>
  )
}
