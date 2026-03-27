import { QRCodeSVG } from 'qrcode.react'
import CatLogo from './CatLogo'
import StatusBadge from './StatusBadge'

const IdentityCard = ({ did, name, email, createdAt, txHash }) => {
  const dateStr = createdAt
    ? new Date(createdAt).toISOString().split('T')[0]
    : '—'

  return (
    <div
      className="card-yellow"
      style={{
        aspectRatio: '2.5 / 1',
        position: 'relative',
        overflow: 'hidden',
        padding: '1.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CatLogo size={22} />
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--white)',
            }}
          >
            IDKITTY
          </span>
        </div>
        <StatusBadge status="ACTIVE" />
      </div>

      {/* Center — DID + claims */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.25rem 0' }}>
        {/* DID with whisker decoration */}
        <div style={{ position: 'relative' }}>
          {/* Whisker left */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              width: '15%',
              height: '2px',
              background: 'var(--white)',
              opacity: 0.15,
              transform: 'translateY(-50%)',
            }}
          />
          {/* DID */}
          <p
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 'clamp(0.65rem, 1.5vw, 0.95rem)',
              color: 'var(--orange)',
              fontWeight: 500,
              margin: '0 18%',
              textAlign: 'center',
              wordBreak: 'break-all',
              letterSpacing: '0.03em',
            }}
          >
            {did}
          </p>
          {/* Whisker right */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              width: '15%',
              height: '2px',
              background: 'var(--white)',
              opacity: 0.15,
              transform: 'translateY(-50%)',
            }}
          />
        </div>

        {/* Claims — directly below DID, muted */}
        {(name || email) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem' }}>
            {name && (
              <span
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '0.7rem',
                  color: '#666',
                }}
              >
                {name}
              </span>
            )}
            {email && (
              <span
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '0.7rem',
                  color: '#666',
                }}
              >
                {email}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '0.7rem',
            color: 'var(--white)',
            opacity: 0.45,
            letterSpacing: '0.06em',
          }}
        >
          SINCE {dateStr}
        </span>

        <QRCodeSVG
          value={did || 'idkitty'}
          size={72}
          bgColor="transparent"
          fgColor="#f5f0e8"
          level="M"
        />
      </div>
    </div>
  )
}

export default IdentityCard
