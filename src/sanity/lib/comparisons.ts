import { defineQuery } from 'next-sanity'

import { client } from './client'
import type { RunStatus } from './dashboard'

export type ComparisonRun = {
  _id: string
  _createdAt: string
  version: string
  transport: 'stdio' | 'streamable-http'
  status: RunStatus
  startedAt?: string
  testedOn?: string
  scenario: {
    _id: string
    name: string
    slug: string
    category: string
  } | null
}

export type ComparisonImplementation = {
  _id: string
  name: string
  slug: string
  kind: string
  repositoryUrl?: string
  runs: ComparisonRun[]
}

export type ComparisonsData = {
  implementations: ComparisonImplementation[]
  scenarios: Array<{
    _id: string
    name: string
    slug: string
    category: string
  }>
}

const comparisonsQuery = defineQuery(/* groq */ `{
  "implementations": *[_type == "implementation"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    kind,
    repositoryUrl,
    "runs": *[_type == "testRun" && implementation._ref == ^._id]
      | order(startedAt desc, testedOn desc, _createdAt desc) {
        _id,
        _createdAt,
        version,
        transport,
        status,
        startedAt,
        testedOn,
        "scenario": scenario->{
          _id,
          name,
          "slug": slug.current,
          category
        }
      }
  },
  "scenarios": *[_type == "scenario"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    category
  }
}`)

export async function getComparisonsData() {
  return client.fetch<ComparisonsData>(
    comparisonsQuery,
    {},
    { next: { revalidate: 60 } },
  )
}
