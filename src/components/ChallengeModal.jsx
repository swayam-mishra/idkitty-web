import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const ChallengeModal = ({ challenge, onSign, loading }) => {
  const [privateKey, setPrivateKey] = useState('')
  const [seconds, setSeconds] = useState(60)

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setInterval(() => setSeconds(s => s - 1), 1000)
    return () => clearInterval(timer)
  }, [seconds])

  const handleSubmit = () => {
    if (privateKey.trim()) onSign(privateKey.trim())
  }

  return (
    <div className="bounce-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Challenge terminal box */}
      <div className="terminal">
        <div style={{ color: 'var(--white)', opacity: 0.6, marginBottom: '0.4rem' }}>
          {'>'} Challenge issued:
        </div>
        <div
          style={{
            color: 'var(--yellow)',
            fontWeight: 600,
            wordBreak: 'break-all',
            letterSpacing: '0.05em',
            marginBottom: '0.4rem',
          }}
        >
          {challenge}
        </div>
        <div style={{ color: 'var(--white)', opacity: 0.6, marginBottom: '0.4rem' }}>
          {'>'} Sign this string with your private key.
        </div>
        <div>
          {'>'}{' '}
          <span style={{ color: seconds <= 10 ? 'var(--hot-pink)' : 'var(--white)', opacity: 0.7 }}>
            Expires in: {seconds}s
          </span>
        </div>
      </div>

      {/* Private key input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--white)',
            opacity: 0.7,
          }}
        >
          YOUR PRIVATE KEY
        </label>
        <input
          type="password"
          className="input-field"
          placeholder="Paste your private key hex..."
          value={privateKey}
          onChange={e => setPrivateKey(e.target.value)}
        />
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.72rem', color: 'var(--hot-pink)' }}>
          Stays in your browser. Never sent to the server.
        </span>
      </div>

      {/* Sign button */}
      <button
        className="btn btn-danger"
        onClick={handleSubmit}
        disabled={loading || !privateKey.trim() || seconds <= 0}
        style={{
          opacity: (loading || !privateKey.trim() || seconds <= 0) ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="spin" />
            Signing...
          </>
        ) : (
          'SIGN & AUTHENTICATE →'
        )}
      </button>
    </div>
  )
}

export default ChallengeModal
