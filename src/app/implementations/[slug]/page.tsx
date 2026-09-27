import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getImplementationDetail } from '@/sanity/lib/implementation-detail'
import { AppPageShell } from '../../app-page-shell'
import { SiteFooter } from '../../site-footer'
import { ImplementationDetailView } from './implementation-detail-view'

type RouteProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const implementation = await getImplementationDetail(decodedSlug)

  if (!implementation) return { title: 'Implementation not found' }

  const description =
    implementation.description ??
    `Compatibility history, tested versions, and recorded outcomes for ${implementation.name}.`

  return {
    title: implementation.name,
    description,
    alternates: {
      canonical: `/implementations/${encodeURIComponent(implementation.slug)}`,
    },
    openGraph: {
      title: implementation.name,
      description,
      url: `/implementations/${encodeURIComponent(implementation.slug)}`,
    },
  }
}

export default async function ImplementationDetailPage({ params }: RouteProps) {
  const { slug } = await params
  const implementation = await getImplementationDetail(decodeURIComponent(slug))

  if (!implementation) notFound()

  return (
    <AppPageShell
      active="overview"
      eyebrow="Implementation"
      title={implementation.name}
      description={
        implementation.description ??
        'MCP compatibility history and recorded outcomes.'
      }
      headerClassName="implementation-topbar"
      contentClassName="implementation-detail-content"
      action={
        <Link className="button button-secondary" href="/">
          ← Overview
        </Link>
      }
    >
      <ImplementationDetailView implementation={implementation} />
      <SiteFooter />
    </AppPageShell>
  )
}
