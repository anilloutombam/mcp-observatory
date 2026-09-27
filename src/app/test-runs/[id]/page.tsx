import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getTestRunDetail } from '@/sanity/lib/test-run-detail'
import { AppSidebar } from '../../app-sidebar'
import { TestRunDetailView } from './test-run-detail-view'

export default async function TestRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const run = await getTestRunDetail(decodeURIComponent(id))

  if (!run) notFound()

  return (
    <div className="app-shell runs-page">
      <AppSidebar active="runs" />
      <main className="runs-workspace">
        <header className="runs-topbar test-run-topbar">
          <div>
            <p className="eyebrow">Test run</p>
            <h1>{run.implementation?.name ?? 'Unknown implementation'}</h1>
            <p>{run.scenario?.name ?? 'Unknown scenario'}</p>
          </div>
          <Link className="button button-secondary" href="/test-runs">
            ← All test runs
          </Link>
        </header>
        <TestRunDetailView run={run} />
      </main>
    </div>
  )
}
