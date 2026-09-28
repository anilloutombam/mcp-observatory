export function parsePage(value?: string) {
  const page = Number.parseInt(value ?? '', 10)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export function paginate<T>(
  items: T[],
  requestedPage: number,
  pageSize: number,
) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, requestedPage), pages)
  return {
    current,
    pages,
    items: items.slice((current - 1) * pageSize, current * pageSize),
  }
}
