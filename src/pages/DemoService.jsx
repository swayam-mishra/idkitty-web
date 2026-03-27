import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, TrendingUp, Activity, Star } from 'lucide-react'
import CatLogo from '../components/CatLogo'
import { loadJWT, clearJWT, loadIdentity } from '../store/identity.store'

const StatCard = ({ icon: Icon, label, value, shadowColor }) => (
  <div
    className="card"
    style={{ boxShadow: `6px 6px 0px ${shadowColor}`, flex: 1, minWidth: '160px' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', opacity: 0.6 }}>
      <Icon size={15} />
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
    <div
      style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 700,
        fontSize: '1.6rem',
        color: 'var(--white)',
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
          borderBottom: '3px solid var(--white)',
          background: 'var(--bg-raised)',
          padding: '0.9rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '1.2rem',
            letterSpacing: '-0.01em',
          }}
        >
          🏦 PURRBANK
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '0.75rem',
              color: 'var(--orange)',
              opacity: 0.8,
            }}
          >
            Secured by
          </span>
          <CatLogo size={20} />
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--orange)' }}>
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
          <ShieldCheck size={20} style={{ color: 'var(--mint)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--mint)',
                marginBottom: '0.25rem',
              }}
            >
              ✓ AUTHENTICATED VIA CRYPTOGRAPHIC SIGNATURE
            </div>
            <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', margin: 0, opacity: 0.75 }}>
              No password stored. No session cookie. Just math.
            </p>
          </div>
        </div>

        {/* User panel */}
        <div
          className="card-yellow"
          style={{ marginBottom: '2rem' }}
        >
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, margin: '0 0 0.4rem' }}>
            Logged in as
          </p>
          <p
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 'clamp(0.7rem, 2vw, 0.95rem)',
              color: 'var(--orange)',
              fontWeight: 600,
              wordBreak: 'break-all',
              margin: '0 0 0.5rem',
            }}
          >
            {did}
          </p>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.75rem', opacity: 0.5, margin: 0 }}>
            Identity verified on Polygon Amoy
          </p>
        </div>

        {/* Fake stat cards */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <StatCard
            icon={TrendingUp}
            label="Balance"
            value="$12,450"
            shadowColor="var(--orange)"
          />
          <StatCard
            icon={Activity}
            label="Transactions"
            value="48"
            shadowColor="var(--lavender)"
          />
          <StatCard
            icon={Star}
            label="Security Score"
            value="100%"
            shadowColor="var(--mint)"
          />
        </div>

        {/* Logout */}
        <button className="btn btn-ghost" style={{ boxShadow: 'var(--shadow-pink)' }} onClick={handleLogout}>
          <LogOut size={15} />
          LOG OUT
        </button>
      </div>
    </div>
  )
}

export default DemoService
