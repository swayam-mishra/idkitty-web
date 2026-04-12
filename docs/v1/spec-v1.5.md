# IDKitty v1.5 — Build Spec

> Solo-developer scope. Target: 3–4 focused weeks to a working, deployable product.

---

## 1. Project Overview

IDKitty v1.5 is a multi-tenant Authentication as a Service (AaaS) platform that lets developers add passwordless, cryptographic identity to their apps via a simple npm SDK. Users prove identity by signing a server-issued challenge with a private key that never leaves their browser — there is no password, no credential database, and nothing worth stealing. v1.5 ships the core loop: identity registration, challenge-response auth, RS256 JWT issuance with a public JWKS endpoint, a developer dashboard for tenant onboarding and API key management, and the `@idkitty/sdk` npm package. v1.5 does not include a mobile authenticator app, QR-based auth, push notifications, multi-chain support (Polygon Amoy testnet only), BullMQ queue infrastructure, webhook delivery, multi-device management, an admin panel, ZK proofs, or Verifiable Credentials.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js (ES modules) | 22 LTS |
| **Framework** | Express.js | 5.x |
| **Database** | MongoDB + Mongoose (Atlas) | 7.x / 8.x |
| **Cache / Sessions** | Redis (Upstash) + ioredis | 5.x |
| **JWT** | RS256 — jsonwebtoken | 9.x |
| **Validation** | Zod | 3.x |
| **Logging** | Winston | structured JSON |
| **Rate Limiting** | @upstash/ratelimit | 2.x |
| **Security Headers** | Helmet.js | 7.x |
| **Blockchain** | ethers.js | 6.x |
| **Smart Contract** | Solidity + OpenZeppelin Upgradeable (UUPS) | 0.8.20 |
| **Chain** | Polygon Amoy testnet only | — |
| **Backend Deploy** | Fly.io | fly.toml |
| **Dashboard** | Next.js (App Router) + TypeScript | 15.x / 5.x |
| **Dashboard UI** | Tailwind CSS + shadcn/ui | 3.x |
| **Dashboard State** | Zustand + TanStack React Query | 4.x / 5.x |
| **Dashboard Auth** | NextAuth.js | 5.x |
| **Dashboard Forms** | React Hook Form + Zod | 7.x / 3.x |
| **Dashboard Deploy** | Vercel | — |
| **SDK** | @idkitty/sdk (ESM + CJS, TypeScript) | 1.5.0 |
| **Dev Tooling** | tsx, Vitest, Supertest | — |

**Dropped from v2 stack:** BullMQ, Recharts, Axiom transport, Expo / React Native, expo-crypto, expo-secure-store, expo-local-authentication, expo-camera, NativeWind, Reanimated.

---

## 3. Backend Features & Implementation Checklist

### 3.1 Identity

Stores each user's DID, public key, optional claims, and optional username in MongoDB. On registration, a fire-and-forget async call anchors the DID on Polygon Amoy using ethers.js — no queue worker is needed.

- [ ] Define `Identity.model.js` with fields: `did`, `publicKey`, `keyType`, `keyVersion`, `keyHistory[]`, `controller`, `chain` (hardcoded `polygon-amoy`), `txHash`, `blockchainStatus`, `claims`, `username`, `usernameChangedAt`, `authCount`, `revokedAt`, `createdAt`, `updatedAt`
- [ ] Define `ReleasedUsername.model.js` with TTL index (7-day auto-delete)
- [ ] `POST /api/identity/register` — validate DID format, save to MongoDB with `blockchainStatus: 'pending'`, fire-and-forget blockchain write via `setImmediate`, write `REGISTERED` audit log async, increment tenant `usageCount`, return 201
- [ ] `GET /api/identity/:did` — public endpoint, return identity + inline W3C DID Document JSON
- [ ] `GET /api/identity/username/:username` — resolve username to full identity response (same shape as above)
- [ ] `GET /api/identity/username/:username/available` — check availability against: format regex, reserved words list, `ReleasedUsername` collection, existing `Identity` collection
- [ ] `POST /api/identity/:did/username` — claim or change username; enforce 30-day cooldown; write old username to `ReleasedUsername`; write `USERNAME_CLAIMED` or `USERNAME_CHANGED` audit log
- [ ] `POST /api/identity/:did/rotate-key` — move current key to `keyHistory[]`, set new key, invalidate all sessions (Redis + MongoDB), fire-and-forget on-chain `rotateKey`, write `KEY_ROTATED` audit log
- [ ] `POST /api/identity/:did/revoke` — set `revokedAt`, revoke all sessions, fire-and-forget on-chain `revokeDID`, write `IDENTITY_REVOKED` audit log
- [ ] Reserved words list constant (admin, idkitty, support, help, system, root, api, null, undefined, wallet, did, identity, auth, login, signup, register, me, self)
- [ ] Zod validators for all identity endpoints

