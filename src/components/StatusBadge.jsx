import catHappy from '../assets/pixel/cat-happy.svg'
import catNeutral from '../assets/pixel/cat-neutral.svg'
import catAngry from '../assets/pixel/cat-angry.svg'
import SafeImg from './SafeImg'

const CONFIG = {
  ACTIVE:  { color: '#5EC374', img: catHappy,   label: 'ACTIVE' },
  PENDING: { color: '#21242B', img: catNeutral,  label: 'IDLE'   },
  FAILED:  { color: '#E74B4A', img: catAngry,    label: 'ERROR'  },
}

const StatusBadge = ({ status = 'ACTIVE', variant = 'inline' }) => {
  const { color, img, label } = CONFIG[status] ?? { color: '#030404', img: catNeutral, label: status }

  if (variant === 'tile') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            border: `3px solid ${color}`,
            boxShadow: `3px 3px 0px ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#030404',
          }}
        >
          <SafeImg
            src={img}
            alt={label}
            style={{ width: 48, height: 48, imageRendering: 'pixelated' }}
          />
        </div>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.5rem',
            color: color,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>
    )
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        border: `2px solid ${color}`,
        padding: '3px 8px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.5rem',
        color: color,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        background: '#030404',
      }}
    >
      <SafeImg
        src={img}
        alt=""
        style={{ width: 14, height: 14, imageRendering: 'pixelated' }}
      />
      {label}
    </span>
  )
}

export default StatusBadge
