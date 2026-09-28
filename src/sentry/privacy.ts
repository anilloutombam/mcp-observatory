type SentryEvent = {
  user?: unknown
  request?: {
    url?: string
    query_string?: unknown
    cookies?: unknown
    headers?: unknown
    data?: unknown
  }
  breadcrumbs?: Array<{ data?: unknown } | null>
}

export function sanitizeSentryEvent<T extends SentryEvent>(event: T): T {
  event.user = undefined

  if (event.request) {
    if (event.request.url) {
      event.request.url = event.request.url.split('?')[0]
    }
    event.request.query_string = undefined
    event.request.cookies = undefined
    event.request.headers = undefined
    event.request.data = undefined
  }

  event.breadcrumbs?.forEach((breadcrumb) => {
    if (breadcrumb) breadcrumb.data = undefined
  })

  return event
}
