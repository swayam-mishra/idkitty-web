# IDKitty v2 — Frontend Spec

Two frontends ship with v2:

- **Developer Dashboard** — Next.js 15 web app for tenant developers
- **Mobile Authenticator** — Expo React Native app for end users

---

# Part A: Developer Dashboard (Next.js 15)

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack React Query |
| Charts | Recharts |
| Auth | NextAuth.js 5 |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Deploy | Vercel |

## Design System

Extends the IDKitty v1 neobrutalism system. All components: zero border-radius, hard black shadows, cream/black/cyan palette, JetBrains Mono + Pixelify Sans. Dashboard-specific additions: dark sidebar (`#030404` background, cyan active state), surface cards, data tables with black header rows.

---

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Marketing landing |
| `/docs` | Public | Integration docs |
| `/identity` | Public | Public DID + username resolver |
| `/create` | Public | Identity creation wizard |
| `/login` | Public | Dashboard login |
| `/dashboard` | Tenant auth | Home — stats, API keys, recent events |
| `/dashboard/settings` | Tenant auth | Origins, webhook, profile, credentials |
| `/dashboard/audit` | Tenant auth | Full audit log table |

---

## Pages

### `/` — Marketing Landing

- Hero with headline and two CTAs: get API key and read docs
- Live stats strip — total tenants, identities, and auths fetched from the public stats API, polled every 60 seconds
- "How AaaS Works" — three-step explainer cards
- Integration example — copy-ready SDK code block with syntax highlighting
- Pricing table — Free / Pro / Enterprise tiers
- Footer

### `/docs` — Integration Docs

Tabbed layout:

- **Quickstart** — install SDK, init, authenticate, verify token; all with copy buttons
- **API Reference** — all endpoints with request/response examples in expandable sections
- **Webhooks** — how to verify HMAC signatures, event types, payload schemas
- **React Example** — full working component using `@idkitty/sdk`
- **Security Guide** — key storage recommendations, token handling

### `/identity` — DID Resolver

Two-tab widget:

- Lookup by DID — enter a full DID string, get the identity card + DID Document JSON
- Lookup by username — enter `@handle`, resolves to the same identity card

### `/create` — Identity Creation Wizard

Three-step browser-side flow. The private key is generated in the browser and held only in memory — never sent to the server.

**Step 1 — Generate**
- Generate keypair button uses the browser Web Crypto API (ECDSA P-256)
- Shows truncated public key and derived DID

**Step 2 — Claims (optional)**
- Name and email inputs
- Skip or continue

**Step 2.5 — Username (optional)**
- `@[input]` with live availability check (debounced 400ms)
- States: checking, available, taken, reserved, invalid format
- Skip option; username can be claimed later

**Step 3 — Save**

Three export paths in priority order:

1. **Save to mobile app (recommended)** — generates a one-time encrypted QR payload; user scans with the IDKitty app; web page clears key from memory on confirmation
2. **Download backup file** — password-protected AES-256-GCM + PBKDF2 encrypted keystore file
3. **Show key (advanced)** — raw key shown only after user acknowledges the permanent-loss warning in a confirm modal

After export: registers the identity via API; if a username was chosen, claims it.

### `/login` — Dashboard Login

Two modes:

**Mode A — QR Flow (default)**
- Fetches a challenge and encodes it as a QR code
- Countdown timer; auto-refreshes every 55 seconds
- Polls auth-status endpoint every 2 seconds after QR is displayed
- On approval: shows confirmation banner and redirects

**Mode B — Manual Key Entry (collapsed)**
- Activated by clicking "Use signing key instead"
- Identity ID or @username input (resolves username before fetching challenge)
- Signing Key input (masked, paste-friendly)
- Signs challenge client-side; creates NextAuth session on success
- Warning copy: "Your signing key never leaves your browser."

### `/dashboard` — Dashboard Home

Protected layout: fixed sidebar + topbar + main content.

- **Quick Start card** — checklist of setup steps (add origin, install SDK, first auth, set up webhook); each step auto-checks when the corresponding tenant state is met; dismiss button persists the dismissal
- **Stat row** — Total Auths This Month, Success Rate, Active Sessions, API Calls Today
- **Usage chart** — 30-day auth history (success + failed), period selector (7D / 30D / 90D)
- **API Key card** — clientId shown in full with copy; secret masked with rotate button; rotation requires typing "ROTATE" to confirm; new secret shown once after rotation
- **Recent Auth Events** — last 10 audit log entries; link to full audit log

