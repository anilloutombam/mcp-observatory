import Link from 'next/link'

export default function ImplementationNotFound() {
  return (
    <main className="centered-state">
      <div>
        <span>404</span>
        <h1>Implementation not found</h1>
        <p>
          This implementation may have been removed or the link is incorrect.
        </p>
        <Link className="button button-secondary" href="/">
          Back to overview
        </Link>
      </div>
    </main>
  )
}
