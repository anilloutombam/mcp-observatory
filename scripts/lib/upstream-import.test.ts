import { describe, expect, it } from 'vitest'

import {
  runSourceKey,
  type SourceData,
  validateSource,
} from './upstream-import'

function source(overrides: Partial<SourceData> = {}): SourceData {
  return {
    schemaVersion: 1,
    reports: [
      {
        id: 'report-1',
        testedOn: '2026-09-27',
        sourceUrl: 'https://example.test/report',
        implementation: {
          name: 'Example Server',
          slug: 'example-server',
          version: '1.0.0',
          kind: 'server',
          repositoryUrl: 'https://github.com/example/server',
        },
        outcomes: [
          {
            scenario: ['Ping', 'ping', 'protocol'],
            runs: [['stdio', 'stdio', 'passed', 10, 'Ping succeeded.']],
          },
        ],
        findings: [],
      },
    ],
    ...overrides,
  }
}

describe('upstream importer validation', () => {
  it('accepts a valid source and builds stable source keys', () => {
    expect(() => validateSource(source())).not.toThrow()
    expect(runSourceKey('report-1', 'ping', 'stdio')).toBe(
      'mcp-failure-lab:report-1:ping:stdio',
    )
  })

  it('rejects unsupported schemas', () => {
    expect(() => validateSource(source({ schemaVersion: 2 }))).toThrow(
      'Unsupported source schema.',
    )
  })

  it('rejects duplicate report ids', () => {
    const data = source()
    data.reports.push(data.reports[0])
    expect(() => validateSource(data)).toThrow('Duplicate report: report-1')
  })

  it('rejects findings that reference a missing run', () => {
    const data = source()
    data.reports[0].findings = [
      {
        id: 'finding-1',
        run: 'ping:http',
        statement: 'Missing run',
        category: 'protocol-behavior',
        reportingStatus: 'reported',
        repository: 'example/server',
        issueNumber: 1,
        issueUrl: 'https://github.com/example/server/issues/1',
        reportedAt: '2026-09-27',
      },
    ]
    expect(() => validateSource(data)).toThrow('references missing run')
  })
})
