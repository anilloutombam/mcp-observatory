import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="centered-state">
      <div>
        <span>404</span>
        <h1>Page not found</h1>
        <p>The page may have moved, or the link may be incorrect.</p>
        <Link className="button button-secondary" href="/">
          Back to overview
        </Link>
      </div>
    </main>
  )
}
