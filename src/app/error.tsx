'use client'

import { RouteError } from './route-error'

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <RouteError
      title="Observatory data is unavailable"
      message="We couldn’t load the latest records from Sanity. Try again shortly."
      reset={reset}
    />
  )
}
