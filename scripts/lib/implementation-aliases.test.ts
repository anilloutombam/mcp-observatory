import { describe, expect, it } from 'vitest'
import { canonicalImplementationSlug } from './implementation-aliases'

describe('canonicalImplementationSlug', () => {
  it.each([
    ['typescript-mcp-sdk', 'typescript-sdk'],
    ['python-mcp-sdk', 'python-sdk'],
    ['go-mcp-sdk', 'go-sdk'],
    ['rust-mcp-sdk', 'rust-sdk'],
    ['c-mcp-sdk', 'csharp-sdk'],
    ['official-java-sdk', 'java-sdk'],
  ])('maps %s to %s', (alias, canonical) => {
    expect(canonicalImplementationSlug(alias)).toBe(canonical)
  })

  it('leaves unrelated implementation slugs unchanged', () => {
    expect(canonicalImplementationSlug('github-mcp-server')).toBe(
      'github-mcp-server',
    )
  })
})
