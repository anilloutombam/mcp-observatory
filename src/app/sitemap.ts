import type { MetadataRoute } from 'next'

import { getSitemapRecords } from '@/sanity/lib/sitemap'

const origin = 'https://observatory.mcplab.dev'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: origin, changeFrequency: 'daily', priority: 1 },
    {
      url: `${origin}/test-runs`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${origin}/findings`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${origin}/comparisons`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${origin}/methodology`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  try {
    const { implementations, testRuns } = await getSitemapRecords()

    return [
      ...staticPages,
      ...implementations.map((item) => ({
        url: `${origin}/implementations/${encodeURIComponent(item.slug)}`,
        lastModified: new Date(item.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...testRuns.map((item) => ({
        url: `${origin}/test-runs/${encodeURIComponent(item.id)}`,
        lastModified: new Date(item.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
    ]
  } catch (error) {
    console.error('Unable to include Sanity records in sitemap', error)
    return staticPages
  }
}
