import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import logoImg from '../assets/pixel/logo.png'

const CHARS = '0123456789ABCDEF@#$%'
const ORIGINAL = 'ITTY'

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [suffix, setSuffix] = useState(ORIGINAL)
  const [collapsed, setCollapsed] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    clearInterval(intervalRef.current)

    if (scrolled) {
      // scramble right to left, dropping chars as we go
      setCollapsed(false)
      setSuffix(ORIGINAL)
      let frame = 0
      const totalFrames = 12
      intervalRef.current = setInterval(() => {
        frame++
        const remaining = Math.max(0, ORIGINAL.length - Math.floor((frame / totalFrames) * (ORIGINAL.length + 1)))
        if (remaining > 0) {
          setSuffix(
            ORIGINAL.slice(0, remaining).split('').map(() =>
              CHARS[Math.floor(Math.random() * CHARS.length)]
            ).join('')
          )
        } else {
          clearInterval(intervalRef.current)
          setSuffix('')
          setCollapsed(true)
        }
      }, 60)
    } else {
      // mirror: expand adding chars left to right, scrambling, then resolve
      setSuffix(CHARS[Math.floor(Math.random() * CHARS.length)])
      setCollapsed(false)
      let frame = 0
      const totalFrames = 12
      intervalRef.current = setInterval(() => {
        frame++
        const visible = Math.min(ORIGINAL.length, Math.ceil((frame / totalFrames) * (ORIGINAL.length + 1)))
        if (frame < totalFrames) {
          setSuffix(
            ORIGINAL.slice(0, visible).split('').map(() =>
              CHARS[Math.floor(Math.random() * CHARS.length)]
            ).join('')
          )
        } else {
          clearInterval(intervalRef.current)
          setSuffix(ORIGINAL)
        }
      }, 60)
    }

    return () => clearInterval(intervalRef.current)
  }, [scrolled])

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
            style={{ width: 44, height: 44, imageRendering: 'pixelated' }}
          />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#030404',
              whiteSpace: 'nowrap',
            }}
          >
            IDK
            <span
              style={{
                display: 'inline-block',
                maxWidth: collapsed ? '0' : '4em',
                opacity: collapsed ? 0 : 1,
                overflow: 'hidden',
                verticalAlign: 'bottom',
                transition: collapsed
                  ? 'max-width 0.3s ease, opacity 0.2s ease'
                  : 'max-width 0.4s ease 0.05s, opacity 0.3s ease 0.05s',
              }}
            >
              {suffix}
            </span>
          </span>
        </Link>

        {/* Right link */}
        <Link
          to="/login"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#030404',
            textDecoration: 'none',
            border: '2px solid #030404',
            padding: '0.35rem 0.75rem',
            boxShadow: '3px 3px 0px #030404',
            background: '#F5F3E7',
            transition: 'box-shadow 0.1s, transform 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '1px 1px 0px #030404'
            e.currentTarget.style.transform = 'translate(2px, 2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '3px 3px 0px #030404'
            e.currentTarget.style.transform = 'translate(0, 0)'
          }}
        >
          Login
        </Link>
      </div>
    </nav>
  )
}

export default NavBar
