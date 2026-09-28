import { defineQuery } from 'next-sanity'

import { client } from './client'
import type { RunStatus } from './dashboard'

export type FindingReviewStatus = 'needs-review' | 'verified' | 'rejected'

export type FindingListItem = {
  _id: string
  _createdAt: string
  statement: string
  category: string
  confidence?: number
  status: FindingReviewStatus
  proposedBy: string
  affectedVersions?: string[]
  reportingStatus: string
  upstreamRepository?: string
  upstreamIssueUrl?: string
  upstreamIssueNumber?: number
  upstreamCommentUrl?: string
  reportedAt?: string
  upstreamIssueState?: string
  resolutionSummary?: string
  supportingEvidenceCount: number
  affectedImplementations: Array<{
    _id: string
    name: string
    slug: string
  }>
  testRun: {
    _id: string
    version: string
    transport: 'stdio' | 'streamable-http'
    status: RunStatus
    startedAt?: string
    testedOn?: string
    implementation: { _id: string; name: string; slug: string } | null
    scenario: { _id: string; name: string; slug: string } | null
  } | null
}

export type FindingsData = {
  findings: FindingListItem[]
  implementations: Array<{ _id: string; name: string; slug: string }>
}

const findingsQuery = defineQuery(/* groq */ `{
  "findings": *[_type == "finding"] | order(reportedAt desc, _createdAt desc) {
    _id, _createdAt, statement, category, confidence, status, proposedBy,
    affectedVersions, reportingStatus, upstreamRepository, upstreamIssueUrl,
    upstreamIssueNumber, upstreamCommentUrl, reportedAt, upstreamIssueState,
    resolutionSummary,
    "supportingEvidenceCount": count(supportingEvidence),
    "affectedImplementations": coalesce(
      affectedImplementations[]->{_id, name, "slug": slug.current},
      []
    ),
    "testRun": testRun->{
      _id, version, transport, status, startedAt, testedOn,
      "implementation": implementation->{_id, name, "slug": slug.current},
      "scenario": scenario->{_id, name, "slug": slug.current}
    }
  },
  "implementations": *[_type == "implementation"] | order(name asc) {
    _id, name, "slug": slug.current
  }
}`)

export async function getFindingsData() {
  return client.fetch<FindingsData>(
    findingsQuery,
    {},
    { next: { revalidate: 60 } },
  )
}
