import { QRCodeSVG } from 'qrcode.react'
import catAvatar from '../assets/pixel/cat-neutral.svg'
import SafeImg from './SafeImg'
import StatusBadge from './StatusBadge'

const IdentityCard = ({ did, name, email, createdAt }) => {
  const dateStr = createdAt
    ? new Date(createdAt).toISOString().split('T')[0]
    : '—'

  return (
    <div
      style={{
        display: 'flex',
        border: '3px solid #030404',
        boxShadow: '8px 8px 0px #030404',
        overflow: 'hidden',
      }}
    >
      {/* Left panel — dark, cat avatar (inverted for visibility on dark bg) */}
      <div
        style={{
          flex: '0 0 40%',
          background: '#030404',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          borderRight: '3px solid #030404',
        }}
      >
        <SafeImg
          src={catAvatar}
          alt="IDKitty avatar"
          style={{
            width: 80,
            height: 80,
            imageRendering: 'pixelated',
            filter: 'brightness(0) invert(1)',
          }}
        />
      </div>

      {/* Right panel — cream, DID + QR */}
      <div
        style={{
          flex: '1',
          background: '#F5F3E7',
          color: '#030404',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.5rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#21242B',
            }}
          >
            IDKITTY
          </span>
          <StatusBadge status="ACTIVE" />
        </div>

        {/* DID */}
        <div>
          <p
            style={{
              fontFamily: 'Pixelify Sans, sans-serif',
              fontSize: 'clamp(0.9rem, 1.4vw, 1.125rem)',
              color: '#030404',
              fontWeight: 600,
              margin: '0 0 0.35rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}
          >
            {did}
          </p>

          {(name || email) && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {name && (
                <span
                  style={{
                    fontFamily: 'Pixelify Sans, sans-serif',
                    fontSize: '1rem',
                    color: '#21242B',
                    opacity: 0.6,
                  }}
                >
                  {name}
                </span>
              )}
              {email && (
                <span
                  style={{
                    fontFamily: 'Pixelify Sans, sans-serif',
                    fontSize: '1rem',
                    color: '#21242B',
                    opacity: 0.6,
                  }}
                >
                  {email}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer row — date + QR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.5rem',
              color: '#21242B',
              opacity: 0.5,
              letterSpacing: '0.06em',
            }}
          >
            SINCE {dateStr}
          </span>

          <QRCodeSVG
            value={did || 'idkitty'}
            size={80}
            bgColor="transparent"
            fgColor="#030404"
            level="M"
          />
        </div>
      </div>
    </div>
  )
}

export default IdentityCard
