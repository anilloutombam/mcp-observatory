import type { SanityClient } from '@sanity/client'
import { describe, expect, it } from 'vitest'
import { syncFailureLabData } from './failure-lab-sync'
import type { SourceData } from './upstream-import'

type Document = Record<string, unknown> & { _id: string; _type: string }

class MemorySanityClient {
  documents = new Map<string, Document>()
  failCreateAt: number | undefined
  private createCount = 0
  private nextId = 1

  async fetch(_query: string, params: Record<string, string>) {
    return (
      [...this.documents.values()].find((document) => {
        if (document._type !== params.type) return false
        if (params.slug) {
          return (
            (document.slug as { current?: string } | undefined)?.current ===
            params.slug
          )
        }
        return document.sourceKey === params.sourceKey
      }) ?? null
    )
  }

  async create(values: Record<string, unknown>) {
    this.createCount += 1
    if (this.createCount === this.failCreateAt) {
      this.failCreateAt = undefined
      throw new Error('Injected Sanity write failure')
    }
    const document = {
      ...values,
      _id: `document-${this.nextId++}`,
    } as Document
    this.documents.set(document._id, document)
    return document
  }

  patch(id: string) {
    let operation: 'set' | 'setIfMissing' = 'set'
    let values: Record<string, unknown> = {}
    const unsetFields: string[] = []
    const builder = {
      set(next: Record<string, unknown>) {
        operation = 'set'
        values = next
        return builder
      },
      setIfMissing(next: Record<string, unknown>) {
        operation = 'setIfMissing'
        values = next
        return builder
      },
      unset(fields: string[]) {
        unsetFields.push(...fields)
        return builder
      },
      commit: async () => {
        const current = this.documents.get(id)
        if (!current) throw new Error(`Missing document: ${id}`)
        const updates =
          operation === 'setIfMissing'
            ? Object.fromEntries(
                Object.entries(values).filter(
                  ([key]) => current[key] === undefined,
                ),
              )
            : values
        const updated = { ...current, ...updates }
        for (const field of unsetFields) delete updated[field]
        this.documents.set(id, updated)
        return updated
      },
    }
    return builder
  }

  ofType(type: string) {
    return [...this.documents.values()].filter(
      (document) => document._type === type,
    )
  }
}

function sourceData(): SourceData {
  return {
    schemaVersion: 1,
    reports: [
      {
        id: 'example-client-1.0.0',
        testedOn: '2026-09-28',
        sourceUrl:
          'https://github.com/anilloutombam/mcp-failure-lab/blob/main/docs/compatibility/example.md',
        implementation: {
          name: 'Example Client',
          slug: 'example-client',
          version: '1.0.0',
          kind: 'client',
          repositoryUrl: 'https://github.com/example/client',
        },
        outcomes: [
          {
            scenario: ['Session Recovery', 'session-recovery', 'lifecycle'],
            runs: [
              ['stdio', 'stdio', 'passed', 12, 'Recovered over stdio.'],
              [
                'http',
                'streamable-http',
                'failed',
                30,
                'The HTTP session did not recover.',
              ],
            ],
          },
        ],
        findings: [
          {
            id: 'http-session-recovery',
            run: 'session-recovery:http',
            statement: 'The HTTP session did not recover.',
            category: 'recovery',
            reportingStatus: 'reported',
            repository: 'example/client',
            issueNumber: 12,
            issueUrl: 'https://github.com/example/client/issues/12',
            reportedAt: '2026-09-28T10:00:00Z',
          },
        ],
      },
    ],
  }
}

function client(memory: MemorySanityClient) {
  return memory as unknown as SanityClient
}

