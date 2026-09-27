import { defineQuery } from 'next-sanity'

import { client } from './client'
import type { RunStatus } from './dashboard'

export type ImplementationRun = {
  _id: string
  _createdAt: string
  version: string
  transport: 'stdio' | 'streamable-http'
  status: RunStatus
  startedAt?: string
  testedOn?: string
  durationMs?: number
  observations?: string[]
  scenario: {
    _id: string
    name: string
    slug: string
    category: string
  } | null
  evidenceCount: number
  findingCount: number
}

export type ImplementationDetail = {
  _id: string
  name: string
  slug: string
  kind: string
  repositoryUrl?: string
  description?: string
  runs: ImplementationRun[]
}

const implementationDetailQuery = defineQuery(/* groq */ `
  *[_type == "implementation" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    kind,
    repositoryUrl,
    description,
    "runs": *[_type == "testRun" && implementation._ref == ^._id]
      | order(startedAt desc, testedOn desc, _createdAt desc) {
        _id,
        _createdAt,
        version,
        transport,
        status,
        startedAt,
        testedOn,
        durationMs,
        observations,
        "scenario": scenario->{
          _id,
          name,
          "slug": slug.current,
          category
        },
        "evidenceCount": count(*[
          _type == "evidence" && testRun._ref == ^._id
        ]),
        "findingCount": count(*[
          _type == "finding" && testRun._ref == ^._id
        ])
      }
  }
`)

export async function getImplementationDetail(slug: string) {
  return client.fetch<ImplementationDetail | null>(
    implementationDetailQuery,
    { slug },
    { next: { revalidate: 60 } },
  )
}
