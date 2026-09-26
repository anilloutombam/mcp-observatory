export function DashboardSkeleton() {
  return (
    <div className="loading-shell">
      <aside />
      <main>
        <div className="skeleton top-skeleton" />
        <div className="skeleton title-skeleton" />
        <div className="skeleton-cards">
          {[1, 2, 3, 4].map((item) => (
            <div className="skeleton" key={item} />
          ))}
        </div>
        <div className="skeleton-panels">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </main>
    </div>
  )
}

export default DashboardSkeleton
