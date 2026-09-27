'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export type AppPage = 'overview' | 'runs' | 'findings' | 'compare'
type NavIconName = 'overview' | 'runs' | 'findings' | 'compare'

const items: Array<{ icon: NavIconName; label: string; href: string }> = [
  { icon: 'overview', label: 'Overview', href: '/' },
  { icon: 'runs', label: 'Test Runs', href: '/test-runs' },
  { icon: 'findings', label: 'Findings', href: '/findings' },
  { icon: 'compare', label: 'Comparisons', href: '/comparisons' },
]

function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'overview' ? (
        <>
          <path d="m12 3-8 4.5 8 4.5 8-4.5L12 3Z" />
          <path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
        </>
      ) : name === 'runs' ? (
        <>
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v6h-6M9 12l2 2 4-4" />
        </>
      ) : name === 'findings' ? (
        <>
          <path d="M9 18h6M10 22h4" />
          <path d="M8.2 14.7A7 7 0 1 1 15.8 14.7c-.9.7-1.3 1.4-1.3 2.3h-5c0-.9-.4-1.6-1.3-2.3Z" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </>
      )}
    </svg>
  )
}

export function AppSidebar({ active }: { active?: AppPage }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen])

  return (
    <aside className="sidebar runs-page-sidebar">
      <Link className="brand" href="/">
        <div className="brand-mark">
          <Image
            src="/brand/mcp-failure-lab-mark-dark.svg"
            alt=""
            width={25}
            height={25}
            priority
          />
        </div>
        <div>
          <strong>MCP Failure Observatory</strong>
          <span>Built on MCP Failure Lab + Sanity</span>
        </div>
      </Link>
      <button
        className="mobile-menu-toggle"
        type="button"
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
        aria-label={
          mobileOpen ? 'Close navigation menu' : 'Open navigation menu'
        }
        onClick={() => setMobileOpen((current) => !current)}
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {mobileOpen ? (
            <>
              <path d="m6 6 12 12" />
              <path d="M18 6 6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>
      <nav
        id="mobile-navigation"
        className={mobileOpen ? 'mobile-open' : undefined}
        aria-label="Main navigation"
      >
        {items.map((item) => (
          <Link
            className={item.icon === active ? 'active' : undefined}
            href={item.href}
            key={item.icon}
            onClick={() => setMobileOpen(false)}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      {mobileOpen && (
        <button
          className="mobile-nav-backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="sidebar-footer">
        <span>
          <i />
          Live data
        </span>
        <span>◈ Powered by Sanity</span>
      </div>
    </aside>
  )
}
