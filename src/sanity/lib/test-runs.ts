import { defineQuery } from 'next-sanity'

import { client } from './client'
import type { RunStatus } from './dashboard'

export type TestRunListItem = {
  _id: string
  _createdAt: string
  implementation: { _id: string; name: string; slug: string } | null
  scenario: { _id: string; name: string; slug: string; category: string } | null
  version: string
  transport: 'stdio' | 'streamable-http'
  status: RunStatus
  testedOn?: string
  startedAt?: string
  durationMs?: number
  observations?: string[]
  evidenceCount: number
  findingCount: number
}

export type TestRunsData = {
  runs: TestRunListItem[]
  implementations: Array<{ _id: string; name: string; slug: string }>
  scenarios: Array<{ _id: string; name: string; slug: string }>
}

export const testRunsQuery = defineQuery(/* groq */ `{
  "runs": *[_type == "testRun"] | order(_createdAt desc) {
    _id, _createdAt,
    "implementation": implementation->{_id, name, "slug": slug.current},
    "scenario": scenario->{_id, name, "slug": slug.current, category},
    version, transport, status, testedOn, startedAt, durationMs, observations,
    "evidenceCount": count(*[_type == "evidence" && testRun._ref == ^._id]),
    "findingCount": count(*[_type == "finding" && testRun._ref == ^._id])
  },
  "implementations": *[_type == "implementation"] | order(name asc) {
    _id, name, "slug": slug.current
  },
  "scenarios": *[_type == "scenario"] | order(name asc) {
    _id, name, "slug": slug.current
  }
}`)

export async function getTestRunsData() {
  return client.fetch<TestRunsData>(
    testRunsQuery,
    {},
    { next: { revalidate: 60 } },
  )
}
