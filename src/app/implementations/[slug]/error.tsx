'use client'

import Link from 'next/link'

export default function ImplementationError({ reset }: { reset: () => void }) {
  return (
    <main className="centered-state">
      <div>
        <span>!</span>
        <h1>Implementation is unavailable</h1>
        <p>We couldn’t load this implementation from Sanity.</p>
        <div className="state-actions">
          <button
            className="button button-primary"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link className="button button-secondary" href="/">
            Overview
          </Link>
        </div>
      </div>
    </main>
  )
}