### `/dashboard/settings` — Settings

- **Profile** — name, contact email, description; inline edit
- **API Credentials** — API Key card with secret rotation
- **Allowed Origins** — add/remove origin URLs; URL format validation
- **Webhook Config** — URL input, event type checkboxes, send test webhook button
- **Plan** — current plan, usage count vs limit, upgrade CTA
- **Danger Zone** — delete account with typed confirmation

### `/dashboard/audit` — Audit Log

- Full-page table: Timestamp, Event (color-coded badge), DID, IP, User Agent
- Filters: event type (multi-select), date range, DID text search
- Pagination (25 rows per page)
- Export to CSV

---

## Key Components

- `ApiKeyCard` — clientId + masked secret, copy, rotate with confirm modal
- `UsageChart` — Recharts area chart, success/failed series, period selector
- `AuditLogTable` — filterable, paginated, color-coded event badges
- `WebhookTester` — send test webhook, show delivery result (status code + response time)
- `TenantOnboarding` — 2-step wizard (name your app → copy API keys)
- `QuickStartCard` — setup checklist, persisted dismissal
- `StatCard` — single metric display
- `DIDResolver` — lookup by DID or username, shows identity card + DID Document
- `IdentityCard` — updated from v1: adds keyVersion badge, blockchain status indicator, chain badge, username as primary display
- `ChallengeModal` — manual key entry flow; reusable as modal or inline section

---

## UX Copy Rules

| Technical Term | User-Facing Label |
|---|---|
| DID | Your Identity ID (DID shown as subtext) |
| Public key | Your Identity Address |
| Private key | Your Signing Key |
| Challenge | Sign-in request |
| Signature | *(never shown to users)* |
| Polygon Amoy | Secured on blockchain (network name in tooltip only) |
| txHash | Blockchain receipt |
| clientId / clientSecret | Keep as-is (developer-facing only) |
| DID when user has username | Show `@username` as primary; relegate DID to subtext |

---

# Part B: Mobile Authenticator (Expo React Native)

## Stack

| Layer | Technology |
|---|---|
| Framework | Expo (React Native) SDK 52 |
| Styling | NativeWind 4 |
| Animations | Reanimated 3 |
| Crypto | expo-crypto + expo-secure-store |
| Biometrics | expo-local-authentication |
| Camera / QR | expo-camera + expo-barcode-scanner |

---

## Screens

### Onboarding

- Welcome screen with IDKitty branding
- Three-screen feature walkthrough (swipeable)
- Two entry points: Create new identity / Import existing identity

### Create Identity

- Generates ECDSA P-256 key pair on-device using expo-crypto
- Key stored immediately in expo-secure-store (hardware-backed on supported devices)
- Optional claims: name, email
- Optional username with live availability check
- Registers identity via API
- Shows success screen with DID + optional Polygonscan link

### Import Identity

- Two import paths:
  - Scan QR from the web `/create` flow (encrypted key payload)
  - Enter private key hex manually

### Home / Identity Card

- Shows `@username` or truncated DID as primary identifier
- Blockchain status badge, chain badge, key version
- Quick action buttons: Scan QR / Activity / Settings

### QR Scanner — Auth Approval

- Camera view to scan QR codes from developer apps
- Decodes challenge payload (tenant name, DID, challenge string, expiry)
- Shows an approval screen: which app is requesting auth, for which identity
- Biometric prompt before signing (Face ID / fingerprint)
- Signs challenge with stored private key; submits signature to API
- Success or failure feedback screen

### Activity Feed

- Chronological list of all auth events for this identity
- Each entry: app name, timestamp, approved/denied/expired status, chain

### Settings

- View and copy DID
- Manage devices (list registered device keys, revoke a device)
- Rotate key — generate new key pair, authorize via biometric, submit to API
- Revoke identity — with strong warning and biometric confirmation
- Manage username — claim, change, or release
- Biometric lock toggle
- Export backup (encrypted file)
- About / version

### Security Features

- App locks after 5 minutes of background; biometric required to unlock
- Screen capture disabled on key-display and signing screens
- Keys stored in hardware-backed SecureStore; never exposed in plaintext after initial import
- All network calls over TLS; no private keys transmitted
