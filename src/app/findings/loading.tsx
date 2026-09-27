export default function FindingsLoading() {
  return (
    <main className="centered-state">
      <div>
        <span className="loading-pulse" aria-hidden="true" />
        <h1>Loading findings</h1>
        <p>Fetching reviewed compatibility findings from Sanity.</p>
      </div>
    </main>
  )
}
