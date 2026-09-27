'use client'

import Link from 'next/link'
import { useMemo, useState, type ChangeEvent } from 'react'

import type {
  ComparisonImplementation,
  ComparisonRun,
  ComparisonsData,
} from '@/sanity/lib/comparisons'
import type { RunStatus } from '@/sanity/lib/dashboard'
import { AppSidebar } from '../app-sidebar'
import { ImplementationIcon } from '../implementation-icon'
import { StatusBadge, statusLabels } from '../status-badge'
import { TransportBadge } from '../transport-badge'

const MAX_SELECTIONS = 4

function versionsFor(implementation: ComparisonImplementation) {
  return [...new Set(implementation.runs.map((run) => run.version))]
}

function matchesTransport(run: ComparisonRun, transport: string) {
  return !transport || run.transport === transport
}

function countStatus(runs: ComparisonRun[], status: RunStatus) {
  return runs.filter((run) => run.status === status).length
}

function latestResults(runs: ComparisonRun[]) {
  const latest = new Map<string, ComparisonRun>()
  runs.forEach((run) => {
    const key = `${run.scenario?._id ?? 'unknown'}:${run.transport}`
    if (!latest.has(key)) latest.set(key, run)
  })
  return [...latest.values()]
}

function ComparisonResult({ run }: { run: ComparisonRun }) {
  return (
    <Link
      className="comparison-result"
      href={`/test-runs/${encodeURIComponent(run._id)}`}
      aria-label={`View ${run.transport} ${statusLabels[run.status]} test run`}
    >
      <TransportBadge transport={run.transport} />
      <StatusBadge status={run.status} />
    </Link>
  )
}

