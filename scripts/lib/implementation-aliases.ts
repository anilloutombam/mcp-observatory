export const implementationSlugAliases = {
  'typescript-mcp-sdk': 'typescript-sdk',
  'python-mcp-sdk': 'python-sdk',
  'go-mcp-sdk': 'go-sdk',
  'rust-mcp-sdk': 'rust-sdk',
  'c-mcp-sdk': 'csharp-sdk',
  'official-java-sdk': 'java-sdk',
} as const

export function canonicalImplementationSlug(slug: string) {
  return (
    implementationSlugAliases[slug as keyof typeof implementationSlugAliases] ??
    slug
  )
}
