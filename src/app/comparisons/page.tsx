import type { Metadata } from 'next'

import { getComparisonsData } from '@/sanity/lib/comparisons'
import { ComparisonsView } from './comparisons-view'

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

export default async function ComparisonsPage() {
  const data = await getComparisonsData()
  return <ComparisonsView data={data} />
}