### 3.2 Auth

Implements the challenge-response flow: the server issues a random 32-byte hex challenge stored in Redis with a 60s TTL; the client signs it client-side and returns the signature; the server verifies with `crypto.webcrypto.subtle` and issues RS256 access + refresh tokens.

- [ ] `GET /api/auth/challenge/:did` — generate 32-byte hex challenge, store in Redis key `challenge:{did}:{tenantId}` with 60s TTL, reject if DID is revoked
- [ ] `POST /api/auth/verify` — fetch + delete challenge from Redis, verify ECDSA-P256 signature using `crypto.webcrypto.subtle`, create `Session` document, store hashed refresh token in Redis, issue RS256 access token (15 min) + refresh token (30 days), increment `authCount` and tenant `usageCount`, write `AUTH_SUCCESS` or `AUTH_FAILED` audit log async
- [ ] `POST /api/auth/refresh` — load session from Redis, verify refresh token hash, rotate refresh token, issue new access token with new `jti`
- [ ] `POST /api/auth/revoke-session` — accept `sessionId` or `revokeAll` flag, mark sessions `revokedAt` in MongoDB, delete from Redis, write `SESSION_REVOKED` audit log
- [ ] `jwt.service.js` — RS256 sign, verify, JWKS JSON builder (public key in JWK format)
- [ ] `crypto.service.js` — challenge generation, ECDSA-P256 signature verification via `crypto.webcrypto`
- [ ] `redis.service.js` — ioredis client, challenge helpers, session helpers

### 3.3 Session Model

Tracks active sessions in MongoDB with TTL auto-delete; Redis holds the fast-path revocation check.

- [ ] Define `Session.model.js` with fields: `sessionId`, `did`, `tenantId`, `refreshToken` (bcrypt hash), `accessTokenJti`, `deviceInfo`, `expiresAt`, `revokedAt`, `lastUsedAt`, `createdAt`
- [ ] MongoDB TTL index on `expiresAt` (30-day auto-delete)
- [ ] Redis session key `session:{sessionId}` set on auth, deleted on revoke

### 3.4 Tenant

Tenants are developer apps. Registration issues a `clientId` + `clientSecret` (shown once, stored bcrypt-hashed). The tenant API key authenticates all SDK and dashboard API calls.

- [ ] Define `Tenant.model.js` with fields: `clientId`, `clientSecret` (bcrypt hash), `name`, `description`, `contactEmail`, `allowedOrigins[]`, `webhookConfig` (schema present, delivery not implemented), `plan`, `planLimits`, `usageCount`, `usageResetAt`, `active`, `quickStartDismissed`, `createdAt`, `updatedAt`
- [ ] `POST /api/tenants/register` — generate `clientId` (client_ + 16 hex bytes) and `clientSecret` (cs_ + 32 hex bytes), bcrypt hash secret, return plaintext once
- [ ] `GET /api/tenants/me` — return tenant profile including usage, plan, allowed origins, webhook config (stub)
- [ ] `GET /api/tenants/stats` — query AuditLog for period totals (`totalAuths`, `successRate`, `uniqueDIDs`); no chart breakdown needed in v1.5, just aggregate numbers
- [ ] `PATCH /api/tenants/me/profile` — partial update of name, description, `quickStartDismissed`
- [ ] `PATCH /api/tenants/me/origins` — add/remove entries in `allowedOrigins[]`, validate URL format
- [ ] `PATCH /api/tenants/me/webhook` — save webhook URL and event list to tenant document (no delivery)
- [ ] `POST /api/tenants/me/rotate-secret` — confirm current secret, generate + store new secret, return new plaintext once
- [ ] `tenantAuth.js` middleware — validate `Authorization: Basic <base64(clientId:clientSecret)>`, bcrypt compare
- [ ] `verifyJWT.js` middleware — validate RS256 access token, check `jti` against Redis session store

### 3.5 SDK Routes

Mirrors the core auth and identity endpoints with per-tenant CORS enforcement. No new logic — thin wrappers that set `Access-Control-Allow-Origin` from the tenant's `allowedOrigins`.

- [ ] `POST /api/sdk/init` — takes `clientId` (public), returns tenant public config (`tenantName`, `allowedOrigins`, `jwksUri`)
- [ ] `GET /api/sdk/challenge/:did` — same as auth challenge, CORS from tenant `allowedOrigins`
- [ ] `POST /api/sdk/verify` — same as auth verify, compact token response, CORS from tenant `allowedOrigins`
- [ ] `GET /api/sdk/identity/:did` — minimal public DID response, CDN-cache headers (5 min)
- [ ] Per-tenant CORS middleware that reads `allowedOrigins` from tenant document

### 3.6 JWKS Endpoint

Exposes the backend's RSA public key in JWK format so tenant backends can verify access tokens without calling IDKitty on every request.

- [ ] `GET /.well-known/jwks.json` — return RSA public key as JWK array (`{ keys: [...] }`)
- [ ] `jwt.config.js` — load RSA private key from env `JWT_PRIVATE_KEY`, derive public key, expose as JWK
- [ ] `scripts/generate-keypair.js` — utility script to generate RSA-2048 key pair and output as base64 env vars

### 3.7 Audit Log

Appends an event record for every significant action. All writes are async and non-blocking. Reads are paginated; no CSV export in v1.5.

- [ ] Define `AuditLog.model.js` with fields: `did`, `tenantId`, `event` (enum), `ip`, `userAgent`, `requestId`, `metadata`, `timestamp`
- [ ] Compound index on `{ tenantId, timestamp: -1 }` and `{ did, 1 }`
- [ ] `audit.service.js` — `writeLog(event, payload)` that fires and does not block the request
- [ ] `GET /api/tenants/me/audit` — paginated read, filter by `event` type and date range, 25 per page, no CSV export

### 3.8 Blockchain Service

Handles direct on-chain DID registration and key rotation using ethers.js against Polygon Amoy. No queue — all writes are fire-and-forget using `setImmediate` or a bare unhandled Promise with error logging.

- [ ] `blockchain.service.js` — ethers.js provider + signer for Polygon Amoy, `registerDID(did, publicKey)`, `rotateKey(did, newPublicKey)`, `revokeDID(did)` functions
- [ ] `chains.config.js` — single entry for Polygon Amoy (RPC URL, chain ID, contract address)
- [ ] `DIDRegistryV2.json` — compiled ABI in `contracts/`
- [ ] `polygon-amoy.json` — deployed contract address in `contracts/chains/`
- [ ] `scripts/deploy.js` — deploy DIDRegistryV2 UUPS proxy to Polygon Amoy
- [ ] After MongoDB save, call blockchain write with `setImmediate(() => blockchainService.registerDID(...).catch(logger.error))`; update `blockchainStatus` to `'confirmed'` or `'failed'` asynchronously

### 3.9 Infrastructure & Middleware

- [ ] `app.js` — Express 5 setup, Helmet, CORS, JSON body parser, `requestId` middleware, route mounting
- [ ] `rateLimiter.js` — Upstash rate limit middleware factory; configure per-endpoint limits
- [ ] `validateBody.js` — Zod schema middleware factory
- [ ] `requestId.js` — attach `x-request-id` to every request
- [ ] `errors.js` — `AppError` class with code + status; global error handler in `app.js`
- [ ] `asyncHandler.js` — Express async wrapper
- [ ] `.env.example` — all required env vars documented
- [ ] `fly.toml` — Fly.io deployment config

---

## 4. Frontend Features & Implementation Checklist

The dashboard is a Next.js 15 app using the App Router. It uses the IDKitty neobrutalism design system (zero border-radius, flat shadows, cream/black palette, JetBrains Mono + Pixelify Sans). All pages are TypeScript.

### 4.1 Root Layout & Shared Infrastructure

- [ ] Root `layout.tsx` — font loading (JetBrains Mono, Pixelify Sans), providers (QueryClientProvider, NextAuth SessionProvider, Zustand)
- [ ] `globals.css` — CSS custom properties for palette, sidebar, shadow scales, `.dash-card`, `.data-table`, `.nav-item` classes
- [ ] `lib/api.ts` — Axios instance with base URL, interceptors for `Authorization: Basic` header from Zustand tenant store
- [ ] `lib/auth.ts` — NextAuth config; credential provider that calls `/api/sdk/verify`, sets session from JWT claims
- [ ] `store/tenant.store.ts` — Zustand: `clientId`, `clientSecret` (in-memory only), tenant profile, setter actions
- [ ] `store/identity.store.ts` — Zustand: user DID, access token, username
- [ ] Shared components: `NavBar.tsx`, `SidebarNav.tsx`, `TopBar.tsx`, `StatusBadge.tsx`, `Loader.tsx`, `ConfirmModal.tsx`, `PixelCat.tsx`

### 4.2 `/` — Marketing Landing Page

Introduces IDKitty to developers. Displays live platform stats and a code example. No interactive auth on this page.

- [ ] `Hero` section — headline "AUTH THAT YOU OWN.", subtext, two CTAs: `[GET YOUR API KEY]` → `/dashboard`, `[READ THE DOCS]` → `/docs`
- [ ] `LiveStats` strip — fetch `GET /api/stats` (total tenants, identities, auths), poll every 60s via React Query
- [ ] `HowItWorks` section — three step cards: Pick a @username / Integrate the SDK / Users authenticate
- [ ] `IntegrationExample` section — static code block showing `@idkitty/sdk` usage with copy button and syntax highlighting (Shiki or Prism)
- [ ] `PricingTable` section — Free / Pro tiers (Enterprise is shown as "Contact us", no interactive tier selection)
- [ ] `GET /api/stats` backend endpoint — public, returns aggregate counts from MongoDB
- [ ] Footer with links to /docs and /create

### 4.3 `/create` — Identity Creation Wizard

3-step browser-side flow. Private key is generated in the browser using `window.crypto.subtle` and held only in component state — never sent to the server.

- [ ] Step 1 — GENERATE: `[GENERATE KEYPAIR]` button calls `window.crypto.subtle.generateKey` (ECDSA P-256), derives DID string, shows truncated public key
- [ ] Step 2 — CLAIMS (optional): name + email inputs, `[SKIP]` and `[CONTINUE]` buttons
- [ ] Step 2.5 — USERNAME (optional): `@[input]` field with `@` prefix adornment; debounced (400ms) availability check via `GET /api/identity/username/:username/available`; states: checking, available (green), taken (red), reserved (red), invalid format (red); `[SKIP FOR NOW]` link
- [ ] Step 3 — SAVE: two export paths only (no mobile QR in v1.5):
  - **DOWNLOAD BACKUP FILE** (primary): password input with strength indicator, generate AES-256-GCM + PBKDF2 encrypted keystore file, download as `idkitty-backup-<did-prefix>.json`
  - **SHOW KEY (Advanced)**: text link → `ConfirmModal` with acknowledgement text → reveals raw key in terminal block with persistent warning banner
- [ ] After Step 3 export: call `POST /api/identity/register` to register the identity; if username was chosen, call `POST /api/identity/:did/username`
- [ ] Step indicator (Step 1 / 2 / 3) and back navigation

### 4.4 `/login` — Dashboard Login (Manual Key Entry Only)

The login page for the developer dashboard. In v1.5, only manual key entry is supported — no QR flow.

- [ ] Identity ID or @username input — pre-filled from URL param `?did=` or identity store; on submit: if `@username` or bare username format → resolve via `GET /api/identity/username/:username`; if `did:idkitty:` prefix → use directly
- [ ] Signing Key input — masked, paste-friendly
- [ ] `[SIGN IN]` button — fetches challenge via `GET /api/sdk/challenge/:did`, signs client-side using `window.crypto.subtle`, calls `POST /api/sdk/verify`, on success creates NextAuth session
- [ ] Small warning copy below button: *"Your signing key never leaves your browser."*
- [ ] Inline error states: identity not found, invalid key, expired challenge
- [ ] On success: redirect to `/dashboard`

### 4.5 `/dashboard` — Dashboard Home

Protected layout (NextAuth session required). Shows the tenant's key stats and API credentials.

- [ ] Protected layout `dashboard/layout.tsx` — sidebar (`SidebarNav`), top bar (`TopBar`), main content area; redirect to `/login` if no session
- [ ] `QuickStartCard` — shown until `tenant.quickStartDismissed` is true; checklist items derived from tenant state; `[DISMISS]` calls `PATCH /api/tenants/me/profile` with `{ quickStartDismissed: true }`; inline `npm install @idkitty/sdk` snippet with copy button
- [ ] Stat row — four `StatCard` components: Total Auths This Month (`usageCount`), Success Rate (from stats), Active Sessions (count from MongoDB), API Calls Today (from audit log count); all numbers, no charts
- [ ] `ApiKeyCard` — shows `clientId` in full with copy button; secret masked with rotate button; rotate opens `ConfirmModal` requiring user to type "ROTATE"; on confirm calls `POST /api/tenants/me/rotate-secret`; new secret shown once in result modal with "COPY NOW" prompt
- [ ] Recent Auth Events — last 10 entries from `GET /api/tenants/me/audit`, basic table with timestamp, event badge, truncated DID; "View all →" link to `/dashboard/audit`

### 4.6 `/dashboard/settings` — Settings

Allows the tenant to update their profile, manage API credentials, configure allowed origins, and set a webhook URL.

- [ ] Tenant Profile section — name, contactEmail, description fields; inline edit with save; calls `PATCH /api/tenants/me/profile`
- [ ] API Credentials section — `ApiKeyCard` (reused from dashboard home)
- [ ] Allowed Origins section — list of current origins with remove buttons; URL input to add new origin; calls `PATCH /api/tenants/me/origins`; validates URL format client-side
- [ ] Webhook Config section — URL input, event type checkboxes (auth.success, auth.failed, etc.); calls `PATCH /api/tenants/me/webhook`; note shown: *"Webhook delivery is not active in v1.5 — URLs are saved for a future release."*; no `WebhookTester` in v1.5
- [ ] Plan section — shows current plan (free) and `usageCount` / `planLimits.monthlyAuths`; static "Upgrade coming soon" copy
- [ ] Danger Zone — Delete account button → `ConfirmModal` requiring typed confirmation

### 4.7 `/dashboard/audit` — Audit Log

Full-page paginated audit log table for the tenant's events. No CSV export in v1.5.

- [ ] `AuditLogTable` component — columns: Timestamp, Event (color-coded badge), truncated DID, IP, User Agent
- [ ] Fetch from `GET /api/tenants/me/audit` via React Query (`useAuditLog` hook)
- [ ] Filter bar: event type multi-select, date range inputs, DID text search (300ms debounce)
- [ ] Pagination — 25 rows per page, prev/next controls
- [ ] Event badge color map: AUTH_SUCCESS (green), AUTH_FAILED (red), REGISTERED (cyan), KEY_ROTATED (yellow), SESSION_REVOKED (grey), IDENTITY_REVOKED (red bold)

### 4.8 `/docs` — Integration Docs

Static documentation page with copy-ready code examples. No live API calls on this page.

- [ ] Tabbed layout: Quickstart / API Reference / Security Guide
- [ ] Quickstart tab — install command, `createIDKitty()` init, `authenticate()` call, `verifyToken()` call; all with copy buttons
- [ ] API Reference tab — expandable sections for each endpoint with request/response examples
- [ ] Security Guide tab — key storage recommendations, token handling, what never to do
- [ ] Syntax highlighting via Shiki or Prism; all code blocks have copy buttons
- [ ] Webhooks tab content is present (documents the interface) but notes delivery is coming in v2

---

## 5. SDK Features & Implementation Checklist

The `@idkitty/sdk` package is a small TypeScript library that handles the browser-side auth flow. It ships as ESM + CJS dual output. It has no runtime dependencies beyond `fetch` (native in modern browsers and Node 18+).

### Exported API

```
createIDKitty(config)       → IDKittyClient instance
client.generateKeyPair()    → { publicKey, privateKey } (hex strings)
client.signChallenge(challenge, privateKey) → signature (hex)
client.authenticate(did, privateKey) → { accessToken, refreshToken, sessionId }
client.verifyToken(accessToken) → decoded claims (fetches JWKS, caches key)
client.resolveUsername(username) → { did, publicKey, claims, ... }
```

### Implementation Checklist

- [ ] `sdk/src/types.ts` — `IDKittyConfig`, `AuthResult`, `IdentityResult`, `JWTClaims` interfaces
- [ ] `sdk/src/crypto.ts` — `generateKeyPair()` using `window.crypto.subtle` (ECDSA P-256); `signChallenge(challenge, privateKey)` returns hex signature; works in browser and Node 22+ (both have `globalThis.crypto`)
- [ ] `sdk/src/client.ts` — `IDKittyClient` class: stores `clientId` and `apiBase`; `authenticate(did, privateKey)` fetches challenge from `/api/sdk/challenge/:did`, calls `signChallenge`, posts to `/api/sdk/verify`, returns tokens; `resolveUsername(username)` calls `GET /api/sdk/identity/:did` after username resolution
- [ ] `sdk/src/jwks.ts` — `verifyToken(accessToken)` fetches `/.well-known/jwks.json`, caches RSA public key in memory, verifies RS256 JWT using `crypto.subtle.verify`; cache invalidates on key ID mismatch
- [ ] `sdk/src/index.ts` — `createIDKitty(config): IDKittyClient` factory export; re-export all types
- [ ] `sdk/package.json` — `"exports"` field with `"import"` (ESM) and `"require"` (CJS) paths; `"types"` field; `"files"` whitelist
- [ ] `sdk/tsconfig.json` — strict TypeScript, `target: ES2020`, `moduleResolution: bundler`
- [ ] Build script (tsup or unbuild) producing `dist/index.mjs` and `dist/index.cjs` with `.d.ts` declarations
- [ ] `scripts/generate-keypair.js` (backend utility, not SDK) — generates RSA-2048 key pair for JWT signing, outputs base64-encoded env vars

---

## 6. What's Stubbed (Not Implemented But Interface Exists)

These items have schema fields, UI inputs, or API endpoints in v1.5, but the actual functionality is deferred to v2.

| Stub | What exists in v1.5 | What's deferred |
|---|---|---|
| **Webhook delivery** | `webhookConfig` field in `Tenant` schema; `PATCH /api/tenants/me/webhook` saves URL and events; settings UI has URL + event checkbox inputs | Actual HTTP delivery to the URL, HMAC signing, retry logic, `WebhookTester` component |
| **Webhook test endpoint** | `POST /api/tenants/me/webhook/test` route exists and returns a stub `{ delivered: false, error: 'Not implemented in v1.5' }` | Live delivery to the tenant's URL |
| **Usage chart data** | `GET /api/tenants/stats` returns aggregate totals | `dailyBreakdown[]` array field is returned but the dashboard does not render a chart — v2 adds Recharts |
| **Pro / Enterprise plan** | `plan` field in `Tenant` schema; Plan section in `/dashboard/settings` shows current plan | Upgrade flow, Stripe billing, plan enforcement beyond free-tier limits |
| **Multi-chain** | `chain` field in `Identity` schema; `chains.config.js` has a single entry | Additional chains (Polygon mainnet, Base) — adding a chain in v2 requires only a new entry in `chains.config.js` and a new deployment address file |
| **Audit log retention / TTL** | `planLimits.retentionDays` field in tenant schema | Automated TTL cron enforcing per-tenant retention; in v1.5, logs accumulate indefinitely |
| **CSV export** | Audit log UI has no export button | `[EXPORT CSV]` button and streaming endpoint deferred to v2 |
| **Key rotation on-chain** | `rotateKey` call in `blockchain.service.js` fires and forgets | Confirmed on-chain status callback; in v1.5 `blockchainStatus` updates only on success/failure log |
| **`/identity` public resolver page** | Route structure exists | Full DID resolver widget with two-tab (by DID / by username) UI; not in v1.5 scope but route can be added cheaply |

---

## 7. Build Order

Build from core data layer outward. The goal is a working end-to-end auth flow (register → challenge → verify → JWT) by the end of week 1, with the dashboard and SDK layered on top.

### Week 1 — Core Backend

1. Project scaffold: Express 5 app, Mongoose connection, Redis client, env config, Winston logger, error handler, `asyncHandler`, `requestId` middleware
2. `Identity.model.js` and `Tenant.model.js` (without webhook delivery fields — add stub fields only)
3. `Session.model.js` and `AuditLog.model.js`
4. RSA key pair generation script; `jwt.service.js` (sign + verify + JWKS builder)
5. `crypto.service.js` — challenge generation + ECDSA-P256 signature verification
6. `redis.service.js` — challenge store helpers + session helpers
7. `blockchain.service.js` — ethers.js provider + `registerDID` function for Polygon Amoy; deploy `DIDRegistryV2` to testnet
8. `POST /api/tenants/register` + `tenantAuth.js` middleware
9. `POST /api/identity/register` — MongoDB save + fire-and-forget blockchain call
10. `GET /api/auth/challenge/:did` + `POST /api/auth/verify` — full challenge-response flow
11. `POST /api/auth/refresh` + `POST /api/auth/revoke-session`
12. `GET /.well-known/jwks.json`
13. Manual end-to-end test: register tenant → register identity → get challenge → verify → inspect JWT

### Week 2 — Backend Completion + SDK

14. Username endpoints: `GET /api/identity/username/:username`, `GET /api/identity/username/:username/available`, `POST /api/identity/:did/username`
15. `POST /api/identity/:did/rotate-key` and `POST /api/identity/:did/revoke`
16. Remaining tenant endpoints: `GET /api/tenants/me`, `GET /api/tenants/stats`, `PATCH /api/tenants/me/profile`, `PATCH /api/tenants/me/origins`, `PATCH /api/tenants/me/webhook` (stub), `POST /api/tenants/me/rotate-secret`
17. `audit.service.js` + `GET /api/tenants/me/audit` (paginated)
18. SDK routes (`/api/sdk/*`) — per-tenant CORS wrappers
19. Rate limiting middleware applied to all endpoints
20. `GET /api/stats` public endpoint for landing page
21. SDK package scaffold: `types.ts`, `crypto.ts`, `client.ts`, `jwks.ts`, `index.ts`
22. SDK build config (tsup); verify ESM + CJS dual output
23. Local integration test of SDK: `generateKeyPair → authenticate → verifyToken`

### Week 3 — Dashboard

24. Next.js project scaffold: App Router, TypeScript, Tailwind, shadcn/ui, design system CSS
25. Shared infrastructure: root layout, providers, `lib/api.ts`, NextAuth config, Zustand stores
26. Shared components: `SidebarNav`, `TopBar`, `StatCard`, `ConfirmModal`, `StatusBadge`, `Loader`
27. `/create` identity wizard (all 3 steps including username availability check and keystore download)
28. `/login` page — manual key entry flow, challenge fetch, client-side sign, NextAuth session creation
29. `/dashboard` home — `QuickStartCard`, stat row, `ApiKeyCard`, recent events table
30. `/dashboard/settings` — all sections (profile, origins, webhook stub, plan display)
31. `/dashboard/audit` — `AuditLogTable` with filters and pagination

### Week 4 — Landing, Docs, Polish, Deploy

32. `/` marketing landing — all sections (Hero, LiveStats, HowItWorks, IntegrationExample, PricingTable)
33. `/docs` — Quickstart, API Reference, Security Guide tabs with syntax-highlighted code blocks
34. End-to-end smoke test: create identity → log into dashboard → view audit log → verify JWT with SDK
35. Fly.io backend deployment (`fly.toml`, env secrets)
36. Vercel dashboard deployment
37. npm publish `@idkitty/sdk`
38. Fix any rough edges found in smoke test
