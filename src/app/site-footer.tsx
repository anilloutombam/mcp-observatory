import Link from 'next/link'
import { ExternalLinkIcon } from './external-link-icon'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>MCP compatibility data, with evidence and limitations in context.</p>
      <nav aria-label="Project information">
        <Link href="/methodology">Methodology &amp; limitations</Link>
        <a
          href="https://github.com/anilloutombam/mcp-observatory"
          target="_blank"
          rel="noreferrer"
        >
          <span>Source code</span>
          <ExternalLinkIcon />
        </a>
        <a
          href="https://github.com/anilloutombam/mcp-failure-lab"
          target="_blank"
          rel="noreferrer"
        >
          <span>MCP Failure Lab</span>
          <ExternalLinkIcon />
        </a>
      </nav>
    </footer>
  )
}
