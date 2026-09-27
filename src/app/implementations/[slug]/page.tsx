import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getImplementationDetail } from '@/sanity/lib/implementation-detail'
import { AppSidebar } from '../../app-sidebar'
import { ImplementationDetailView } from './implementation-detail-view'

export default async function ImplementationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const implementation = await getImplementationDetail(decodeURIComponent(slug))

  if (!implementation) notFound()

  return (
    <div className="app-shell runs-page">
      <AppSidebar active="overview" />
      <main className="runs-workspace">
        <header className="runs-topbar implementation-topbar">
          <div>
            <p className="eyebrow">Implementation</p>
            <h1>{implementation.name}</h1>
            <p>
              {implementation.description ??
                'MCP compatibility history and recorded outcomes.'}
            </p>
          </div>
          <Link className="button button-secondary" href="/">
            ← Overview
          </Link>
        </header>
        <ImplementationDetailView implementation={implementation} />
      </main>
    </div>
  )
}
