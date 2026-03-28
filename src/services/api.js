import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  headers: { 'Content-Type': 'application/json' },
})

export const registerIdentity = (did, publicKey, claims) =>
  api.post('/api/identity/register', { did, publicKey, claims })

export const resolveIdentity = (did) =>
  api.get(`/api/identity/${encodeURIComponent(did)}`)

export const requestChallenge = (did) =>
  api.get(`/api/auth/challenge/${encodeURIComponent(did)}`)

export const verifySignature = (did, signature) =>
  api.post('/api/auth/verify', { did, signature })

export const getStats = () => api.get('/api/stats')

export default api
