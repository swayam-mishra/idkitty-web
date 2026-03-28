import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import logoImg from '../assets/pixel/logo.png'

const HowItWorksCard = ({ number, title, description, accentColor }) => {
  return (
    <div
      className="card"
      style={{
        boxShadow: '6px 6px 0px #030404',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '1.5rem',
          color: accentColor,
          lineHeight: 1,
          marginBottom: '1rem',
        }}
      >
        {number}
      </div>
      <h3
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: '#030404',
          margin: '0 0 0.75rem',
          lineHeight: 1.6,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'Pixelify Sans, sans-serif',
          fontSize: '1.125rem',
          color: '#21242B',
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  )
}

const Landing = () => {
  const navigate = useNavigate()

  return (
    <div className="page" style={{ position: 'relative' }}>
      <NavBar />

      {/* Hero */}
      <section
        style={{
          minHeight: 'calc(100vh - 62px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '4rem 1.5rem',
        }}
      >
        <h1
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '80px',
            fontWeight: 800,
            textTransform: 'uppercase',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: '#030404',
            margin: '0',
          }}
        >
          YOUR IDENTITY.
          <br />
          NO ONE ELSE&apos;S.
        </h1>

        <p
          style={{
            fontFamily: 'Pixelify Sans, sans-serif',
            fontSize: '18px',
            color: '#21242B',
            margin: '24px 0 2.5rem',
            maxWidth: '500px',
            lineHeight: 1.5,
          }}
        >
          No passwords. No databases. No breaches.
          <br />
          Just you and your keys.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/create')}>
            CREATE IDENTITY →
          </button>
          <a href="#how-it-works" className="btn btn-ghost">
            LEARN HOW IT WORKS ↓
          </a>
        </div>
      </section>

      {/* Stat strip — marquee */}
      <div
        style={{
          borderTop: '3px solid #030404',
          borderBottom: '3px solid #030404',
          background: '#030404',
          padding: '1.2rem 0',
          overflow: 'hidden',
        }}
      >
        {(() => {
          const stats = [
            '4.5B records breached in 2023',
            '0 passwords stored by IDKitty',
            'Your keys. Always.',
            '100% client-side key generation',
            'Polygon Amoy — immutable identity',
            'No server ever sees your private key',
          ]
          const StatList = ({ prefix }) => (
            <>
              {stats.map((s, i) => (
                <span key={`${prefix}${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Pixelify Sans, sans-serif', fontSize: '14px', color: '#F5F3E7', whiteSpace: 'nowrap' }}>{s}</span>
                  <span style={{ padding: '0 32px', color: '#F5F3E7', opacity: 0.4 }}>·</span>
                </span>
              ))}
            </>
          )
          return (
            <div className="marquee-track">
              <StatList prefix="a" />
              <StatList prefix="b" />
            </div>
          )
        })()}
      </div>

      {/* How it works */}
      <section
        id="how-it-works"
        style={{ padding: '5rem 1.5rem' }}
      >
        <div className="container">
          <h2
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              color: '#030404',
              marginBottom: '2.5rem',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            How it works
          </h2>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', overflow: 'visible' }}>
            <HowItWorksCard
              number="01"
              title="Generate Keys"
              description="Your browser generates a keypair. We never touch the private key. It never leaves your device."
              accentColor="#25CFE6"
            />
            <HowItWorksCard
              number="02"
              title="Anchor on Chain"
              description="Your public key gets written to Polygon. Immutable. Verifiable. Yours forever."
              accentColor="#5EC374"
            />
            <HowItWorksCard
              number="03"
              title="Sign to Login"
              description="Prove you're you by signing a challenge. No password typed. No server touched. Just math."
              accentColor="#E74B4A"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '3px solid #030404',
          padding: '1.5rem',
          background: '#F5F3E7',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={logoImg} width={28} height={28} alt="IDKitty" style={{ imageRendering: 'pixelated' }} />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                color: '#030404',
              }}
            >
              IDKitty
            </span>
            <a
              href="mailto:getidkitty@gmail.com"
              style={{ color: '#030404', display: 'flex', alignItems: 'center' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
            <a
              href="https://x.com/getidkitty"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#030404', display: 'flex', alignItems: 'center' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              color: '#21242B',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            built at <strong>HackOlympus</strong> by{' '}
            <a href="https://x.com/swaayyam" target="_blank" rel="noopener noreferrer" style={{ color: '#25CFE6', textDecoration: 'none', fontWeight: 700 }}>@swaayyam</a>
            {' '}&amp;{' '}
            <a href="https://x.com/uutkarrsh" target="_blank" rel="noopener noreferrer" style={{ color: '#25CFE6', textDecoration: 'none', fontWeight: 700 }}>@uutkarrsh</a>
            {' '}with <img src="/cursor-original.png" alt="" style={{ width: 18, height: 18, imageRendering: 'pixelated', verticalAlign: 'middle' }} />
          </span>
        </div>
      </footer>
    </div>
  )
}

export default Landing
