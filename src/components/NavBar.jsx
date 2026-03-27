import { Link, useLocation } from 'react-router-dom'
import CatLogo from './CatLogo'

const NavBar = () => {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  const howItWorksTarget = isLanding ? '#how-it-works' : '/#how-it-works'

  return (
    <nav
      style={{
        borderBottom: '3px solid var(--white)',
        background: 'var(--bg)',
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
            color: 'var(--white)',
          }}
        >
          <CatLogo size={36} />
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: '1.3rem',
              letterSpacing: '-0.01em',
              color: 'var(--white)',
            }}
          >
            IDKitty
          </span>
        </Link>

        {/* Right link */}
        <a
          href={howItWorksTarget}
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--white)',
            textDecoration: 'none',
            borderBottom: '2px solid transparent',
            paddingBottom: '2px',
            transition: 'border-color 0.1s',
          }}
          onMouseEnter={e => (e.target.style.borderBottomColor = 'var(--orange)')}
          onMouseLeave={e => (e.target.style.borderBottomColor = 'transparent')}
        >
          How it works
        </a>
      </div>
    </nav>
  )
}

export default NavBar