export function ComparisonsView({ data }: { data: ComparisonsData }) {
  const defaults = data.implementations
    .filter((item) => item.runs.length)
    .slice(0, 2)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    defaults.map((item) => item._id),
  )
  const [selectedVersions, setSelectedVersions] = useState<
    Record<string, string>
  >(
    Object.fromEntries(
      defaults.map((item) => [item._id, versionsFor(item)[0] ?? '']),
    ),
  )
  const [scenarioId, setScenarioId] = useState('')
  const [transport, setTransport] = useState('')

  const selected = useMemo(
    () => data.implementations.filter((item) => selectedIds.includes(item._id)),
    [data.implementations, selectedIds],
  )
  const selectedRuns = useMemo(
    () =>
      selected.flatMap((item) =>
        latestResults(
          item.runs.filter(
            (run) =>
              run.version ===
                (selectedVersions[item._id] ?? versionsFor(item)[0]) &&
              matchesTransport(run, transport),
          ),
        ),
      ),
    [selected, selectedVersions, transport],
  )
  const scenarios = useMemo(
    () =>
      data.scenarios.filter(
        (scenario) =>
          (!scenarioId || scenario._id === scenarioId) &&
          selectedRuns.some((run) => run.scenario?._id === scenario._id),
      ),
    [data.scenarios, scenarioId, selectedRuns],
  )

  const toggleImplementation = (implementation: ComparisonImplementation) => {
    setSelectedIds((current) => {
      if (current.includes(implementation._id)) {
        return current.filter((id) => id !== implementation._id)
      }
      if (current.length >= MAX_SELECTIONS) return current
      return [...current, implementation._id]
    })
    setSelectedVersions((current) => ({
      ...current,
      [implementation._id]:
        current[implementation._id] ?? versionsFor(implementation)[0] ?? '',
    }))
  }

  return (
    <div className="app-shell runs-page comparisons-page">
      <AppSidebar active="compare" />
      <main className="runs-workspace">
        <header className="runs-topbar">
          <div>
            <p className="eyebrow">Compatibility intelligence</p>
            <h1>Comparisons</h1>
            <p>
              Compare recorded MCP behavior by implementation, version,
              scenario, and transport.
            </p>
          </div>
          <Link className="button button-secondary" href="/">
            ← Overview
          </Link>
        </header>

        <div className="runs-content comparisons-content">
          <section className="comparison-control-panel">
            <div className="comparison-control-heading">
              <div>
                <h2>Choose implementations</h2>
                <p>
                  Select two to four implementations. Version selectors appear
                  below.
                </p>
              </div>
              <span>
                {selected.length}/{MAX_SELECTIONS} selected
              </span>
            </div>
            <div className="comparison-picker">
              {data.implementations.map((implementation) => {
                const checked = selectedIds.includes(implementation._id)
                const disabled =
                  !checked && selectedIds.length >= MAX_SELECTIONS
                return (
                  <label
                    className={`comparison-choice${checked ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                    key={implementation._id}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleImplementation(implementation)}
                    />
                    <ImplementationIcon
                      name={implementation.name}
                      slug={implementation.slug}
                    />
                    <span>
                      <strong>{implementation.name}</strong>
                      <small>{implementation.kind}</small>
                    </span>
                  </label>
                )
              })}
            </div>
          </section>

          {selected.length >= 2 ? (
            <>
              <section className="comparison-toolbar-panel">
                <div className="comparison-version-controls">
                  {selected.map((implementation) => (
                    <label key={implementation._id}>
                      <span>{implementation.name}</span>
                      <select
                        value={
                          selectedVersions[implementation._id] ??
                          versionsFor(implementation)[0] ??
                          ''
                        }
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          setSelectedVersions((current) => ({
                            ...current,
                            [implementation._id]: event.target.value,
                          }))
                        }
                      >
                        {versionsFor(implementation).map((version) => (
                          <option key={version} value={version}>
                            v{version}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="comparison-filters">
                  <select
                    value={scenarioId}
                    onChange={(event) => setScenarioId(event.target.value)}
                    aria-label="Filter by scenario"
                  >
                    <option value="">All scenarios</option>
                    {data.scenarios.map((scenario) => (
                      <option key={scenario._id} value={scenario._id}>
                        {scenario.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={transport}
                    onChange={(event) => setTransport(event.target.value)}
                    aria-label="Filter by transport"
                  >
                    <option value="">Both transports</option>
                    <option value="stdio">stdio</option>
                    <option value="streamable-http">Streamable HTTP</option>
                  </select>
                </div>
              </section>

              <section className="comparison-summaries">
                {selected.map((implementation) => {
                  const version =
                    selectedVersions[implementation._id] ??
                    versionsFor(implementation)[0]
                  const runs = latestResults(
                    implementation.runs.filter(
                      (run) =>
                        run.version === version &&
                        matchesTransport(run, transport),
                    ),
                  )
                  return (
                    <article
                      className="comparison-summary-card"
                      key={implementation._id}
                    >
                      <div className="comparison-summary-name">
                        <ImplementationIcon
                          name={implementation.name}
                          slug={implementation.slug}
                        />
                        <span>
                          <strong>{implementation.name}</strong>
                          <small>v{version}</small>
                        </span>
                      </div>
                      <dl>
                        <div>
                          <dt>Passed</dt>
                          <dd className="comparison-passed">
                            {countStatus(runs, 'passed')}
                          </dd>
                        </div>
                        <div>
                          <dt>Failed</dt>
                          <dd className="comparison-failed">
                            {countStatus(runs, 'failed')}
                          </dd>
                        </div>
                        <div>
                          <dt>Review</dt>
                          <dd>{countStatus(runs, 'needs-review')}</dd>
                        </div>
                        <div>
                          <dt>Unsupported</dt>
                          <dd>{countStatus(runs, 'unsupported')}</dd>
                        </div>
                      </dl>
                      <Link
                        href={`/implementations/${encodeURIComponent(implementation.slug)}`}
                      >
                        View implementation →
                      </Link>
                    </article>
                  )
                })}
              </section>

              <section className="comparison-matrix-panel">
                <div className="detail-section-heading">
                  <div>
                    <h2>Scenario comparison</h2>
                    <p>Each result is linked to its recorded Test Run.</p>
                  </div>
                  <span>{scenarios.length}</span>
                </div>
                {scenarios.length ? (
                  <div className="comparison-table-wrap">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          <th>Scenario</th>
                          {selected.map((implementation) => (
                            <th key={implementation._id}>
                              {implementation.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map((scenario) => (
                          <tr key={scenario._id}>
                            <th scope="row">
                              <strong>{scenario.name}</strong>
                              <small>{scenario.category}</small>
                            </th>
                            {selected.map((implementation) => {
                              const version =
                                selectedVersions[implementation._id] ??
                                versionsFor(implementation)[0]
                              const results = latestResults(
                                implementation.runs.filter(
                                  (run) =>
                                    run.version === version &&
                                    run.scenario?._id === scenario._id &&
                                    matchesTransport(run, transport),
                                ),
                              )
                              return (
                                <td key={implementation._id}>
                                  {results.length ? (
                                    results.map((run) => (
                                      <ComparisonResult
                                        key={run._id}
                                        run={run}
                                      />
                                    ))
                                  ) : (
                                    <span className="comparison-no-data">
                                      No record
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="detail-empty">
                    No recorded scenarios match this comparison.
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="comparison-prompt">
              <span>⇄</span>
              <h2>Select at least two implementations</h2>
              <p>
                Choose implementations above to build a compatibility
                comparison.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
