import { defineQuery } from 'next-sanity'

import { client } from './client'
import type { RunStatus } from './dashboard'

export type TestRunEvidence = {
  _id: string
  type: string
  summary: string
  raw?: string
  capturedAt?: string
  source?: string
}

export type TestRunFinding = {
  _id: string
  statement: string
  category: string
  confidence?: number
  status: string
  affectedVersions?: string[]
  reportingStatus?: string
  upstreamRepository?: string
  upstreamIssueUrl?: string
  upstreamIssueNumber?: number
  upstreamCommentUrl?: string
  reportedAt?: string
  upstreamIssueState?: string
  resolutionSummary?: string
  supportingEvidence?: Array<{
    _id: string
    type: string
    summary: string
  }>
}

export type TestRunDetail = {
  _id: string
  _createdAt: string
  sourceReportUrl?: string
  testedOn?: string
  implementation: {
    _id: string
    name: string
    slug: string
    kind?: string
    repositoryUrl?: string
    description?: string
  } | null
  scenario: {
    _id: string
    name: string
    slug: string
    category: string
    description?: string
  } | null
  version: string
  transport: 'stdio' | 'streamable-http'
  status: RunStatus
  startedAt?: string
  durationMs?: number
  observations?: string[]
  evidence: TestRunEvidence[]
  findings: TestRunFinding[]
}

const testRunDetailQuery = defineQuery(/* groq */ `
  *[_type == "testRun" && _id == $id][0] {
    _id,
    _createdAt,
    sourceReportUrl,
    testedOn,
    "implementation": implementation->{
      _id,
      name,
      "slug": slug.current,
      kind,
      repositoryUrl,
      description
    },
    "scenario": scenario->{
      _id,
      name,
      "slug": slug.current,
      category,
      description
    },
    version,
    transport,
    status,
    startedAt,
    durationMs,
    observations,
    "evidence": *[
      _type == "evidence" && testRun._ref == ^._id
    ] | order(capturedAt asc, _createdAt asc) {
      _id,
      type,
      summary,
      raw,
      capturedAt,
      source
    },
    "findings": *[
      _type == "finding" && testRun._ref == ^._id
    ] | order(_createdAt asc) {
      _id,
      statement,
      category,
      confidence,
      status,
      affectedVersions,
      reportingStatus,
      upstreamRepository,
      upstreamIssueUrl,
      upstreamIssueNumber,
      upstreamCommentUrl,
      reportedAt,
      upstreamIssueState,
      resolutionSummary,
      "supportingEvidence": supportingEvidence[]->{_id, type, summary}
    }
  }
`)

export async function getTestRunDetail(id: string) {
  return client.fetch<TestRunDetail | null>(
    testRunDetailQuery,
    { id },
    { next: { revalidate: 60 } },
  )
}
