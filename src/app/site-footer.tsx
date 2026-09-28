import Link from 'next/link'
import { ExternalLink } from './external-link'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>MCP compatibility data, with evidence and limitations in context.</p>
      <nav aria-label="Project information">
        <Link href="/methodology">Methodology &amp; limitations</Link>
        <ExternalLink href="https://github.com/anilloutombam/mcp-observatory">
          <span>Source code</span>
        </ExternalLink>
        <ExternalLink href="https://github.com/anilloutombam/mcp-failure-lab">
          <span>MCP Failure Lab</span>
        </ExternalLink>
      </nav>
    </footer>
  )
}