describe('Failure Lab sync', () => {
  it('imports implementations, scenarios, transport runs, evidence, findings, and sync metadata', async () => {
    const memory = new MemorySanityClient()
    const result = await syncFailureLabData(client(memory), sourceData(), {
      revision: 'abc123',
      sourceUrl: 'https://example.test/manifest.json',
      completedAt: '2026-09-28T12:00:00Z',
    })

    expect(memory.ofType('implementation')).toHaveLength(1)
    expect(memory.ofType('scenario')).toHaveLength(1)
    expect(memory.ofType('testRun')).toHaveLength(2)
    expect(memory.ofType('evidence')).toHaveLength(2)
    expect(memory.ofType('finding')).toHaveLength(1)
    expect(memory.ofType('dataSync')).toMatchObject([
      {
        sourceRevision: 'abc123',
        reportCount: 1,
        runCount: 2,
        findingCount: 1,
      },
    ])
    expect(result.counters.testRun.created).toBe(2)
  })

  it('updates stable runs without creating duplicates on repeated syncs', async () => {
    const memory = new MemorySanityClient()
    const data = sourceData()
    await syncFailureLabData(client(memory), data, { revision: 'abc123' })

    data.reports[0].outcomes[0].runs[0][4] = 'Updated observation.'
    const result = await syncFailureLabData(client(memory), data, {
      revision: 'abc123',
    })

    expect(memory.ofType('implementation')).toHaveLength(1)
    expect(memory.ofType('scenario')).toHaveLength(1)
    expect(memory.ofType('testRun')).toHaveLength(2)
    expect(memory.ofType('evidence')).toHaveLength(2)
    expect(memory.ofType('finding')).toHaveLength(1)
    expect(memory.ofType('dataSync')).toHaveLength(1)
    expect(result.counters.testRun.updated).toBe(2)
    expect(result.counters.finding.preserved).toBe(1)
    expect(memory.ofType('testRun')).toContainEqual(
      expect.objectContaining({ observations: ['Updated observation.'] }),
    )
  })

  it('removes a previously recorded duration when the source changes to null', async () => {
    const memory = new MemorySanityClient()
    const data = sourceData()
    await syncFailureLabData(client(memory), data, { revision: 'abc123' })

    data.reports[0].outcomes[0].runs[0][3] = null
    await syncFailureLabData(client(memory), data, { revision: 'def456' })

    const stdioRun = memory
      .ofType('testRun')
      .find((document) => document.transport === 'stdio')
    expect(stdioRun).not.toHaveProperty('durationMs')
  })

  it('links findings to their imported run and evidence', async () => {
    const memory = new MemorySanityClient()
    await syncFailureLabData(client(memory), sourceData(), {
      revision: 'abc123',
    })

    const finding = memory.ofType('finding')[0]
    const failedRun = memory
      .ofType('testRun')
      .find((document) => document.status === 'failed')
    const evidence = memory
      .ofType('evidence')
      .find((document) => document.type === 'error')

    expect(finding.testRun).toEqual({
      _type: 'reference',
      _ref: failedRun?._id,
    })
    expect(finding.supportingEvidence).toEqual([
      { _key: 'primary-evidence', _type: 'reference', _ref: evidence?._id },
    ])
  })

  it('rejects invalid finding references before writing any documents', async () => {
    const memory = new MemorySanityClient()
    const data = sourceData()
    data.reports[0].findings![0].run = 'session-recovery:missing'

    await expect(
      syncFailureLabData(client(memory), data, { revision: 'abc123' }),
    ).rejects.toThrow('references missing run')
    expect(memory.documents.size).toBe(0)
  })

  it('rejects invalid sync metadata before writing any documents', async () => {
    const memory = new MemorySanityClient()

    await expect(
      syncFailureLabData(client(memory), sourceData(), { revision: '' }),
    ).rejects.toThrow()
    expect(memory.documents.size).toBe(0)
  })

  it('resumes an interrupted import without duplicating completed writes', async () => {
    const memory = new MemorySanityClient()
    memory.failCreateAt = 4

    await expect(
      syncFailureLabData(client(memory), sourceData(), { revision: 'abc123' }),
    ).rejects.toThrow('Injected Sanity write failure')
    await syncFailureLabData(client(memory), sourceData(), {
      revision: 'abc123',
    })

    expect(memory.ofType('implementation')).toHaveLength(1)
    expect(memory.ofType('scenario')).toHaveLength(1)
    expect(memory.ofType('testRun')).toHaveLength(2)
    expect(memory.ofType('evidence')).toHaveLength(2)
    expect(memory.ofType('finding')).toHaveLength(1)
    expect(memory.ofType('dataSync')).toHaveLength(1)
  })
})
