import { describe, expect, it } from 'vitest'

import { findingsQuery } from './findings'
import { testRunsQuery } from './test-runs'

describe('public list queries', () => {
  it.each([
    ['test runs', testRunsQuery],
    ['findings', findingsQuery],
  ])('projects public slugs for %s', (_name, query) => {
    expect(query).toContain('"slug": slug.current')
    expect(query).not.toMatch(/\{\s*\.\.\.\s*\}/)
  })

  it('orders before returning test runs', () => {
    expect(testRunsQuery).toContain('| order(_createdAt desc) {')
  })

  it('projects finding reporting and upstream context', () => {
    expect(findingsQuery).toContain('reportingStatus')
    expect(findingsQuery).toContain('upstreamIssueUrl')
    expect(findingsQuery).toContain('supportingEvidenceCount')
  })
})
