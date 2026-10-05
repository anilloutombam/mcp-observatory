import { describe, expect, it } from 'vitest'
import { implementationIconKind } from './implementation-icon'

describe('implementationIconKind', () => {
  it.each(['java-sdk', 'official-java-sdk'])(
    'uses the Java icon for %s',
    (slug) => {
      expect(implementationIconKind('Java MCP SDK', slug)).toBe('java')
    },
  )

  it('recognizes the canonical Go SDK slug', () => {
    expect(implementationIconKind('Go MCP SDK', 'go-sdk')).toBe('go')
  })
})
