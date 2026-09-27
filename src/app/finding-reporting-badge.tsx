export const reportingLabels: Record<string, string> = {
  reported: 'Issue opened by MCP Failure Lab',
  'already-reported': 'Evidence added to existing issue',
  'not-reported': 'Not reported upstream',
  resolved: 'Resolved upstream',
  'not-actionable': 'Not actionable upstream',
}

export function FindingReportingBadge({ status }: { status?: string }) {
  if (!status) return null

  return (
    <span className={`reporting-state reporting-${status}`}>
      {reportingLabels[status] ?? status}
    </span>
  )
}
