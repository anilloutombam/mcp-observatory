type ImplementationIconProps = {
  name: string
  slug?: string
}

const githubPath =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

const mcpPath =
  'M13.85 0a4.16 4.16 0 0 0-2.95 1.217L1.456 10.66a.835.835 0 0 0 0 1.18.835.835 0 0 0 1.18 0l9.442-9.442a2.49 2.49 0 0 1 3.541 0 2.49 2.49 0 0 1 0 3.541L8.59 12.97l-.1.1a.835.835 0 0 0 0 1.18.835.835 0 0 0 1.18 0l.1-.098 7.03-7.034a2.49 2.49 0 0 1 3.542 0l.049.05a2.49 2.49 0 0 1 0 3.54l-8.54 8.54a1.96 1.96 0 0 0 0 2.755l1.753 1.753a.835.835 0 0 0 1.18 0 .835.835 0 0 0 0-1.18l-1.753-1.753a.266.266 0 0 1 0-.394l8.54-8.54a4.185 4.185 0 0 0 0-5.9l-.05-.05a4.16 4.16 0 0 0-2.95-1.218c-.2 0-.401.02-.6.048a4.17 4.17 0 0 0-1.17-3.552A4.16 4.16 0 0 0 13.85 0m0 3.333a.84.84 0 0 0-.59.245L6.275 10.56a4.186 4.186 0 0 0 0 5.902 4.186 4.186 0 0 0 5.902 0L19.16 9.48a.835.835 0 0 0 0-1.18.835.835 0 0 0-1.18 0l-6.985 6.984a2.49 2.49 0 0 1-3.54 0 2.49 2.49 0 0 1 0-3.54l6.983-6.985a.835.835 0 0 0 0-1.18.84.84 0 0 0-.59-.245'

export function ImplementationIcon({ name, slug }: ImplementationIconProps) {
  const key = slug ?? name.toLowerCase().replaceAll(' ', '-')
  const kind = key.includes('github')
    ? 'github'
    : key.includes('typescript')
      ? 'typescript'
      : key.includes('python')
        ? 'python'
        : key.includes('rust')
          ? 'rust'
          : key.includes('c-mcp') || key.includes('csharp')
            ? 'csharp'
            : key.includes('go-mcp')
              ? 'go'
              : key.includes('inspector') || key.includes('everything-server')
                ? 'mcp'
                : key.includes('proxy') || key.includes('supergateway')
                  ? 'proxy'
                  : key.includes('server') || key.includes('everything')
                    ? 'server'
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
              d="M7.5 11h10M12.5 11v11.5M18.5 20.5c1.6 1.5 5.8 1.8 5.8-.8 0-3.1-5.5-1.5-5.5-5 0-2.9 4.2-3.5 6-1.7"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
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
        {kind === 'mcp' && (
          <g transform="translate(4 4)" fill="currentColor">
            <path d={mcpPath} />
          </g>
        )}
        {kind === 'github' && (
          <g transform="translate(4 4)" fill="currentColor">
            <path d={githubPath} />
          </g>
        )}
        {kind === 'proxy' && (
          <>
            <path
              d="M5 10h15M16 6l4 4-4 4M27 22H12M16 18l-4 4 4 4"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="7"
              cy="22"
              r="2.5"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="25"
              cy="10"
              r="2.5"
              stroke="currentColor"
              strokeWidth="2"
            />
          </>
        )}
        {kind === 'server' && (
          <>
            <rect
              x="5"
              y="5"
              width="22"
              height="9"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="5"
              y="18"
              width="22"
              height="9"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="10" cy="9.5" r="1.3" fill="currentColor" />
            <circle cx="10" cy="22.5" r="1.3" fill="currentColor" />
            <path
              d="M15 9.5h7M15 22.5h7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
        {kind === 'fallback' && (
          <>
            <path
              d="m13 7-8 9 8 9M19 7l8 9-8 9"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="m18 5-4 22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </span>
  )
}
