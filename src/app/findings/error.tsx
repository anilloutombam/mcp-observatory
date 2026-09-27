'use client'

import { RouteError } from '../route-error'

export default function FindingsError({ reset }: { reset: () => void }) {
  return (
    <RouteError
      title="Findings are unavailable"
      message="We couldn’t load the reviewed findings from Sanity."
      reset={reset}
    />
  )
}
