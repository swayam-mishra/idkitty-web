# IDKitty v1

**Decentralized Identity — Hardened, Usable, Externally Verifiable**

---

## What v1 Is

IDKitty v1 is an incremental hardening of v0. It ships on the same stack — Node.js + Express + MongoDB + React + Vite + Polygon Amoy + Render.com + Vercel — introduces zero new infrastructure dependencies, and focuses on two categories of improvement: **auth robustness** and **identity lifecycle management**.

v1 is not a platform, not a multi-tenant product, and not an SDK. It is the single-user identity system from v0, made meaningfully more useful and substantially more trustworthy.

---

## What's New in v1 vs v0

### Auth Robustness

- **RS256 JWTs** — JWTs are now signed with RSA-2048 (RS256) instead of HMAC-SHA256 (HS256). The backend holds the private key; the public key is published at `GET /.well-known/jwks.json` in standard JWK format. External services (like PurrBank) can now verify IDKitty tokens locally without calling IDKitty on every request — they fetch the JWKS once and cache the public key.

- **Refresh tokens** — `POST /api/auth/verify` now returns both a short-lived access token (15 min) and a long-lived refresh token (30 days). The refresh token is stored bcrypt-hashed on the Identity document. `POST /api/auth/refresh` issues a new access token silently, without requiring the user to re-sign a challenge. Refresh tokens are revocable and are cleared automatically on key rotation.

- **Rate limiting** — `express-rate-limit` (in-process, no external dependency) is applied to the challenge and verify endpoints to prevent challenge farming and brute-force attempts.

### Identity Lifecycle

- **Usernames** — Users can claim a human-readable `@username` on their identity (e.g., `@alice`). Usernames are globally unique, 3–20 characters, alphanumeric and underscores only, no leading underscore. Users can change their username once every 30 days. Usernames resolve to a full identity via `GET /api/identity/username/:username`.

- **Key rotation** — Users can replace their active signing key. The old key is archived in `keyHistory[]` on the Identity document. All active refresh tokens are invalidated on rotation (users must re-authenticate with the new key). The new key is written to the on-chain registry via a fire-and-forget call.

- **Identity revocation** — Users can permanently revoke their identity (`POST /api/identity/:did/revoke`). Revoked identities cannot authenticate. All refresh tokens are cleared. Revocation is recorded in MongoDB with a `revokedAt` timestamp.

- **Audit log** — Every significant action (registration, auth success/failure, key rotation, username changes, revocation) is appended to a MongoDB `AuditLog` collection. The identity owner can retrieve their own audit log via a JWT-protected paginated endpoint.

### Smart Contract

- `DIDRegistry.sol` is upgraded to add a `rotateKey(did, newPublicKey)` function and events (`DIDRegistered`, `KeyRotated`). The contract is redeployed to Polygon Amoy. No UUPS proxy — same simple non-upgradeable deployment style as v0, still usable from Remix.

---

## What's the Same as v0

- Single-user (no multi-tenancy, no developer API keys)
- ECDSA P-256 keypair generated in the browser via Web Crypto API
- Challenge-response auth: 32-byte hex challenge, ECDSA-SHA256 signature, server verification
- DID format: `did:idkitty:0x...`
- MongoDB identity storage (no relational DB)
- React + Vite frontend with neobrutalism design (cream/black palette, JetBrains Mono, zero border-radius)
- Polygon Amoy testnet only
- Render.com backend, Vercel frontend

---

## What's Deferred to v1.5

| Feature | Why deferred |
|---|---|
| Redis | MongoDB refresh tokens work fine for single-server; Redis adds ops complexity |
| Multi-tenancy / Tenant model | Platform feature requiring new architecture |
| `@idkitty/sdk` npm package | Needs TypeScript, multi-tenant CORS, ESM/CJS dual output |
| Next.js dashboard migration | Unnecessary churn on a working React+Vite frontend |
| UUPS upgradeable proxy contract | Overkill for testnet at this stage |
| BullMQ queue workers | No high-throughput need yet |
| Webhook delivery | No tenants to deliver to |
| TypeScript migration | Large refactor, deferred to v1.5 scaffold |
| Multi-chain support | Polygon Amoy only until platform launch |
| Fly.io migration | Render.com works fine |
| QR-based auth / mobile app | v2 scope |
| CSV audit export | v1.5 feature |
| Verifiable Credentials / ZK proofs | v2–v3 scope |

---

## How v1 Scaffolds v1.5

Every v1 feature is a direct precursor to its v1.5 equivalent:

| v1 | What it becomes in v1.5 |
|---|---|
| `jwt.service.js` RS256 + JWKS | Same file, extended with tenant-aware `kid` headers |
| `refreshTokens[]` on Identity | Separate `Session` model with Redis fast-path revocation |
| `express-rate-limit` | Replaced by `@upstash/ratelimit` backed by Redis |
| Username endpoints | Same endpoints, extended with `ReleasedUsername` TTL collection |
| `keyHistory[]` on Identity | Same field, extended with `keyVersion` and multi-device keys |
| `AuditLog` collection | Same schema, extended with `tenantId` scoping |
| DIDRegistry v1 (rotateKey) | Becomes DIDRegistryV2 with UUPS proxy and revoke support |

---

## Tech Stack (unchanged from v0)

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES modules) |
| Framework | Express.js |
| Database | MongoDB + Mongoose (Atlas) |
| Auth Crypto | Web Crypto API (browser) + `crypto.webcrypto` (server) |
| JWT | RS256 — jsonwebtoken (upgraded from HS256) |
| Rate Limiting | express-rate-limit (in-process) |
| Blockchain | ethers.js — Polygon Amoy testnet |
| Smart Contract | Solidity — DIDRegistry v1 (non-upgradeable) |
| Backend Deploy | Render.com |
| Frontend | React + Vite |
| Frontend Deploy | Vercel |
