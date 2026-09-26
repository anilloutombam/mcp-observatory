type ImplementationIconProps = {
  name: string
  slug?: string
}

export function ImplementationIcon({ name, slug }: ImplementationIconProps) {
  const key = slug ?? name.toLowerCase().replaceAll(' ', '-')
  const kind = key.includes('typescript')
    ? 'typescript'
    : key.includes('python')
      ? 'python'
      : key.includes('rust')
        ? 'rust'
        : key.includes('c-mcp') || key.includes('csharp')
          ? 'csharp'
          : key.includes('go-mcp')
            ? 'go'
            : key.includes('inspector')
              ? 'inspector'
              : 'fallback'

  return (
    <span className={`implementation-logo logo-${kind}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        {kind === 'typescript' && (
          <>
            <rect
              x="3"
              y="3"
              width="26"
              height="26"
              rx="4"
              fill="currentColor"
            />
            <path
              d="M9 13h11M14.5 13v11M20 21.8c1.2 1.1 4.2 1.2 4.2-.8 0-2.7-5-1.5-5-4.6 0-2.6 3.8-3.2 5.5-1.6"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </>
        )}
        {kind === 'python' && (
          <>
            <path
              d="M16 3c-6 0-6 2.7-6 5v3h7v1H7c-2.4 0-4 1.8-4 5s1.6 5 4 5h3v-4.5c0-2.7 2.2-4.5 5-4.5h5c2.2 0 4-1.8 4-4V8c0-3-2.5-5-8-5Z"
              fill="#3776ab"
            />
            <circle cx="13" cy="7" r="1.2" fill="white" />
            <path
              d="M16 29c6 0 6-2.7 6-5v-3h-7v-1h10c2.4 0 4-1.8 4-5s-1.6-5-4-5h-3v4.5c0 2.7-2.2 4.5-5 4.5h-5c-2.2 0-4 1.8-4 4v1c0 3 2.5 5 8 5Z"
              fill="#ffd343"
            />
            <circle cx="19" cy="25" r="1.2" fill="white" />
          </>
        )}
        {kind === 'go' && (
          <>
            <path
              d="M4 12h7M2 16h8M5 20h6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <text
              x="10"
              y="21"
              fill="currentColor"
              fontSize="13"
              fontWeight="800"
              fontFamily="Arial, sans-serif"
            >
              GO
            </text>
          </>
        )}
        {kind === 'rust' && (
          <>
            <circle
              cx="16"
              cy="16"
              r="11"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="3 2"
            />
            <text
              x="10.2"
              y="21"
              fill="currentColor"
              fontSize="15"
              fontWeight="800"
              fontFamily="Georgia, serif"
            >
              R
            </text>
          </>
        )}
        {kind === 'csharp' && (
          <>
            <path
              d="m16 3 11 6.5v13L16 29 5 22.5v-13L16 3Z"
              fill="currentColor"
            />
            <text
              x="8"
              y="20.5"
              fill="white"
              fontSize="13"
              fontWeight="800"
              fontFamily="Arial, sans-serif"
            >
              C#
            </text>
          </>
        )}
        {kind === 'inspector' && (
          <>
            <circle cx="8" cy="9" r="3" fill="currentColor" />
            <circle cx="24" cy="9" r="3" fill="currentColor" />
            <circle cx="16" cy="24" r="3" fill="currentColor" />
            <path
              d="m10.5 11 4 10M21.5 11l-4 10M11 9h10"
              stroke="currentColor"
              strokeWidth="2"
            />
          </>
        )}
        {kind === 'fallback' && (
          <>
            <path
              d="M7 8h18v16H7zM11 4v4M21 4v4M11 24v4M21 24v4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="15" r="1.5" fill="currentColor" />
            <circle cx="20" cy="15" r="1.5" fill="currentColor" />
            <path d="M12 20h8" stroke="currentColor" strokeWidth="2" />
          </>
        )}
      </svg>
    </span>
  )
}
