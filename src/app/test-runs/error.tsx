'use client'

import { RouteError } from '../route-error'

export default function TestRunsError({ reset }: { reset: () => void }) {
  return (
    <RouteError
      title="Test runs are unavailable"
      message="We couldn’t load the test-run records from Sanity."
      reset={reset}
    />
  )
}
