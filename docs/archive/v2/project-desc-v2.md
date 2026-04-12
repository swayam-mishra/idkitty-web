# IDKitty v2

**Authentication as a Service — Decentralized, Passwordless, Self-Sovereign**

---

## The Problem

### Centralized Auth Is a Liability at Scale

In 2023 alone, 4.5 billion records were exposed in data breaches. The root cause isn't weak passwords or lazy users — it's the architecture. Every app that lets users create an account creates a new honeypot: a database of hashed passwords, emails, and session tokens that is one SQLi or misconfigured S3 bucket away from disaster.

The companies bearing this risk are also the ones least equipped to handle it. Auth infrastructure is expensive, deeply specialized, and endlessly nuanced. Getting OAuth 2.0, PKCE, token rotation, MFA, and JWKS right — and then keeping them right — is a full-time job.

The result: most apps either roll their own insecure auth or pay Auth0 / Okta tens of thousands of dollars a year. Neither outcome is good for users, and the centralized model means a breach at any one provider exposes identity data across hundreds of their clients simultaneously.

### What An Attacker Gets Today

| What's breached | What attacker can do |
|---|---|
| Password hash database | Crack with GPU farms; credential-stuff every other service |
| Session token store | Hijack active user sessions immediately |
| OAuth client secrets | Impersonate the app to the auth provider |
| Auth provider itself | Compromise every app that delegated auth to them |

---

## The v2 Solution

IDKitty v2 is a **multi-tenant Authentication as a Service (AaaS) platform** built on cryptographic identity instead of shared secrets.

**Core principle:** Users prove identity by signing challenges with a private key that never leaves their device. There is no password. There is no credential database. There is nothing worth stealing.

**What v2 adds over v1:**
- A **developer-facing API** that any app can integrate in minutes using `@idkitty/sdk`
- A **web dashboard** for tenant apps to manage API keys, view auth analytics, and configure webhooks
- A **mobile authenticator app** (iOS + Android) so users can approve auth requests from any integrated app via QR scan or deep link, with biometric protection
- **W3C DID Core compliance** on-chain, with key rotation and history
- **Multi-chain support**: Polygon PoS, Base, and their respective testnets
- **Production-grade security**: RS256 JWTs, Redis-backed sessions, BullMQ async queues, per-tenant rate limiting, audit logs

### What An Attacker Gets If They Breach IDKitty v2

| What's breached | What attacker gets |
|---|---|
| MongoDB database | Public keys, DID strings, names, emails. No passwords. No useful secrets. |
| Redis cache | Challenge strings (60s TTL, already used). Hashed refresh tokens. Nothing exploitable. |
| Backend server | Logs. No private keys (never transmitted). |
| Smart contract | Public key registry — same as reading a phone book. |
| Mobile app storage | Encrypted SecureStore. Biometric required to decrypt. |

**An adversary who fully compromises the IDKitty backend gets nothing they can use to authenticate as any user.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         IDKITTY v2 PLATFORM                         │
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────────────────────────────┐ │
│  │  DEVELOPER      │    │           BACKEND API                   │ │
│  │  DASHBOARD      │───▶│  Express 5 · Node 22 · Fly.io           │ │
│  │  (Next.js 15)   │    │  ┌──────────┐ ┌────────────────────┐   │ │
│  │  Vercel         │    │  │ MongoDB  │ │ Redis (Upstash)    │   │ │
│  └─────────────────┘    │  │ Atlas    │ │ sessions·challenges│   │ │
│                          │  └──────────┘ └────────────────────┘   │ │
│  ┌─────────────────┐    │  ┌──────────────────────────────────┐   │ │
│  │  @idkitty/sdk   │───▶│  │ BullMQ Workers                   │   │ │
│  │  (npm package)  │    │  │ ┌─────────────┐ ┌─────────────┐ │   │ │
│  └─────────────────┘    │  │ │ blockchain  │ │  webhook    │ │   │ │
│                          │  │ │ queue       │ │  delivery   │ │   │ │
│  ┌─────────────────┐    │  │ └─────────────┘ └─────────────┘ │   │ │
│  │  MOBILE APP     │    │  └──────────────────────────────────┘   │ │
│  │  (Expo RN)      │───▶│                                         │ │
│  │  iOS · Android  │    └─────────────────────────────────────────┘ │
│  └─────────────────┘                        │                       │
│                                             │ ethers.js             │
│  ┌──────────────────────────────────────────▼───────────────────┐  │
│  │                    BLOCKCHAIN LAYER                           │  │
│  │  ┌─────────────────┐  ┌────────────────┐  ┌───────────────┐ │  │
│  │  │ Polygon Mainnet │  │  Polygon Amoy  │  │  Base Mainnet │ │  │
│  │  │ DIDRegistryV2   │  │  DIDRegistryV2 │  │ DIDRegistryV2 │ │  │
│  │  │ (proxy)         │  │  (proxy)       │  │ (proxy)       │ │  │
│  │  └─────────────────┘  └────────────────┘  └───────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

        ▲                  ▲                    ▲
        │                  │                    │
  [Developer/Tenant]   [End User            [End User
   registers app,       logs in via          mobile app
   integrates SDK]      web widget]          QR scan]
```

---

## How the AaaS Model Works

### 1. Tenant Onboarding (Developer Side)

```
Developer registers at idkitty.io/dashboard
  ↓
POST /api/tenants/register → clientId + clientSecret (shown once)
  ↓
Developer installs SDK:  npm install @idkitty/sdk
  ↓
Developer configures allowed origins + webhook URL
  ↓
Integration goes live — users can now auth with IDKitty
```

### 2. SDK Integration (5-Minute Setup)

```ts
// In the developer's frontend app
import { createIDKitty } from '@idkitty/sdk';

const idkitty = createIDKitty({ clientId: 'client_xxx' });

// When user logs in:
async function loginWithIDKitty(userDid: string, userPrivateKey: string) {
  const { accessToken, sessionId } = await idkitty.authenticate(userDid, userPrivateKey);
  // Store accessToken — use it as a Bearer token for your API
  // Store sessionId — needed for logout / revocation
}

// Verify a token on your backend (or use JWKS directly):
const claims = await idkitty.verifyToken(accessToken);
// claims.sub === "did:idkitty:polygon-amoy:0x..."
```

### 3. End-to-End User Auth Flow

```
[User visits developer's app]
  ↓ They identify themselves as @swayam —
    IDKitty resolves this to their DID and public key transparently
  ↓
App shows "Login with IDKitty" button
  ↓
  Option A — Web widget:
    GET /api/sdk/challenge/:did → challenge string
    User enters private key in browser (never sent to server)
    signChallenge(challenge, privateKey) → signature (Web Crypto API)
    POST /api/sdk/verify → { accessToken, refreshToken }
    ↓
  Option B — Mobile app (QR):
    App shows QR: { tenantId, did, challenge, appName }
    User opens IDKitty mobile app → scans QR
    Biometric prompt → signs on device
    POST /api/auth/verify → issues JWT → tenant webhook receives JWT
    ↓
  Option C — Mobile app (deep link):
    App opens: idkitty://auth?challenge=X&tenantId=Y&callbackUrl=Z
    Mobile app opens → Approve screen → biometric → sign
    Redirect to callbackUrl?token=eyJ...
  ↓
Developer's API receives JWT
  ↓
Backend verifies JWT via GET /.well-known/jwks.json (no IDKitty call needed)
  ↓
User is authenticated. Zero passwords exchanged.
```

---

## How the Mobile Authenticator Fits In

The mobile app is the flagship security upgrade over v1. It moves private key management from a browser (localStorage is not a safe key store) to a hardware-backed encrypted keystore on iOS/Android.

| Feature | v1 (browser) | v2 (mobile) |
|---|---|---|
| Key storage | localStorage (cleartext) | iOS Keychain / Android Keystore |
| Biometric gate | None | Face ID / fingerprint required to sign |
| Multi-device | Not supported | Multiple devices per DID |
| QR auth flow | Not supported | Full QR scan → approve in-app |
| Deep link flow | Not supported | `idkitty://` scheme |
| Screen protection | None | Screen capture disabled on key screens |

The mobile app also provides a native audit trail — users see every auth request in their Activity feed, with app name, timestamp, and approve/deny status.

---

## Full Tech Stack

| Layer                 | Technology                               | Version         |
|-----------------------|------------------------------------------|-----------------|
| **Backend**           | Node.js + Express                        | 22 LTS / 5.x    |
| **Backend DB**        | MongoDB + Mongoose (Atlas)               | 7.x / 8.x       |
| **Cache / Sessions**  | Redis (Upstash)                          | ioredis 5.x     |
| **Queue**             | BullMQ                                   | 5.x             |
| **Auth tokens**       | JWT RS256 (jsonwebtoken)                 | 9.x             |
| **Validation**        | Zod                                      | 3.x             |
| **Logging**           | Winston + Axiom                          | structured JSON |
| **Rate Limiting**     | @upstash/ratelimit                       | 2.x             |
| **Blockchain**        | ethers.js                                | 6.x             |
| **Smart Contract**    | Solidity + OpenZeppelin Upgradeable      | 0.8.20          |
| **Chains**            | Polygon PoS + Base (+ testnets)          | UUPS proxy      |
| **Backend Deploy**    | Fly.io                                   | fly.toml        |
| **Dashboard**         | Next.js (App Router) + TypeScript        | 15.x / 5.x      |
| **Dashboard UI**      | Tailwind CSS + shadcn/ui                 | 3.x             |
| **Dashboard State**   | Zustand + TanStack React Query           | 4.x / 5.x       |
| **Dashboard Charts**  | Recharts                                 | 2.x             |
| **Dashboard Auth**    | NextAuth.js                              | 5.x             |
| **Dashboard Deploy**  | Vercel                                   | —               |
| **Mobile**            | Expo (React Native)                      | SDK 52          |
| **Mobile Crypto**     | expo-crypto + expo-secure-store          | 13.x / 14.x     |
| **Mobile Biometrics** | expo-local-authentication                | 14.x            |
| **Mobile Camera**     | expo-camera + expo-barcode-scanner       | 15.x            |
| **Mobile Styling**    | NativeWind                               | 4.x             |
| **Mobile Animations** | Reanimated                               | 3.x             |
| **SDK**               | @idkitty/sdk (ESM + CJS, TS)             | 2.0.0           |

---

## Security Model

### Defense In Depth

IDKitty v2 is designed so that compromise of any single component exposes no exploitable user data.

```
Layer 1 — Client
  Private key generated in browser (Web Crypto) or mobile device (expo-crypto).
  Key never transmitted over any network.
  Mobile: key stored in hardware-backed SecureStore, gated by biometric.

Layer 2 — Transport
  TLS everywhere. No HTTP.
  HSTS + Helmet.js security headers on all responses.
  Certificate pinning in mobile app (stretch).

Layer 3 — Backend
  RS256 JWT — access tokens 15min, refresh 30 days with rotation.
  Challenge store: Redis, 60s TTL, single-use (deleted on verify).
  Rate limits: 5 auth attempts/min per DID, exponential backoff.
  Session revocation: checked on every API call (Redis lookup).
  Audit log: immutable append-only log of every auth event.

Layer 4 — Database
  MongoDB stores: public keys, DID strings, claims (name/email), txHashes.
  No passwords. No private keys. No exploitable secrets.
  bcrypt-hashed client secrets for tenants.
  Hashed refresh tokens (bcrypt, not plaintext).

Layer 5 — Blockchain
  DIDs and public keys anchored immutably on Polygon/Base.
  Key rotation logged on-chain with full history.
  Smart contract behind UUPS proxy — upgradeable only by owner multisig.
```

### JWT Security Details

```
Algorithm:    RS256 (private key signs, public key verifies)
Access token: 15-minute expiry, claims: { sub: DID, tenantId, jti }
Refresh token: 30-day expiry, rotated on every use, stored hashed
JWKS endpoint: GET /.well-known/jwks.json — cached by clients, no per-request calls
Revocation:   sessionId lookup in Redis on every protected API call
```

### What "Zero Knowledge of Private Keys" Means

IDKitty's backend never receives, stores, processes, or logs any user's private key.

The auth flow:
1. Backend issues a random challenge string.
2. Client-side code (browser or mobile app) loads private key from local storage and signs.
3. Client sends the **signature** (not the key) to the backend.
4. Backend verifies the signature against the **public key** (already stored from registration).
5. Match → issue JWT. No key ever seen by the server.

This means: a complete server compromise yields no private keys and no ability to impersonate any user.

---

## Competitive Positioning

| Dimension            | Auth0 / Okta      | Privy             | Dynamic.xyz       | IDKitty v2            |
|----------------------|-------------------|--------------------|-------------------|-----------------------|
| Model                | Centralized SaaS  | Centralized SaaS   | Centralized SaaS  | Decentralized AaaS    |
| Password-free        | Optional (MFA)    | Yes (social/email) | Yes (wallet)      | Yes (always)          |
| User owns identity   | No                | No                 | Partial (wallet)  | Fully (self-sovereign)|
| Blockchain anchor    | No                | No                 | Partial           | Yes (multi-chain)     |
| Open source          | No                | No                 | No                | Yes (contracts + SDK) |
| Breach impact        | All users exposed | All users exposed  | All users exposed | Zero user credentials |
| Mobile authenticator | Via TOTP apps     | No                 | No                | Native (IDKitty app)  |
| SDK size             | Large             | Medium             | Medium            | < 10kb gzipped        |
| Free tier            | 7,500 MAU         | 1,000 MAU          | 1,000 MAU         | 1,000 auths/month     |
| W3C DID standard     | No                | No                 | No                | Yes (DID Core)        |
| Human-readable identity | No             | No                 | No                | Yes (@username → DID) |

**IDKitty's unique position:** The only AaaS platform where the underlying architecture makes a credential breach physically impossible — not just unlikely.

---

## Monetization Model

### Tiers

| Plan         | Price          | Auths / Month | Rate Limit     | Audit Log | SLA    |
|--------------|----------------|---------------|----------------|-----------|--------|
| **Free**     | $0             | 1,000         | 60 req/min     | 30 days   | None   |
| **Pro**      | $29/month      | 50,000        | 300 req/min    | 90 days   | 99.5%  |
| **Enterprise**| Custom        | Unlimited     | Custom         | 365 days  | 99.9%  |

### Enterprise Add-ons

- **Dedicated infrastructure**: isolated database + queue workers
- **Custom chains**: deploy DIDRegistry to any EVM chain
- **Priority webhook delivery**: guaranteed < 500ms
- **SAML/SSO for dashboard**: enterprise login
- **Compliance package**: SOC 2 report, data processing agreement

### Unit Economics

- Marginal cost per auth: ~$0.00008 (MongoDB read + Redis + BullMQ job)
- Free tier runs at marginal loss; converts to Pro at ~5% rate
- One Pro customer = 625 free-tier customers' compute cost
- Enterprise contracts target $2k–$20k/month ARR

---

## Roadmap

### v2.0 — This Spec

- Multi-tenant AaaS backend with full API
- Developer dashboard (Next.js)
- Mobile authenticator (Expo, iOS + Android)
- `@idkitty/sdk` npm package
- W3C DID Core-compliant smart contract (UUPS upgradeable)
- Multi-chain: Polygon + Base (mainnet + testnet)
- Redis session store + BullMQ queues
- RS256 JWT with JWKS endpoint
- Per-tenant rate limiting + audit logs
- Webhook system with HMAC signing

### v2.1 — Push Notifications + Multi-Device

- FCM/APNs push notifications for auth requests (no QR needed)
- Multiple device registration per DID (work phone + personal phone)
- Device management UI in mobile app
- Per-device key pairs with independent rotation
- Cross-device session management

### v2.2 — ZK Proofs + Selective Disclosure

- Zero-knowledge proofs for selective claim disclosure
  ("prove you're over 18" without revealing birthdate)
- Integrate circom/snarkjs or Noir ZK circuit for claim proofs
- Verifiable Presentation (VP) support for third-party verification
- Anonymous auth mode: prove identity without revealing DID to the verifying party

### v3.0 — Full W3C Verifiable Credentials

- Issue and verify W3C Verifiable Credentials (VCs)
- IDKitty becomes both an identity anchor AND a credential issuer
- Organizations can issue credentials to DID holders (KYC, degrees, certifications)
- Selective disclosure via ZK proofs (from v2.2)
- VC wallet in mobile app
- DIF Presentation Exchange protocol support
- Cross-chain credential portability

---

## Impact

### Why This Matters

Password-based auth is a 50-year-old technology being held together with 2FA duct tape and "sign in with Google" crutches. The underlying model — prove identity by sharing a secret — is fundamentally broken for a world where every service gets breached.

Self-sovereign identity shifts the power relationship. Users carry their identity; services verify it. No credential database to breach. No "forgot password" flow. No credential stuffing. No phishing for passwords (you can't phish a signature).

For developers, IDKitty v2 makes the right choice the easy choice. A five-minute SDK integration replaces months of OAuth implementation work, and the security model is stronger than anything most teams could build themselves.

**Target users:**
- Individual developers who want auth without building it
- Startups that can't afford Auth0 at scale
- Privacy-focused apps where users should control their own identity
- Web3 apps that want to bridge on-chain identity to off-chain services
- Enterprises that need to demonstrate breach-proof auth to auditors

### The Bigger Picture

IDKitty v2 is not a finished product — it's infrastructure. When enough apps integrate it, the network effects compound: a user's IDKitty identity works everywhere, accumulated auth history builds a trust graph, and the DID becomes a portable digital passport.

The end state is a world where "create an account" means generating a keypair, not handing over an email and password to another database that will eventually be breached.
