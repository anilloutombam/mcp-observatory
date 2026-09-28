import type { ReactNode } from 'react'

import { AppSidebar, type AppPage } from './app-sidebar'

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function AppShell({
  active,
  children,
  className,
  workspaceClassName = 'runs-workspace',
}: {
  active?: AppPage
  children: ReactNode
  className?: string
  workspaceClassName?: string
}) {
  return (
    <div className={classes('app-shell', className)}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppSidebar active={active} />
      <main id="main-content" className={workspaceClassName} tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}

export function AppPageShell({
  active,
  eyebrow = 'Compatibility intelligence',
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  headerClassName,
}: {
  active?: AppPage
  eyebrow?: string
  title: ReactNode
  description: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  headerClassName?: string
}) {
  return (
    <AppShell active={active} className={classes('runs-page', className)}>
      <header className={classes('runs-topbar', headerClassName)}>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action}
      </header>
      <div className={classes('runs-content', contentClassName)}>
        {children}
      </div>
    </AppShell>
  )
}
