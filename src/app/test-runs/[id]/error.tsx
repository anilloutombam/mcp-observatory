'use client'

import Link from 'next/link'

export default function TestRunError({ reset }: { reset: () => void }) {
  return (
    <main className="centered-state">
      <div>
        <span>!</span>
        <h1>Test run is unavailable</h1>
        <p>We couldn’t load this record from Sanity.</p>
        <div className="state-actions">
          <button
            className="button button-primary"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link className="button button-secondary" href="/test-runs">
            All test runs
          </Link>
        </div>
      </div>
    </main>
  )
}
