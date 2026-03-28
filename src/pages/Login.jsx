import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Copy } from 'lucide-react'
import NavBar from '../components/NavBar'
import ChallengeModal from '../components/ChallengeModal'
import { signChallenge } from '../services/crypto'
import { requestChallenge, verifySignature } from '../services/api'
import { saveJWT } from '../store/identity.store'

const Login = () => {
  const navigate = useNavigate()
  const [did, setDid] = useState('')
  const [challenge, setChallenge] = useState(null)
  const [status, setStatus] = useState(null) // null | 'success' | 'fail'
  const [jwt, setJwt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copiedJwt, setCopiedJwt] = useState(false)

  const handleRequestChallenge = async () => {
    if (!did.trim()) return
    setLoading(true)
    setError(null)
    setChallenge(null)
    setStatus(null)
    try {
      const res = await requestChallenge(did.trim())
      setChallenge(res.data.challenge)
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not reach backend. Is it running?')
    }
    setLoading(false)
  }

  const handleSign = async (privateKeyHex) => {
    setLoading(true)
    setError(null)
    try {
      const sig = await signChallenge(challenge, privateKeyHex)
      const res = await verifySignature(did.trim(), sig)
      if (res.data.success) {
        saveJWT(res.data.token)
        setJwt(res.data.token)
        setStatus('success')
      } else {
        setStatus('fail')
      }
    } catch {
      setStatus('fail')
    }
    setLoading(false)
  }

  const copyJwt = () => {
    navigator.clipboard.writeText(jwt)
    setCopiedJwt(true)
    setTimeout(() => setCopiedJwt(false), 1500)
  }

  return (
    <div className="page">
      <NavBar />

      <div className="container" style={{ maxWidth: '620px', padding: '3rem 1.5rem' }}>
        {/* Page label */}
        <p
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#25CFE6',
            marginBottom: '1rem',
          }}
        >
          CRYPTOGRAPHIC LOGIN — POWERED BY IDKITTY
        </p>

        <h2
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1rem',
            textTransform: 'uppercase',
            margin: '0 0 2rem',
            lineHeight: 1.6,
            color: '#030404',
          }}
        >
          Authenticate
        </h2>

        {/* DID input + request challenge */}
        {status !== 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <label
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.7,
                color: '#030404',
              }}
            >
              YOUR DID
            </label>
            <input
              className="input-field"
              type="text"
              placeholder="did:idkitty:0x..."
              value={did}
              onChange={e => setDid(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRequestChallenge()}
            />

            <button
              className="btn btn-blue"
              style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
              disabled={loading || !did.trim()}
              onClick={handleRequestChallenge}
            >
              {loading && !challenge
                ? <><Loader2 size={14} className="spin" /> Requesting...</>
                : 'REQUEST CHALLENGE →'}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert-pink" style={{ marginBottom: '1.5rem', fontFamily: 'Pixelify Sans, sans-serif', fontSize: '1rem' }}>
            {error}
          </div>
        )}

        {/* Challenge + sign section */}
        {challenge && status === null && (
          <ChallengeModal
            challenge={challenge}
            onSign={handleSign}
            loading={loading}
          />
        )}

        {/* Success state */}
        {status === 'success' && (
          <div className="alert-mint bounce-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: '#5EC374',
                lineHeight: 1.6,
              }}
            >
              ✓ AUTHENTICATED
            </div>
            <p style={{ fontFamily: 'Pixelify Sans, sans-serif', fontSize: '1.125rem', margin: 0, color: '#21242B' }}>
              No password. No collar. Just your keys.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'Pixelify Sans, sans-serif',
                  fontSize: '1rem',
                  color: '#21242B',
                  wordBreak: 'break-all',
                }}
              >
                JWT: {jwt?.slice(0, 40)}...
              </span>
              <button
                className="btn btn-sm btn-ghost-mint"
                onClick={copyJwt}
              >
                <Copy size={11} /> {copiedJwt ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
              onClick={() => navigate('/demo')}
            >
              ENTER PURRBANK →
            </button>
          </div>
        )}

        {/* Fail state */}
        {status === 'fail' && (
          <div className="alert-pink bounce-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: '#E74B4A',
                lineHeight: 1.6,
              }}
            >
              ✗ INVALID SIGNATURE
            </div>
            <p style={{ fontFamily: 'Pixelify Sans, sans-serif', fontSize: '1.125rem', margin: 0, color: '#21242B' }}>
              Even cats check their keys.
            </p>
            <button
              className="btn btn-sm btn-ghost"
              style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
              onClick={() => { setStatus(null); setChallenge(null) }}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
