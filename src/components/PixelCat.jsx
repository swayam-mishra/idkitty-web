import { useState, useEffect } from 'react'

const FG     = '#f5f0e8'
const BG     = '#0a0a0a'
const ACCENT = '#FF6B2B'
const YELLOW = '#FFE500'
const MINT   = '#00FF94'
const PINK   = '#FF2D78'

function CatInternals({ variant }) {
  return (
    <>
      <rect x="1"  y="0" width="3" height="3" fill={FG} />
      <rect x="12" y="0" width="3" height="3" fill={FG} />
      <rect x="0"  y="3" width="16" height="13" fill={BG} />
      <rect x="0"  y="3" width="16" height="13" fill="none" stroke={FG} strokeWidth="1" />

      {variant === 'angry' && <>
        <rect x="3"  y="6" width="1" height="1" fill={PINK} />
        <rect x="4"  y="5" width="2" height="1" fill={PINK} />
        <rect x="10" y="5" width="2" height="1" fill={PINK} />
        <rect x="12" y="6" width="1" height="1" fill={PINK} />
      </>}

      {variant === 'neutral' && <>
        <rect x="3"  y="7" width="2" height="2" fill={YELLOW} />
        <rect x="11" y="7" width="2" height="2" fill={YELLOW} />
      </>}

      {variant === 'blink' && <>
        <rect x="3"  y="7" width="2" height="2" fill={YELLOW} />
        <rect x="11" y="8" width="2" height="1" fill={YELLOW} />
      </>}

      {variant === 'happy' && <>
        <rect x="3"  y="8" width="1" height="1" fill={MINT} />
        <rect x="4"  y="7" width="1" height="1" fill={MINT} />
        <rect x="5"  y="8" width="1" height="1" fill={MINT} />
        <rect x="11" y="8" width="1" height="1" fill={MINT} />
        <rect x="12" y="7" width="1" height="1" fill={MINT} />
        <rect x="13" y="8" width="1" height="1" fill={MINT} />
      </>}

      {variant === 'angry' && <>
        <rect x="3"  y="7" width="2" height="2" fill={PINK} />
        <rect x="11" y="7" width="2" height="2" fill={PINK} />
      </>}

      <rect x="7" y="11" width="2" height="1" fill={ACCENT} />

      <rect x="0"  y="9"  width="2" height="1" fill={FG} opacity="0.3" />
      <rect x="0"  y="11" width="2" height="1" fill={FG} opacity="0.3" />
      <rect x="14" y="9"  width="2" height="1" fill={FG} opacity="0.3" />
      <rect x="14" y="11" width="2" height="1" fill={FG} opacity="0.3" />
    </>
  )
}

const PixelCat = ({ variant = 'neutral', size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={className}
    aria-hidden="true"
  >
    <CatInternals variant={variant} />
  </svg>
)

export const PixelCatLoader = ({ size = 24, className = '' }) => {
  const [blinking, setBlinking] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setBlinking(b => !b), 500)
    return () => clearInterval(id)
  }, [])
  return (
    <div role="status" aria-label="Loading" className={`inline-block ${className}`}>
      <PixelCat variant={blinking ? 'blink' : 'neutral'} size={size} />
    </div>
  )
}

export const PawIcon = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={className}
    aria-hidden="true"
  >
    <rect x="2"  y="5" width="2" height="3" />
    <rect x="5"  y="4" width="2" height="4" />
    <rect x="9"  y="4" width="2" height="4" />
    <rect x="12" y="5" width="2" height="3" />
    <rect x="4"  y="8" width="8" height="5" />
  </svg>
)

export const IdCardFrame = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={className}
    aria-hidden="true"
  >
    <rect x="0"  y="0"  width="6" height="2" fill={FG} />
    <rect x="0"  y="0"  width="2" height="6" fill={FG} />
    <rect x="26" y="0"  width="6" height="2" fill={FG} />
    <rect x="30" y="0"  width="2" height="6" fill={FG} />
    <rect x="0"  y="26" width="2" height="6" fill={FG} />
    <rect x="0"  y="30" width="6" height="2" fill={FG} />
    <rect x="30" y="26" width="2" height="6" fill={FG} />
    <rect x="26" y="30" width="6" height="2" fill={FG} />
    <rect x="3"  y="3"  width="14" height="16" fill="none" stroke={FG} strokeWidth="1" opacity="0.4" />
    <rect x="3"  y="22" width="26" height="7"  fill="none" stroke={FG} strokeWidth="1" opacity="0.4" />
    <rect x="5"  y="24" width="8"  height="1" fill={FG} opacity="0.35" />
    <rect x="5"  y="26" width="14" height="1" fill={FG} opacity="0.25" />
  </svg>
)

export const EyesOnly = ({ open = true, size = 16, className = '' }) => (
  <svg
    width={size}
    height={size / 2}
    viewBox="0 0 16 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={className}
    aria-hidden="true"
  >
    {open ? (
      <>
        <rect x="1" y="2" width="4" height="4" fill={YELLOW} />
        <rect x="11" y="2" width="4" height="4" fill={YELLOW} />
      </>
    ) : (
      <>
        <rect x="1" y="4" width="4" height="1" fill={YELLOW} />
        <rect x="11" y="4" width="4" height="1" fill={YELLOW} />
      </>
    )}
  </svg>
)

export default PixelCat
