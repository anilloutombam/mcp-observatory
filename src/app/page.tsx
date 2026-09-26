import { Suspense } from 'react'

import { getDashboardData } from '@/sanity/lib/dashboard'
import { Dashboard } from './dashboard'
import { DashboardSkeleton } from './loading'

async function DashboardContent() {
  let data

  try {
    data = await getDashboardData()
  } catch (error) {
    console.error('Unable to load Observatory dashboard', error)
    return <DashboardError />
  }

  return <Dashboard data={data} />
}

function DashboardError() {
  return (
    <main className="centered-state">
      <div>
        <span>!</span>
        <h1>Observatory data is unavailable</h1>
        <p>
          We couldn’t reach Sanity. Check the project configuration or try again
          shortly.
        </p>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
