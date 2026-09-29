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
        sourceUrl:
          'https://github.com/anilloutombam/mcp-failure-lab/blob/main/docs/compatibility/example.md',
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
    expect(() => validateSource({ ...source(), schemaVersion: 2 })).toThrow()
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
        reportedAt: '2026-09-27T10:00:00Z',
      },
    ]
    expect(() => validateSource(data)).toThrow('references missing run')
  })

  it.each([
    ['unknown transport', ['stdio', 'websocket', 'passed', 10, 'Observed.']],
    ['unknown status', ['stdio', 'stdio', 'unknown', 10, 'Observed.']],
    ['negative duration', ['stdio', 'stdio', 'passed', -1, 'Observed.']],
    ['empty observation', ['stdio', 'stdio', 'passed', 10, '']],
  ])('rejects %s', (_label, run) => {
    const data = source() as unknown as Record<string, unknown>
    const reports = data.reports as Array<Record<string, unknown>>
    const outcomes = reports[0].outcomes as Array<Record<string, unknown>>
    outcomes[0].runs = [run]
    expect(() => validateSource(data)).toThrow()
  })

  it('rejects conflicting metadata for a shared scenario slug', () => {
    const data = source()
    data.reports.push({
      ...data.reports[0],
      id: 'report-2',
      outcomes: [
        {
          scenario: ['Different Ping', 'ping', 'baseline'],
          runs: [['http', 'streamable-http', 'passed', 12, 'Ping succeeded.']],
        },
      ],
    })

    expect(() => validateSource(data)).toThrow(
      'Conflicting scenario metadata: ping',
    )
  })

  it('allows multiple tested versions of the same implementation', () => {
    const data = source()
    data.reports.push({
      ...data.reports[0],
      id: 'report-2',
      implementation: { ...data.reports[0].implementation, version: '2.0.0' },
    })

    expect(() => validateSource(data)).not.toThrow()
  })

  it('rejects duplicate finding ids within a report', () => {
    const data = source()
    const finding = {
      id: 'finding-1',
      run: 'ping:stdio',
      statement: 'Observed behavior.',
      category: 'protocol-behavior' as const,
      reportingStatus: 'reported' as const,
      repository: 'example/server',
      issueNumber: 1,
      issueUrl: 'https://github.com/example/server/issues/1',
      reportedAt: '2026-09-27T10:00:00Z',
    }
    data.reports[0].findings = [finding, finding]

    expect(() => validateSource(data)).toThrow(
      'Duplicate finding id in report-1: finding-1',
    )
  })
})
