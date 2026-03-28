import { useState, useEffect, useRef } from 'react'
import eyesOpen from '../assets/pixel/loader-eyes-open.svg'
import eyesClosed from '../assets/pixel/loader-eyes-closed.svg'
import SafeImg from './SafeImg'

const DEFAULT_LINES = [
  'Connecting to Polygon',
  'Broadcasting transaction',
  'Awaiting confirmation',
]

const Loader = ({ lines = DEFAULT_LINES }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [blinking, setBlinking] = useState(false)
  const [dotCount, setDotCount] = useState(1)
  const blinkRef = useRef(null)
  const dotRef = useRef(null)
  const lineRef = useRef(null)

  useEffect(() => {
    blinkRef.current = setInterval(() => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 120)
    }, 2500)
    dotRef.current = setInterval(() => {
      setDotCount(d => (d >= 3 ? 1 : d + 1))
    }, 300)
    lineRef.current = setInterval(() => {
      setCurrentIndex(i => (i + 1) % lines.length)
    }, 1200)
    return () => {
      clearInterval(blinkRef.current)
      clearInterval(dotRef.current)
      clearInterval(lineRef.current)
    }
  }, [lines.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <SafeImg
        src={blinking ? eyesClosed : eyesOpen}
        alt=""
        style={{ width: 80, imageRendering: 'pixelated' }}
      />
      <span
        style={{
          fontFamily: 'Pixelify Sans, sans-serif',
          fontSize: '1.125rem',
          color: '#030404',
          letterSpacing: '0.04em',
        }}
      >
        {lines[currentIndex]}{'.'.repeat(dotCount)}
      </span>
    </div>
  )
}

export default Loader
