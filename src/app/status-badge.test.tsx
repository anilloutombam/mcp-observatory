import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  FindingReportingBadge,
  reportingLabels,
} from './finding-reporting-badge'
import { StatusBadge, statusLabels } from './status-badge'

describe('status badges', () => {
  it.each(Object.entries(statusLabels))('renders %s as %s', (status, label) => {
    render(<StatusBadge status={status as keyof typeof statusLabels} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it.each(Object.entries(reportingLabels))(
    'renders reporting state %s as %s',
    (status, label) => {
      render(<FindingReportingBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
    },
  )

  it('renders nothing when reporting state is absent', () => {
    const { container } = render(<FindingReportingBadge />)
    expect(container).toBeEmptyDOMElement()
  })
})
