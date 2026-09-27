import type { Metadata } from 'next'

import { getTestRunsData } from '@/sanity/lib/test-runs'
import { TestRunsView } from './test-runs-view'

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

export default async function TestRunsPage() {
  const data = await getTestRunsData()
  return <TestRunsView data={data} />
}
