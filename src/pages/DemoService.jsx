import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, TrendingUp, Activity, Star } from 'lucide-react'
import logoImg from '../assets/pixel/logo.png'
import StatusBadge from '../components/StatusBadge'
import { loadJWT, clearJWT, loadIdentity } from '../store/identity.store'

const StatCard = ({ icon: Icon, label, value }) => (
  <div
    className="card"
    style={{ flex: 1, minWidth: '160px' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', opacity: 0.6 }}>
      <Icon size={15} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#030404' }}>
        {label}
      </span>
    </div>
    <div
      style={{
        fontFamily: 'Pixelify Sans, sans-serif',
        fontWeight: 400,
        fontSize: '2rem',
        color: '#030404',
      }}
    >
      {value}
    </div>
  </div>
)

const DemoService = () => {
  const navigate = useNavigate()
  const [did, setDid] = useState(null)

  useEffect(() => {
    const jwt = loadJWT()
    if (!jwt) {
      navigate('/login')
      return
    }
    const identity = loadIdentity()
    setDid(identity?.did || 'did:idkitty:unknown')
  }, [navigate])

  const handleLogout = () => {
    clearJWT()
    navigate('/')
  }

  if (!did) return null

  return (
    <div className="page">
      {/* PurrBank top bar */}
      <div
        style={{
          borderBottom: '3px solid #030404',
          background: '#F5F3E7',
          padding: '0.9rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
            color: '#030404',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img src={logoImg} alt="IDKitty" style={{ width: 24, height: 24, imageRendering: 'pixelated', marginRight: '0.5rem' }} />
          PURRBANK
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: 'Pixelify Sans, sans-serif',
              fontSize: '1rem',
              color: '#21242B',
              opacity: 0.7,
            }}
          >
            Secured by
          </span>
          <img src={logoImg} alt="IDKitty" style={{ width: 20, height: 20, imageRendering: 'pixelated' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.625rem', color: '#21242B' }}>
            IDKitty
          </span>
        </div>
      </div>

      <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '900px' }}>
        {/* Auth banner */}
        <div
          className="alert-mint"
          style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
        >
          <ShieldCheck size={20} style={{ color: '#5EC374', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#5EC374',
                marginBottom: '0.5rem',
                lineHeight: 1.8,
              }}
            >
              ✓ AUTHENTICATED VIA CRYPTOGRAPHIC SIGNATURE
            </div>
            <p style={{ fontFamily: 'Pixelify Sans, sans-serif', fontSize: '1rem', margin: 0, color: '#21242B' }}>
              No password stored. No session cookie. Just math.
            </p>
          </div>
        </div>

        {/* User panel */}
        <div
          className="card-yellow"
          style={{ marginBottom: '2rem' }}
        >
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, margin: '0 0 0.5rem', color: '#030404' }}>
            Logged in as
          </p>
          <p
            style={{
              fontFamily: 'Pixelify Sans, sans-serif',
              fontSize: 'clamp(0.9rem, 2vw, 1.125rem)',
              color: '#030404',
              fontWeight: 600,
              wordBreak: 'break-all',
              margin: '0 0 0.5rem',
            }}
          >
            {did}
          </p>
          <p style={{ fontFamily: 'Pixelify Sans, sans-serif', fontSize: '1rem', opacity: 0.5, margin: 0, color: '#21242B' }}>
            Identity verified on Polygon Amoy
          </p>
        </div>

        {/* Identity status tiles */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <StatusBadge status="ACTIVE" variant="tile" />
          <StatusBadge status="PENDING" variant="tile" />
          <StatusBadge status="FAILED" variant="tile" />
        </div>

        {/* Fake stat cards */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <StatCard icon={TrendingUp} label="Balance" value="$12,450" />
          <StatCard icon={Activity} label="Transactions" value="48" />
          <StatCard icon={Star} label="Security Score" value="100%" />
        </div>

        {/* Logout */}
        <button className="btn btn-danger" onClick={handleLogout}>
          <LogOut size={15} />
          LOG OUT
        </button>
      </div>
    </div>
  )
}

export default DemoService
