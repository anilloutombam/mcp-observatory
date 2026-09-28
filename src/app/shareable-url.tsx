'use client'

import { useEffect, useState } from 'react'

type SearchValue = string | number | undefined

export function buildShareablePath(
  currentUrl: string,
  values: Record<string, SearchValue>,
) {
  const url = new URL(currentUrl)

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      url.searchParams.delete(key)
    } else {
      url.searchParams.set(key, String(value))
    }
  })

  return `${url.pathname}${url.search}${url.hash}`
}

export function useShareableUrl(values: Record<string, SearchValue>) {
  const serialized = JSON.stringify(values, (_key, value) =>
    value === undefined ? null : value,
  )

  useEffect(() => {
    const nextValues = JSON.parse(serialized) as Record<
      string,
      SearchValue | null
    >
    const next = buildShareablePath(
      window.location.href,
      Object.fromEntries(
        Object.entries(nextValues).map(([key, value]) => [
          key,
          value === null ? undefined : value,
        ]),
      ),
    )
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (next !== current) {
      window.history.replaceState(window.history.state, '', next)
    }
  }, [serialized])
}

export function CopyPageLinkButton() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard is unavailable')
      await navigator.clipboard.writeText(window.location.href)
      setState('copied')
    } catch {
      setState('failed')
    }
    window.setTimeout(() => setState('idle'), 1800)
  }

  return (
    <button
      className="share-link-button"
      type="button"
      onClick={copy}
      aria-live="polite"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
      </svg>
      {state === 'copied'
        ? 'Copied'
        : state === 'failed'
          ? 'Copy failed'
          : 'Copy link'}
    </button>
  )
}
