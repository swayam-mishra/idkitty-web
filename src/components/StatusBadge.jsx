const colorMap = {
  ACTIVE:  'var(--mint)',
  PENDING: 'var(--yellow)',
  FAILED:  'var(--hot-pink)',
}

const StatusBadge = ({ status = 'ACTIVE' }) => {
  const color = colorMap[status] || 'var(--white)'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        border: `2px solid ${color}`,
        padding: '3px 10px',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: color,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <span className="status-dot" style={{ color }}>●</span>
      {status}
    </span>
  )
}

export default StatusBadge
