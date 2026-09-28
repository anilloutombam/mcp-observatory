export function TransportBadge({
  transport,
}: {
  transport: 'stdio' | 'streamable-http'
}) {
  return (
    <span
      className="transport"
      aria-label={`Transport: ${transport === 'streamable-http' ? 'Streamable HTTP' : 'standard input and output'}`}
    >
      {transport === 'streamable-http' ? 'HTTP' : 'stdio'}
    </span>
  )
}
