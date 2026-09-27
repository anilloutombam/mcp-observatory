'use client'

import Link from 'next/link'

export function RouteError({
  title,
  message,
  reset,
}: {
  title: string
  message: string
  reset: () => void
}) {
  return (
    <main className="centered-state">
      <div>
        <span>!</span>
        <h1>{title}</h1>
        <p>{message}</p>
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
