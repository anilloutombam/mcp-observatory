import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getTestRunDetail } from '@/sanity/lib/test-run-detail'
import { AppPageShell } from '../../app-page-shell'
import { SiteFooter } from '../../site-footer'
import { TestRunDetailView } from './test-run-detail-view'

type RouteProps = { params: Promise<{ id: string }> }

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { id } = await params
  const decodedId = decodeURIComponent(id)
  const run = await getTestRunDetail(decodedId)

  if (!run) return { title: 'Test run not found' }

  const implementation = run.implementation?.name ?? 'Unknown implementation'
  const scenario = run.scenario?.name ?? 'Unknown scenario'
  const title = `${implementation}: ${scenario}`
  const description = `${run.status} result for ${implementation} v${run.version} on ${scenario} using ${run.transport}.`

  return {
    title,
    description,
    alternates: {
      canonical: `/test-runs/${encodeURIComponent(run._id)}`,
    },
    openGraph: {
      title,
      description,
      url: `/test-runs/${encodeURIComponent(run._id)}`,
    },
  }
}

export default async function TestRunDetailPage({ params }: RouteProps) {
  const { id } = await params
  const run = await getTestRunDetail(decodeURIComponent(id))

  if (!run) notFound()

  return (
    <AppPageShell
      active="runs"
      eyebrow="Test run"
      title={run.implementation?.name ?? 'Unknown implementation'}
      description={run.scenario?.name ?? 'Unknown scenario'}
      headerClassName="test-run-topbar"
      contentClassName="test-run-detail-content"
      action={
        <Link className="button button-secondary" href="/test-runs">
          ← All test runs
        </Link>
      }
    >
      <TestRunDetailView run={run} />
      <SiteFooter />
    </AppPageShell>
  )
}
