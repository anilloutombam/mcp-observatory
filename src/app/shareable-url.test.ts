import { describe, expect, it } from 'vitest'

import { buildShareablePath } from './shareable-url'

describe('buildShareablePath', () => {
  it('adds and encodes active filters', () => {
    expect(
      buildShareablePath('https://example.test/test-runs', {
        q: 'MCP proxy',
        status: 'needs-review',
        page: 2,
      }),
    ).toBe('/test-runs?q=MCP+proxy&status=needs-review&page=2')
  })

  it('removes cleared filters without disturbing other parameters', () => {
    expect(
      buildShareablePath(
        'https://example.test/comparisons?compare=go%401.0&scenario=ping&transport=stdio',
        { scenario: undefined, transport: '' },
      ),
    ).toBe('/comparisons?compare=go%401.0')
  })

  it('preserves a hash fragment', () => {
    expect(
      buildShareablePath('https://example.test/findings#results', {
        review: 'verified',
      }),
    ).toBe('/findings?review=verified#results')
  })
})
