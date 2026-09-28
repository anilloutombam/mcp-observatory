import { describe, expect, it } from 'vitest'

import { parseComparisonParam, serializeComparisons } from './comparison-url'

describe('comparison URL state', () => {
  it('restores implementation slugs and versions', () => {
    expect(
      parseComparisonParam('c-mcp-sdk@2.2.0,github-mcp-server@1.12.2'),
    ).toEqual([
      { slug: 'c-mcp-sdk', version: '2.2.0' },
      { slug: 'github-mcp-server', version: '1.12.2' },
    ])
  })

  it('supports legacy slug-only links', () => {
    expect(parseComparisonParam('go-mcp-sdk')).toEqual([{ slug: 'go-mcp-sdk' }])
  })

  it('preserves an explicitly empty selection', () => {
    expect(parseComparisonParam('none')).toEqual([])
    expect(serializeComparisons([])).toBe('none')
  })

  it('serializes the exact selected versions', () => {
    expect(
      serializeComparisons([
        { slug: 'go-mcp-sdk', version: '1.7.0' },
        { slug: 'typescript-mcp-sdk', version: '1.30.1' },
      ]),
    ).toBe('go-mcp-sdk@1.7.0,typescript-mcp-sdk@1.30.1')
  })
})
