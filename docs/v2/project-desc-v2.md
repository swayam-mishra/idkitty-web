# IDKitty v2

**Authentication as a Service — Decentralized, Passwordless, Self-Sovereign**

---

## What It Is

IDKitty v2 is a multi-tenant Authentication as a Service (AaaS) platform. Developers integrate it into their apps so their users can log in without passwords. Users prove identity by signing a server-issued challenge with a private key that never leaves their device — there is no password database, and nothing worth stealing.

---

## What's New in v2

### Platform

- Multi-tenant API — any developer can register an app, get API keys, and start issuing auth to their users
- `@idkitty/sdk` npm package for 5-minute frontend integration
- Developer dashboard (web) for managing API keys, viewing usage, and configuring webhooks
- Mobile authenticator app (iOS + Android) for hardware-backed key storage and biometric-protected signing
- W3C DID Core-compliant smart contract with key rotation history and revocation
- Multi-chain support: Polygon PoS, Base, and their respective testnets
- RS256 JWT issuance with JWKS endpoint (tenant backends can verify tokens without calling IDKitty)
- Redis-backed session store with revocation support
- BullMQ async queues for blockchain writes and webhook delivery
- Per-tenant rate limiting
- Audit log for every auth event
- Webhook system with HMAC-signed payloads

### Identity

- Human-readable `@username` system — users pick a handle that resolves to their DID
- Username availability check, claim, change (30-day cooldown), and release
- Key rotation — users can replace their active key; old key is archived with history
- Multi-device support — multiple device keys per DID, independent rotation per device
- DID revocation
- `keyVersion` tracking and full key history

### Auth Flow

- Web challenge-response flow (browser-side key signing, no key transmitted)
- QR-based flow — developer's app shows a QR; user scans with IDKitty mobile app and approves with biometric
- Deep link flow — `idkitty://` scheme opens the mobile app for in-app approval
- Token refresh with rotation
- Session revocation (single session or all sessions for a DID)

### Security

- Private keys never transmitted — server only ever sees signatures
- Breach of the entire backend exposes no credentials usable for impersonation
- Challenge strings are single-use with a 60-second TTL
- Refresh tokens stored bcrypt-hashed; rotated on every use
- Access tokens: 15-minute expiry; refresh tokens: 30-day expiry
- Rate limits per DID, per tenant, per IP

---

## Roadmap

### v2.0 — This Spec

Core AaaS platform: multi-tenant backend, developer dashboard, mobile authenticator, SDK, smart contract, multi-chain, RS256 JWTs, webhooks, audit logs.

### v2.1 — Push Notifications + Multi-Device

- Push notifications (FCM/APNs) so users get auth prompts without QR scanning
- Multiple registered devices per DID with independent key pairs
- Device management UI in the mobile app
- Cross-device session management

### v2.2 — ZK Proofs + Selective Disclosure

- Zero-knowledge proofs for claim disclosure ("prove you're over 18" without revealing birthdate)
- Anonymous auth mode — prove identity without revealing the DID to the verifying party
- Verifiable Presentation support

### v3.0 — Full W3C Verifiable Credentials

- Issue and verify W3C Verifiable Credentials
- Organizations can issue credentials to DID holders (KYC, degrees, certifications)
- VC wallet in mobile app
- Cross-chain credential portability

---

## Monetization

| Plan | Price | Auths / Month | Audit Log Retention |
|---|---|---|---|
| Free | $0 | 1,000 | 30 days |
| Pro | $29/month | 50,000 | 90 days |
| Enterprise | Custom | Unlimited | 365 days |
