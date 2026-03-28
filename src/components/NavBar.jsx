import { Link, useLocation } from 'react-router-dom'
import logoImg from '../assets/pixel/logo.png'

const NavBar = () => {
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const howItWorksTarget = isLanding ? '#how-it-works' : '/#how-it-works'

  return (
    <nav
      style={{
        borderBottom: '3px solid #030404',
        background: '#F5F3E7',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 1.5rem',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
            color: '#030404',
          }}
        >
          <img
            src={logoImg}
            alt="IDKitty"
            style={{ width: 32, height: 32, imageRendering: 'pixelated' }}
          />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1rem',
              color: '#030404',
            }}
          >
            IDKITTY
          </span>
        </Link>

        {/* Right link */}
        <a
          href={howItWorksTarget}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#030404',
            textDecoration: 'none',
            borderBottom: '2px solid transparent',
            paddingBottom: '2px',
            transition: 'border-color 0.1s',
          }}
          onMouseEnter={e => (e.target.style.borderBottomColor = '#25CFE6')}
          onMouseLeave={e => (e.target.style.borderBottomColor = 'transparent')}
        >
          How it works
        </a>
      </div>
    </nav>
  )
}

export default NavBar
