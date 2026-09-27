import { ImageResponse } from 'next/og'

export const alt =
  'MCP Failure Observatory — evidence-backed MCP compatibility intelligence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 76px',
        color: '#ffffff',
        background:
          'radial-gradient(circle at 82% 12%, #24446d 0%, #14243a 34%, #0c1727 76%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg
          aria-hidden="true"
          width="78"
          height="78"
          viewBox="0 0 512 512"
          fill="none"
        >
          <path
            d="M196 92h120M222 92v88L119 361c-18 32 5 71 42 71h190c37 0 60-39 42-71L290 180V92"
            stroke="#F7FAFC"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M162 326h188"
            stroke="#21D4FD"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M205 278l44-43 52 38 42-54"
            stroke="#21D4FD"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="205"
            cy="278"
            r="17"
            fill="#21D4FD"
            stroke="#F7FAFC"
            strokeWidth="8"
          />
          <circle
            cx="249"
            cy="235"
            r="17"
            fill="#21D4FD"
            stroke="#F7FAFC"
            strokeWidth="8"
          />
          <circle
            cx="301"
            cy="273"
            r="17"
            fill="#FF4D5A"
            stroke="#F7FAFC"
            strokeWidth="8"
          />
          <path
            d="M333 230l32-40m-32 0l32 40"
            stroke="#FF4D5A"
            strokeWidth="18"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ color: '#9fb3cf', fontSize: 26 }}>
          Built on MCP Failure Lab + Sanity
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            color: '#6ea4ff',
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 4,
          }}
        >
          COMPATIBILITY INTELLIGENCE
        </div>
        <div
          style={{
            maxWidth: 1000,
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -3,
          }}
        >
          MCP Failure Observatory
        </div>
        <div
          style={{
            maxWidth: 920,
            color: '#bdcbe0',
            fontSize: 30,
            lineHeight: 1.35,
          }}
        >
          Evidence-backed results across implementations, transports, and real
          failure scenarios.
        </div>
      </div>
    </div>,
    size,
  )
}
