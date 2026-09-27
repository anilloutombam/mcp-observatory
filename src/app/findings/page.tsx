import type { Metadata } from 'next'

import { getFindingsData } from '@/sanity/lib/findings'
import { FindingsView } from './findings-view'

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

export default async function FindingsPage() {
  const data = await getFindingsData()
  return <FindingsView data={data} />
}
