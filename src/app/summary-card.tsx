import type { ReactNode } from 'react'

type SummaryIcon =
  | 'layers'
  | 'runs'
  | 'finding'
  | 'verified'
  | 'passed'
  | 'failed'
  | 'unsupported'

type SummaryTone = 'blue' | 'purple' | 'red' | 'green'

const iconPaths: Record<SummaryIcon, ReactNode> = {
  layers: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </>
  ),
  runs: (
    <>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v6h-6M9 12l2 2 4-4" />
    </>
  ),
  finding: (
    <>
      <path d="M9 18h6M10 22h4" />
      <path d="M8.2 14.7A7 7 0 1 1 15.8 14.7c-.9.7-1.3 1.4-1.3 2.3h-5c0-.9-.4-1.6-1.3-2.3Z" />
    </>
  ),
  verified: (
    <>
      <path d="m12 3-8 4.5 8 4.5 8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
    </>
  ),
  passed: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.7 2.7L16.5 9" />
    </>
  ),
  failed: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  unsupported: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m6 18 12-12" />
    </>
  ),
}

export function SummaryCard({
  icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: SummaryIcon
  tone: SummaryTone
  label: string
  value: number
  detail: string
}) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${tone}`} aria-hidden="true">
        <svg
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {iconPaths[icon]}
        </svg>
      </span>
      <span>
        <small>{label}</small>
        <strong>{value.toLocaleString()}</strong>
        <em>{detail}</em>
      </span>
    </article>
  )
}
