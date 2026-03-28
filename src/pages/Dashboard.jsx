import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, ExternalLink, LogIn } from 'lucide-react'
import NavBar from '../components/NavBar'
import IdentityCard from '../components/IdentityCard'
import { loadIdentity } from '../store/identity.store'

const Dashboard = () => {
  const navigate = useNavigate()
  const [identity, setIdentity] = useState(null)
  const [copyLabel, setCopyLabel] = useState('COPY DID')

  useEffect(() => {
    const stored = loadIdentity()
    if (!stored) {
      navigate('/create')
    } else {
      setIdentity(stored)
    }
  }, [navigate])

  const handleCopyDid = () => {
    if (!identity) return
    navigator.clipboard.writeText(identity.did)
    setCopyLabel('COPIED')
    setTimeout(() => setCopyLabel('COPY DID'), 1500)
  }

  if (!identity) return null

  const polygonscanUrl = identity.txHash
    ? `https://amoy.polygonscan.com/tx/${identity.txHash}`
    : `https://amoy.polygonscan.com`

  return (
    <div className="page">
      <NavBar />

      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px' }}>
        <h2
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            marginBottom: '2rem',
            lineHeight: 1.6,
            color: '#030404',
          }}
        >
          Your Identity
        </h2>

        {/* Identity card */}
        <IdentityCard
          did={identity.did}
          name={identity.claims?.name}
          email={identity.claims?.email}
          createdAt={identity.createdAt}
          txHash={identity.txHash}
        />

        {/* Action row */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            TEST LOGIN
          </button>

          <button
            className="btn btn-ghost"
            onClick={handleCopyDid}
          >
            <Copy size={15} />
            {copyLabel}
          </button>

          <a
            href={polygonscanUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost-yellow"
          >
            <ExternalLink size={15} />
            VIEW ON POLYGONSCAN ↗
          </a>
        </div>

        {/* Security callout */}
        <div className="alert-pink" style={{ marginTop: '2rem' }}>
          <p
            style={{
              fontFamily: 'Pixelify Sans, sans-serif',
              fontSize: '1.125rem',
              lineHeight: 1.7,
              margin: 0,
              color: '#030404',
            }}
          >
            Your private key lives only in your browser.
            <br />
            This server stores: your DID, your public key.
            <br />
            That&apos;s it. We couldn&apos;t leak your secrets even if we tried.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
