export function TransportBadge({
  transport,
}: {
  transport: 'stdio' | 'streamable-http'
}) {
  return (
    <span className="transport">
      {transport === 'streamable-http' ? 'HTTP' : 'stdio'}
    </span>
  )
}
