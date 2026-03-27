import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import CatLogo from '../components/CatLogo'

// Floating paw config — random positions + rotation + duration
const PAW_CONFIGS = [
  { left: '5%',  top: '80%', rot: '-15deg', dur: '22s', delay: '0s'   },
  { left: '15%', top: '95%', rot: '20deg',  dur: '28s', delay: '-6s'  },
  { left: '28%', top: '90%', rot: '-8deg',  dur: '19s', delay: '-12s' },
  { left: '42%', top: '85%', rot: '35deg',  dur: '25s', delay: '-4s'  },
  { left: '57%', top: '92%', rot: '-25deg', dur: '31s', delay: '-9s'  },
  { left: '70%', top: '88%', rot: '12deg',  dur: '21s', delay: '-15s' },
  { left: '82%', top: '96%', rot: '-40deg', dur: '27s', delay: '-2s'  },
  { left: '93%', top: '83%', rot: '18deg',  dur: '23s', delay: '-18s' },
]

const HowItWorksCard = ({ number, title, description, shadowColor }) => (
  <div
    className="card"
    style={{ boxShadow: `6px 6px 0px ${shadowColor}`, flex: 1, minWidth: 0 }}
  >
    <div
      style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '2.5rem',
        fontWeight: 600,
        color: shadowColor,
        lineHeight: 1,
        marginBottom: '0.75rem',
      }}
    >
      {number}
    </div>
    <h3
      style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 700,
        fontSize: '1.05rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--white)',
        margin: '0 0 0.5rem',
      }}
    >
      {title}
    </h3>
    <p
      style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '0.8rem',
        color: 'var(--white)',
        opacity: 0.65,
        lineHeight: 1.6,
        margin: 0,
      }}
    >
      {description}
    </p>
  </div>
)

const Landing = () => {
  const navigate = useNavigate()

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Floating paw background */}
      {PAW_CONFIGS.map((cfg, i) => (
        <div
          key={i}
          className="bg-paw"
          style={{
            left: cfg.left,
            top: cfg.top,
            '--rot': cfg.rot,
            '--dur': cfg.dur,
            animationDelay: cfg.delay,
            backgroundImage: "url('/paw-cursor.svg')",
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
          }}
        />
      ))}

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
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(3rem, 9vw, 6rem)',
            textTransform: 'uppercase',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            color: 'var(--white)',
            margin: '0 0 1.5rem',
          }}
        >
          YOUR IDENTITY.
          <br />
          NO ONE ELSE&apos;S.
        </h1>

        <p
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            color: 'var(--white)',
            opacity: 0.65,
            marginBottom: '2.5rem',
            maxWidth: '500px',
          }}
        >
          No passwords. No databases. No breaches. Just you and your keys.
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

      {/* Stat strip */}
      <div
        style={{
          borderTop: '3px solid var(--white)',
          borderBottom: '3px solid var(--white)',
          background: 'var(--bg-raised)',
          padding: '1.2rem 1.5rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            textAlign: 'center',
          }}
        >
          {[
            '4.5B records breached in 2023',
            '0 passwords stored',
            'You own your keys. Always.',
          ].map((stat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <span
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '0.85rem',
                  color: 'var(--white)',
                  opacity: 0.85,
                  letterSpacing: '0.03em',
                }}
              >
                {stat}
              </span>
              {i < 2 && (
                <span style={{ fontSize: '1.1rem', opacity: 0.5 }}>🐾</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section
        id="how-it-works"
        style={{ padding: '5rem 1.5rem', position: 'relative', zIndex: 1 }}
      >
        <div className="container">
          <h2
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              color: 'var(--white)',
              marginBottom: '2.5rem',
              textAlign: 'center',
            }}
          >
            How it works
          </h2>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <HowItWorksCard
              number="01"
              title="Generate Keys"
              description="Your browser generates a keypair. We never touch the private key. It never leaves your device."
              shadowColor="var(--orange)"
            />
            <HowItWorksCard
              number="02"
              title="Anchor on Chain"
              description="Your public key gets written to Polygon. Immutable. Verifiable. Yours forever."
              shadowColor="var(--lavender)"
            />
            <HowItWorksCard
              number="03"
              title="Sign to Login"
              description="Prove you're you by signing a challenge. No password typed. No server touched. Just math."
              shadowColor="var(--yellow)"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '3px solid var(--white)',
          padding: '1.5rem',
          position: 'relative',
          zIndex: 1,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CatLogo size={28} />
            <span
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--white)',
              }}
            >
              IDKitty
            </span>
          </div>
          <span
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '0.78rem',
              color: 'var(--white)',
              opacity: 0.4,
            }}
          >
            Built at hackathon with love and caffeine
          </span>
        </div>
      </footer>
    </div>
  )
}

export default Landing
