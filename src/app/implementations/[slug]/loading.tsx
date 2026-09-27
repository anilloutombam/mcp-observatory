export default function ImplementationLoading() {
  return (
    <main className="centered-state">
      <div>
        <span className="loading-pulse" aria-hidden="true" />
        <h1>Loading implementation</h1>
        <p>Fetching versions and compatibility history from Sanity.</p>
      </div>
    </main>
  )
}
