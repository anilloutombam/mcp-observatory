import { defineQuery } from 'next-sanity'

import { client } from './client'

type SitemapImplementation = {
  slug: string
  updatedAt: string
}

type SitemapTestRun = {
  id: string
  updatedAt: string
}

const implementationSitemapQuery = defineQuery(/* groq */ `
  *[_type == "implementation" && defined(slug.current)] {
    "slug": slug.current,
    "updatedAt": _updatedAt
  }
`)

const testRunSitemapQuery = defineQuery(/* groq */ `
  *[_type == "testRun"] {
    "id": _id,
    "updatedAt": _updatedAt
  }
`)

export async function getSitemapRecords() {
  const [implementations, testRuns] = await Promise.all([
    client.fetch<SitemapImplementation[]>(implementationSitemapQuery),
    client.fetch<SitemapTestRun[]>(testRunSitemapQuery),
  ])

  return { implementations, testRuns }
}
