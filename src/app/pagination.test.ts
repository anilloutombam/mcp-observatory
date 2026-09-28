import { describe, expect, it } from 'vitest'

import { paginate, parsePage } from './pagination'

describe('parsePage', () => {
  it.each([undefined, '', '0', '-2', 'invalid'])(
    'normalizes %s to the first page',
    (value) => expect(parsePage(value)).toBe(1),
  )

  it('accepts a positive integer', () => expect(parsePage('3')).toBe(3))
})

describe('paginate', () => {
  const records = Array.from({ length: 22 }, (_, index) => index + 1)

  it('returns the requested page window', () => {
    expect(paginate(records, 2, 10)).toEqual({
      current: 2,
      pages: 3,
      items: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    })
  })

  it('clamps a stale page after filtering', () => {
    expect(paginate(records.slice(0, 3), 8, 10)).toEqual({
      current: 1,
      pages: 1,
      items: [1, 2, 3],
    })
  })
})
