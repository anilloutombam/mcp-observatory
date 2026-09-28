import type { Metadata } from 'next'

import { getFindingsData } from '@/sanity/lib/findings'
import { searchParam, type PageSearchParams } from '../search-params'
import { FindingsView, type FindingUrlFilters } from './findings-view'

export const metadata: Metadata = {
  title: 'Findings',
  description:
    'Review verified MCP compatibility findings, supporting evidence, and upstream reporting state.',
  alternates: { canonical: '/findings' },
  openGraph: {
    title: 'Findings',
    description:
      'Review verified MCP compatibility findings, supporting evidence, and upstream reporting state.',
    url: '/findings',
  },
}

export default async function FindingsPage({
  searchParams,
}: {
  searchParams: PageSearchParams
}) {
  const params = await searchParams
  const initialFilters: FindingUrlFilters = {
    q: searchParam(params, 'q'),
    review: searchParam(params, 'review'),
    reporting: searchParam(params, 'reporting'),
    repository: searchParam(params, 'repository'),
    category: searchParam(params, 'category'),
    implementation: searchParam(params, 'implementation'),
    page: searchParam(params, 'page'),
  }
  const data = await getFindingsData()
  return <FindingsView data={data} initialFilters={initialFilters} />
}
