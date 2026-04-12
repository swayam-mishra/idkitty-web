# IDKitty v2 — Backend Spec

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 LTS (ES modules) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose (Atlas) |
| Cache / Sessions | Redis (Upstash) + ioredis |
| Queue | BullMQ — blockchain writes + webhook delivery |
| JWT | RS256 — jsonwebtoken |
| Validation | Zod |
| Logging | Winston + Axiom |
| Rate Limiting | @upstash/ratelimit |
| Security Headers | Helmet.js |
| Blockchain | ethers.js |
| Smart Contract | Solidity + OpenZeppelin Upgradeable (UUPS proxy) |
| Chains | Polygon PoS, Base, + testnets |
| Deploy | Fly.io |
| Dev Tooling | tsx, Vitest, Supertest |

---

## Identity

- Register a new identity: DID + public key + optional claims (name, email, phone) + optional username
- Store identity in MongoDB; fire a blockchain write job to anchor the DID on-chain asynchronously
- Resolve identity by DID — returns full identity + inline W3C DID Document JSON
- Resolve identity by `@username`
- Check username availability (validates format, reserved words, 7-day release hold, uniqueness)
- Claim or change a username — 30-day change cooldown enforced; old username enters a 7-day hold before it becomes claimable by others
- Rotate the active public key — old key archived in `keyHistory`, all sessions invalidated, on-chain key rotation queued
- Revoke an identity — sets `revokedAt`, revokes all sessions, queues on-chain revocation
- Add a device key — authorize a new device's public key using a signature from the existing active key
- All significant actions write an audit log entry asynchronously

**Identity fields:** DID, public key, key type, key version, key history, controller wallet address, chain, txHash, blockchain status, claims, username, username change timestamp, auth count, devices list, revoked timestamp.

---

## Auth

- Issue a challenge — 32-byte random hex string stored in Redis with a 60-second TTL, namespaced by DID + tenant
- Verify a challenge — client submits the challenge signature; backend verifies with Web Crypto API; on success issues RS256 access + refresh tokens and creates a session
- Refresh tokens — load session, verify refresh token hash, rotate token, issue new access token
- Revoke a session — revoke a single session or all sessions for a DID; works via user JWT or tenant API key
- Rate limiting on auth verify: failed attempts count double toward the per-DID limit

**Token lifetimes:** Access token 15 minutes; refresh token 30 days with rotation on every use.

**Session fields:** session ID, DID, tenant ID, hashed refresh token, access token JTI (for revocation), device info, expiry, revoked timestamp.

---

## Tenant

- Register a new tenant app — generates a `clientId` + `clientSecret` (shown once, stored bcrypt-hashed)
- Fetch own tenant profile, usage count, plan limits, allowed origins, webhook config
- Fetch usage stats for a time period — total auths, success rate, unique DIDs, daily breakdown
- Update profile (name, description)
- Add/remove allowed origins (CORS whitelist for SDK endpoints)
- Configure webhook URL and subscribed event types
- Send a test webhook payload
- Rotate client secret — requires confirming the current secret; new secret shown once
- Dismiss the Quick Start card (persisted on the tenant document)

**Tenant fields:** client ID, client secret (hashed), name, description, contact email, allowed origins, webhook config (URL, secret, events, enabled, fail count), plan, plan limits (monthly auths, rate limit, audit retention days), usage count, usage reset date, active flag, quick start dismissed flag.

---

## SDK Routes

Thin wrappers around the core auth and identity endpoints, with two differences:

- CORS is set per-tenant `allowedOrigins` instead of wildcard
- Response payloads are leaner

Endpoints:
- Initialize SDK — takes `clientId`, returns tenant public config and JWKS URI
- Get challenge — same as auth challenge, CORS from tenant origins
- Verify signature — same as auth verify, compact response
- Resolve identity — public DID lookup, CDN-cacheable
- Poll auth status — used by the QR web login flow; returns `pending / approved / denied / expired` status for a session

---

## Admin

- Platform-wide stats — total tenants, identities, auths, active sessions, queue depths
- List all tenants (paginated, filterable by plan and active status)
- View a single tenant's full record + recent audit events
- Update tenant plan, limits, active status, admin notes
- View platform-wide audit log (filterable)
- Deactivate a tenant

All admin endpoints require a JWT with `role: admin`.

---

## JWKS

- `GET /.well-known/jwks.json` — exposes the RSA public key in JWK format so tenant backends can verify access tokens locally without calling IDKitty

---

## Blockchain

- DIDRegistryV2 smart contract — W3C DID Core-compliant, UUPS upgradeable proxy
- Supports: DID registration, key rotation with full history, per-key purpose designations (authentication, assertion, key agreement), DID revocation
- Deployed on Polygon PoS mainnet, Polygon Amoy testnet, Base mainnet, Base Sepolia testnet
- All on-chain writes (register, rotate, revoke) are handled asynchronously via BullMQ `blockchain-writes` queue — the API returns immediately and confirms later
- `blockchainStatus` field on identity tracks: `pending / confirmed / failed`

---

## Webhook System

- Tenant configures a URL and a list of event types to subscribe to
- Supported events: `auth.success`, `auth.failed`, `identity.registered`, `identity.revoked`, `key.rotated`, `session.revoked`
- Payloads are HMAC-signed with a per-tenant secret so the receiving server can verify authenticity
- Delivery is handled via BullMQ `webhook-delivery` queue with retries on failure

---

## Audit Log

- Immutable append-only log of every significant event per identity per tenant
- Events: REGISTERED, AUTH_SUCCESS, AUTH_FAILED, KEY_ROTATED, KEY_REVOKED, SESSION_REVOKED, DEVICE_ADDED, DEVICE_REVOKED, IDENTITY_REVOKED, USERNAME_CLAIMED, USERNAME_CHANGED
- Stores: DID, tenant ID, event type, IP, user agent, request ID, metadata, timestamp
- Paginated read API filterable by event type, date range, and DID
- Auto-deletion based on tenant plan's retention period (30 / 90 / 365 days)

---

## Username System

- Usernames are 3–20 characters, lowercase alphanumeric + underscores only
- Globally unique across all identities; optional (identity can exist without one)
- Case-insensitive input, stored lowercase
- Reserved words cannot be registered (admin, idkitty, api, login, etc.)
- Change cooldown: once every 30 days
- Released usernames enter a 7-day hold (stored in a separate collection with auto-delete TTL) before becoming claimable again

---

## Security

- Private keys are never transmitted — the server only ever receives signatures
- Challenges are single-use (deleted from Redis on first verify) with a 60-second TTL
- Refresh tokens stored as bcrypt hashes, never in plaintext
- Client secrets stored as bcrypt hashes
- Rate limits: per DID, per tenant, per IP; failed auth attempts count double
- Session revocation checked on every protected API call via Redis lookup
- TLS everywhere; Helmet.js security headers on all responses
