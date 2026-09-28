import type { Metadata } from 'next'

import { getTestRunsData } from '@/sanity/lib/test-runs'
import { searchParam, type PageSearchParams } from '../search-params'
import { TestRunsView, type TestRunUrlFilters } from './test-runs-view'

export const metadata: Metadata = {
  title: 'Test Runs',
  description:
    'Browse recorded MCP compatibility tests by implementation, scenario, status, and transport.',
  alternates: { canonical: '/test-runs' },
  openGraph: {
    title: 'Test Runs',
    description:
      'Browse recorded MCP compatibility tests by implementation, scenario, status, and transport.',
    url: '/test-runs',
  },
}

export default async function TestRunsPage({
  searchParams,
}: {
  searchParams: PageSearchParams
}) {
  const params = await searchParams
  const initialFilters: TestRunUrlFilters = {
    q: searchParam(params, 'q'),
    implementation: searchParam(params, 'implementation'),
    scenario: searchParam(params, 'scenario'),
    status: searchParam(params, 'status'),
    transport: searchParam(params, 'transport'),
    sort: searchParam(params, 'sort'),
    page: searchParam(params, 'page'),
  }
  const data = await getTestRunsData()
  return <TestRunsView data={data} initialFilters={initialFilters} />
}
