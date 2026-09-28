import type { ReactNode } from 'react'

import type { RunStatus } from '@/sanity/lib/dashboard'

export const statusLabels: Record<RunStatus, string> = {
  passed: 'Passed',
  failed: 'Failed',
  'needs-review': 'Needs review',
  unsupported: 'Unsupported',
  'not-run': 'Not run',
  'not-applicable': 'N/A',
}

export function StatusIcon({ status }: { status: RunStatus }) {
  const paths: Record<RunStatus, ReactNode> = {
    passed: <path d="m5 12 4 4L19 6" />,
    failed: <path d="m7 7 10 10M17 7 7 17" />,
    'needs-review': (
      <>
        <path d="M12 8v5" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      </>
    ),
    unsupported: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m6 18 12-12" />
      </>
    ),
    'not-run': (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    'not-applicable': (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </>
    ),
  }

  return (
    <svg
      className="status-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[status]}
    </svg>
  )
}

export function StatusBadge({ status }: { status: RunStatus }) {
  return (
    <span
      className={`status status-${status}`}
      aria-label={`Status: ${statusLabels[status]}`}
    >
      <StatusIcon status={status} />
      {statusLabels[status]}
    </span>
  )
}
