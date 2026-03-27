import { useState, useEffect, useRef } from 'react'

const DEFAULT_LINES = [
  'Connecting to Polygon...',
  'Broadcasting transaction...',
  'Awaiting confirmation...',
]

const Loader = ({ lines = DEFAULT_LINES }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex(i => (i + 1) % lines.length)
    }, 1200)
    return () => clearInterval(intervalRef.current)
  }, [lines.length])

  return (
    <div className="terminal" style={{ display: 'inline-block', minWidth: '320px' }}>
      <span style={{ color: 'var(--orange)' }}>
        {'> '}{lines[currentIndex]}
        <span className="terminal-cursor" style={{ marginLeft: '2px' }}>█</span>
      </span>
    </div>
  )
}

export default Loader
