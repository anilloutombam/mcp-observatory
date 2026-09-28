import type { AnchorHTMLAttributes, ReactNode } from 'react'

import { ExternalLinkIcon } from './external-link-icon'

type ExternalLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'rel' | 'target'
> & {
  href: string
  children: ReactNode
  iconWrapperClassName?: string
}

export function ExternalLink({
  href,
  children,
  iconWrapperClassName,
  ...props
}: ExternalLinkProps) {
  const icon = <ExternalLinkIcon />

  return (
    <a href={href} target="_blank" rel="noreferrer" {...props}>
      {children}
      {iconWrapperClassName ? (
        <span className={iconWrapperClassName}>{icon}</span>
      ) : (
        icon
      )}
    </a>
  )
}
