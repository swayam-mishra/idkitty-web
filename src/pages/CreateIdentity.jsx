import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Eye, EyeOff, Loader2, CheckCircle2, Circle } from 'lucide-react'
import NavBar from '../components/NavBar'
import { generateKeyPair } from '../services/crypto'
import { registerIdentity } from '../services/api'
import { saveIdentity } from '../store/identity.store'

// Terminal lines for the typewriter
const TERMINAL_LINES = [
  { text: '> Initializing IDKitty vault...', color: '#F5F3E7' },
  { text: '> Generating ECDSA keypair (P-256)...', color: '#F5F3E7' },
]

const StepBar = ({ step }) => (
  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
    {[1, 2, 3].map(n => (
      <div
        key={n}
        className={`step-block ${n < step ? 'done' : n === step ? 'active' : ''}`}
      />
    ))}
  </div>
)

const StatusRow = ({ done, active, text }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontFamily: 'Pixelify Sans, sans-serif',
      fontSize: '1.125rem',
      color: done ? '#5EC374' : active ? '#25CFE6' : '#030404',
      opacity: done || active ? 1 : 0.4,
    }}
  >
    {done ? (
      <CheckCircle2 size={16} className="check-pop" style={{ color: '#5EC374', flexShrink: 0 }} />
    ) : active ? (
      <Loader2 size={16} className="spin" style={{ color: '#25CFE6', flexShrink: 0 }} />
    ) : (
      <Circle size={16} style={{ flexShrink: 0 }} />
    )}
    {text}
  </div>
)

