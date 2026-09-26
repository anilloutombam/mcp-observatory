import { defineQuery } from 'next-sanity'

import { client } from './client'

export type RunStatus =
  | 'passed'
  | 'failed'
  | 'needs-review'
  | 'unsupported'
  | 'not-run'
  | 'not-applicable'
export type DashboardRun = {
  _id: string
  _createdAt: string
  implementation: { _id: string; name: string; slug: string } | null
  version: string
  scenario: { _id: string; name: string; slug: string } | null
  transport: 'stdio' | 'streamable-http'
  status: RunStatus
  startedAt?: string
}
export type DashboardImplementation = {
  _id: string
  name: string
  slug: string
  runs: Array<{
    version: string
    transport: 'stdio' | 'streamable-http'
    status: RunStatus
    scenario: { _id: string; name: string; slug: string } | null
  }>
}
export type DashboardData = {
  implementationCount: number
  testRunCount: number
  scenarioCount: number
  findingCount: number
  verifiedFindingCount: number
  implementations: DashboardImplementation[]
  recentRuns: DashboardRun[]
}

const dashboardQuery = defineQuery(/* groq */ `{
  "implementationCount": count(*[_type == "implementation"]),
  "testRunCount": count(*[_type == "testRun"]),
  "scenarioCount": count(*[_type == "scenario"]),
  "findingCount": count(*[_type == "finding"]),
  "verifiedFindingCount": count(*[_type == "finding" && status == "verified"]),
  "implementations": *[_type == "implementation"] | order(name asc) {
    _id, name, "slug": slug.current,
    "runs": *[_type == "testRun" && implementation._ref == ^._id] {
      version, transport, status,
      "scenario": scenario->{_id, name, "slug": slug.current}
    }
  },
  "recentRuns": *[_type == "testRun"] | order(_createdAt desc)[0...8] {
    _id, _createdAt,
    "implementation": implementation->{_id, name, "slug": slug.current},
    version,
    "scenario": scenario->{_id, name, "slug": slug.current}, transport, status, startedAt
  }
}`)

export async function getDashboardData() {
  return client.fetch<DashboardData>(
    dashboardQuery,
    {},
    { next: { revalidate: 60 } },
  )
}
