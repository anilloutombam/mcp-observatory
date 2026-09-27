import Link from 'next/link'

export default function TestRunNotFound() {
  return (
    <main className="centered-state">
      <div>
        <span>404</span>
        <h1>Test run not found</h1>
        <p>This record may have been removed or the link may be incorrect.</p>
        <Link className="button button-secondary" href="/test-runs">
          Back to test runs
        </Link>
      </div>
    </main>
  )
}