const CreateIdentity = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [keyPair, setKeyPair] = useState(null)
  const [revealedLines, setRevealedLines] = useState([])
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [claims, setClaims] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [anchorStep, setAnchorStep] = useState(0)
  const [error, setError] = useState(null)

  // Generate keypair + typewriter on mount
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      await new Promise(r => setTimeout(r, 400))
      if (cancelled) return
      setRevealedLines([0])

      await new Promise(r => setTimeout(r, 900))
      if (cancelled) return
      setRevealedLines([0, 1])

      const kp = await generateKeyPair()
      if (cancelled) return
      setKeyPair(kp)
    }

    run()
    return () => { cancelled = true }
  }, [])

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  const handleRegister = async (skip = false) => {
    const delay = ms => new Promise(r => setTimeout(r, ms))

    setLoading(true)
    setError(null)
    setStep(3)

    setAnchorStep(0)
    await delay(800)

    setAnchorStep(1)
    await delay(800)

    const claimsToSend = skip ? {} : { name: claims.name, email: claims.email }
    const identity = {
      did: keyPair.did,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      claims: claimsToSend,
      createdAt: new Date().toISOString(),
      txHash: null,
    }
    saveIdentity(identity)

    setAnchorStep(2)
    const apiCall = registerIdentity(keyPair.did, keyPair.publicKey, claimsToSend)
      .then(res => ({ ok: true, data: res.data }))
      .catch(err => ({ ok: false, error: err?.response?.data?.error || 'Backend not reachable — identity saved locally.' }))

    const [result] = await Promise.all([apiCall, delay(2500)])

    setAnchorStep(3)
    await delay(800)

    if (result.ok) {
      setTxHash(result.data.txHash)
      saveIdentity({ ...identity, txHash: result.data.txHash })
    } else {
      setError(result.error)
    }

    setAnchorStep(4)
    setLoading(false)
  }

  return (
    <div className="page">
      <NavBar />
      <div
        className="container"
        style={{ maxWidth: '700px', padding: '3rem 1.5rem' }}
      >
        <StepBar step={step} />

        {/* ── STEP 1 — GENERATE ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '1rem',
                textTransform: 'uppercase',
                lineHeight: 1.6,
                margin: 0,
                color: '#030404',
              }}
            >
              Generate Your Identity
            </h2>

            {/* Terminal box */}
            <div className="terminal" style={{ minHeight: '180px' }}>
              {TERMINAL_LINES.map((line, i) =>
                revealedLines.includes(i) ? (
                  <div key={i} style={{ color: line.color, marginBottom: '0.3rem' }}>
                    {line.text}
                  </div>
                ) : null
              )}

              {keyPair && (
                <>
                  <div className="bounce-in" style={{ color: '#25CFE6', fontWeight: 600, marginBottom: '0.3rem' }}>
                    {'> DID:         '}{keyPair.did}
                  </div>
                  <div style={{ color: '#5EC374', marginBottom: '0.3rem', wordBreak: 'break-all' }}>
                    {'> Public Key:  '}{keyPair.publicKey.slice(0, 40)}...
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#E74B4A' }}>
                      {'> Private Key: '}
                      {showPrivateKey
                        ? keyPair.privateKey.slice(0, 32) + '...'
                        : '████████████████████████████████'}
                    </span>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'transparent', border: '2px solid #F5F3E7', color: '#F5F3E7', boxShadow: 'none' }}
                      onClick={() => setShowPrivateKey(v => !v)}
                    >
                      {showPrivateKey ? <><EyeOff size={12} /> HIDE</> : <><Eye size={12} /> REVEAL</>}
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'transparent', border: '2px solid #F5F3E7', color: '#F5F3E7', boxShadow: 'none' }}
                      onClick={() => copyToClipboard(keyPair.privateKey, 'privkey')}
                    >
                      <Copy size={12} /> {copied === 'privkey' ? 'COPIED 🐾' : 'COPY'}
                    </button>
                  </div>
                  {!revealedLines.includes(2) && (
                    <span className="terminal-cursor" style={{ color: '#F5F3E7', opacity: 0.5 }}>█</span>
                  )}
                </>
              )}

              {!keyPair && (
                <span className="terminal-cursor" style={{ color: '#F5F3E7', opacity: 0.5 }}>█</span>
              )}
            </div>

            {/* Warning */}
            {keyPair && (
              <div className="alert-pink" style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🙀</span>
                <span style={{ fontFamily: 'Pixelify Sans, sans-serif', fontSize: '1.125rem', lineHeight: 1.5, color: '#030404' }}>
                  We never see your private key. Screenshot it. Write it down. Don&apos;t lose it.
                </span>
              </div>
            )}

            <button
              className="btn btn-primary"
              disabled={!keyPair}
              style={{ alignSelf: 'flex-start', opacity: keyPair ? 1 : 0.4 }}
              onClick={() => setStep(2)}
            >
              NEXT: CLAIM YOUR IDENTITY →
            </button>
          </div>
        )}

        {/* ── STEP 2 — CLAIMS ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                  margin: '0 0 0.5rem',
                  lineHeight: 1.6,
                  color: '#030404',
                }}
              >
                Add Your Claims
              </h2>
              <p
                style={{
                  fontFamily: 'Pixelify Sans, sans-serif',
                  fontSize: '1rem',
                  color: '#21242B',
                  opacity: 0.6,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                OPTIONAL — skip if you want anonymity
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, color: '#030404' }}>
                  Name
                </label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Your name..."
                  value={claims.name}
                  onChange={e => setClaims(c => ({ ...c, name: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, color: '#030404' }}>
                  Email
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="your@email.com"
                  value={claims.email}
                  onChange={e => setClaims(c => ({ ...c, email: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                disabled={loading}
                onClick={() => handleRegister(false)}
              >
                {loading ? <><Loader2 size={14} className="spin" /> Registering...</> : <>REGISTER IDENTITY →</>}
              </button>
              <button
                className="btn btn-ghost"
                disabled={loading}
                onClick={() => handleRegister(true)}
              >
                SKIP →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — ANCHORING ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '1rem',
                textTransform: 'uppercase',
                margin: 0,
                lineHeight: 1.6,
                color: '#030404',
              }}
            >
              Anchoring Identity
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <StatusRow done={anchorStep > 0} active={anchorStep === 0} text="Keypair generated" />
              <StatusRow done={anchorStep > 1} active={anchorStep === 1} text="Claims packaged" />
              <StatusRow done={anchorStep > 2} active={anchorStep === 2} text="Writing to Polygon Amoy..." />
              <StatusRow done={anchorStep > 3} active={anchorStep === 3} text="Awaiting confirmation" />
              <StatusRow done={anchorStep >= 4} active={false} text="Identity anchored" />
            </div>

            {anchorStep >= 4 && (
              <div className="bounce-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {txHash ? (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontFamily: 'Pixelify Sans, sans-serif',
                      fontSize: '1rem',
                      color: '#25CFE6',
                      textDecoration: 'underline',
                    }}
                  >
                    TX: {txHash.slice(0, 20)}... → Polygonscan ↗
                  </a>
                ) : error ? (
                  <div className="alert-pink" style={{ fontFamily: 'Pixelify Sans, sans-serif', fontSize: '1rem' }}>
                    {error}
                  </div>
                ) : null}

                <button
                  className="btn btn-primary bounce-in"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => navigate('/dashboard')}
                >
                  GO TO DASHBOARD →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateIdentity
