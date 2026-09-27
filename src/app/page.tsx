import { Suspense } from 'react'

import { getDashboardData } from '@/sanity/lib/dashboard'
import { Dashboard } from './dashboard'
import { DashboardSkeleton } from './loading'

async function DashboardContent() {
  const data = await getDashboardData()
  return <Dashboard data={data} />
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
