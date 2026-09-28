import type { Metadata } from 'next'

import { getComparisonsData } from '@/sanity/lib/comparisons'
import { searchParam, type PageSearchParams } from '../search-params'
import { ComparisonsView, type ComparisonUrlFilters } from './comparisons-view'

export const metadata: Metadata = {
  title: 'Comparisons',
  description:
    'Compare MCP implementation behavior across versions, scenarios, transports, and recorded outcomes.',
  alternates: { canonical: '/comparisons' },
  openGraph: {
    title: 'Comparisons',
    description:
      'Compare MCP implementation behavior across versions, scenarios, transports, and recorded outcomes.',
    url: '/comparisons',
  },
}

export default async function ComparisonsPage({
  searchParams,
}: {
  searchParams: PageSearchParams
}) {
  const params = await searchParams
  const initialFilters: ComparisonUrlFilters = {
    compare: searchParam(params, 'compare'),
    scenario: searchParam(params, 'scenario'),
    transport: searchParam(params, 'transport'),
  }
  const data = await getComparisonsData()
  return <ComparisonsView data={data} initialFilters={initialFilters} />
}
