import { describe, expect, it } from 'vitest'

import { sanitizeSentryEvent } from './privacy'

describe('sanitizeSentryEvent', () => {
  it('removes identity and request data before transmission', () => {
    const event = sanitizeSentryEvent({
      user: { email: 'person@example.test' },
      request: {
        url: 'https://observatory.mcplab.dev/test-runs?q=private-search',
        query_string: 'q=private-search',
        cookies: { session: 'secret' },
        headers: { authorization: 'secret' },
        data: { raw: 'sensitive evidence' },
      },
      breadcrumbs: [{ data: { url: '/findings?q=private-search' } }],
    })

    expect(event).toEqual({
      user: undefined,
      request: {
        url: 'https://observatory.mcplab.dev/test-runs',
        query_string: undefined,
        cookies: undefined,
        headers: undefined,
        data: undefined,
      },
      breadcrumbs: [{ data: undefined }],
    })
  })
})
