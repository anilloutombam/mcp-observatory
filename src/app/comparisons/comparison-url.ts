export type RequestedComparison = {
  slug: string
  version?: string
}

export function parseComparisonParam(value?: string) {
  if (!value || value === 'none') return []

  return value
    .split(',')
    .filter(Boolean)
    .map((entry): RequestedComparison => {
      const separator = entry.indexOf('@')
      return separator === -1
        ? { slug: entry }
        : {
            slug: entry.slice(0, separator),
            version: entry.slice(separator + 1),
          }
    })
    .filter((entry) => entry.slug)
}

export function serializeComparisons(entries: RequestedComparison[]) {
  return entries.length
    ? entries.map(({ slug, version }) => `${slug}@${version ?? ''}`).join(',')
    : 'none'
}
