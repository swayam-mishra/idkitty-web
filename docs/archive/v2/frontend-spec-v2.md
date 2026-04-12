# IDKitty v2 — Frontend Spec

Two separate frontends ship with IDKitty v2:

- **A. Developer Dashboard** — Next.js 15 web app for tenants integrating IDKitty into their products
- **B. Mobile Authenticator** — Expo React Native app for end-users to manage identity and approve auth requests

---

# Part A: Developer Dashboard (Next.js 15)

## Stack

| Layer            | Choice                               | Version  |
|------------------|--------------------------------------|----------|
| Framework        | Next.js (App Router)                 | 15.x     |
| Language         | TypeScript                           | 5.x      |
| Styling          | Tailwind CSS + global CSS            | 3.x      |
| Component Lib    | shadcn/ui (unstyled, overridden)     | latest   |
| State            | Zustand                              | 4.x      |
| Data Fetching    | TanStack React Query                 | 5.x      |
| Charts           | Recharts                             | 2.x      |
| Auth (dashboard) | NextAuth.js                          | 5.x (beta) |
| Forms            | React Hook Form + Zod                | 7.x / 3.x |
| Icons            | lucide-react                         | latest   |
| HTTP             | Axios (in React Query fetchers)      | 1.x      |
| Deployment       | Vercel                               | —        |

## Design System Extension

The IDKitty neobrutalism design system from v1 is extended for dashboard use:

```css
/* globals.css */
:root {
  --white:       #F5F3E7;
  --black:       #030404;
  --grey:        #21242B;
  --grey-mid:    #3A3F4A;
  --accent-blue: #25CFE6;
  --success:     #5EC374;
  --error:       #E74B4A;
  --warning:     #F5A623;

  /* Dashboard-specific additions */
  --surface:     #FDFCF5;   /* slightly off-white for nested cards */
  --border:      #030404;
  --shadow-sm:   2px 2px 0px #030404;
  --shadow-md:   4px 4px 0px #030404;
  --shadow-lg:   6px 6px 0px #030404;

  /* Sidebar */
  --sidebar-bg:  #030404;
  --sidebar-text:#F5F3E7;
  --sidebar-active: #25CFE6;
}

* { border-radius: 0 !important; }

/* Dashboard card */
.dash-card {
  background:  var(--white);
  border:      2px solid var(--black);
  box-shadow:  var(--shadow-md);
  padding:     1.25rem;
}

/* Table */
.data-table th {
  background:  var(--black);
  color:       var(--white);
  font-family: 'JetBrains Mono', monospace;
  font-size:   0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding:     0.5rem 1rem;
}
.data-table td {
  border-bottom: 1px solid #030404;
  padding: 0.75rem 1rem;
  font-family: 'Pixelify Sans', sans-serif;
}
.data-table tr:hover td { background: rgba(37, 207, 230, 0.05); }

/* Sidebar nav item */
.nav-item {
  display:     flex;
  align-items: center;
  gap:         0.75rem;
  padding:     0.625rem 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size:   0.8rem;
  color:       rgba(245, 243, 231, 0.6);
  transition:  background 0.1s;
}
.nav-item:hover        { background: rgba(245, 243, 231, 0.08); color: #F5F3E7; }
.nav-item.active       { background: rgba(37, 207, 230, 0.15); color: #25CFE6;
                         border-left: 3px solid #25CFE6; }
```

---

## Folder Structure

```
IDkitty-dashboard/
├── app/
│   ├── layout.tsx                       ← root layout, fonts, providers
│   ├── page.tsx                         ← marketing landing (/)
│   ├── docs/
│   │   └── page.tsx                     ← integration docs (/docs)
│   ├── identity/
│   │   └── page.tsx                     ← public DID resolver (/identity)
│   ├── create/
│   │   └── page.tsx                     ← identity creation wizard (/create)
│   ├── login/
│   │   └── page.tsx                     ← IDKitty-powered login (/login)
│   └── dashboard/
│       ├── layout.tsx                   ← protected dashboard layout (sidebar + topbar)
│       ├── page.tsx                     ← dashboard home (/dashboard)
│       ├── settings/
│       │   └── page.tsx                 ← tenant settings (/dashboard/settings)
│       └── audit/
│           └── page.tsx                 ← audit log (/dashboard/audit)
├── components/
│   ├── ui/                              ← shadcn base components (unstyled, overridden)
│   ├── dashboard/
│   │   ├── ApiKeyCard.tsx
│   │   ├── UsageChart.tsx
│   │   ├── AuditLogTable.tsx
│   │   ├── WebhookTester.tsx
│   │   ├── TenantOnboarding.tsx
│   │   ├── StatCard.tsx
│   │   ├── SidebarNav.tsx
│   │   └── TopBar.tsx
│   ├── identity/
│   │   ├── DIDResolver.tsx
│   │   ├── IdentityCard.tsx             ← updated v1 component
│   │   └── ChallengeModal.tsx           ← updated v1 component
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── PricingTable.tsx
│   │   └── IntegrationExample.tsx
│   └── shared/
│       ├── NavBar.tsx
│       ├── PixelCat.tsx
│       ├── StatusBadge.tsx
│       ├── Loader.tsx
│       └── ConfirmModal.tsx
├── lib/
│   ├── api.ts                           ← axios instance + API helpers
│   ├── auth.ts                          ← NextAuth config
│   └── utils.ts
├── store/
│   ├── tenant.store.ts                  ← Zustand: tenant session + config
│   └── identity.store.ts                ← Zustand: user identity + JWT
├── hooks/
│   ├── useTenantStats.ts                ← React Query hook
│   ├── useAuditLog.ts
│   ├── useIdentity.ts
│   └── useWebhookTest.ts
├── types/
│   └── index.ts
├── public/
│   ├── cursor.png
│   ├── cursor-hover.png
│   └── pfp/
├── styles/
│   ├── globals.css
│   └── animations.css
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## UX Copy Guidelines

All user-facing text must use the labels below. Technical terms must never appear in UI copy shown to end users. Developer-facing surfaces (`/dashboard`, `/docs`, `/dashboard/*`) are exempt from these rules.

| Technical Term | User-Facing Label | Context |
|---|---|---|
| DID | Your Identity ID | Show the DID string as small subtext beneath the label |
| Public key | Your Identity Address | Shown during identity creation and on the identity card |
| Private key | Your Signing Key | Shown during creation/export; never log or transmit |
| Challenge | Sign-in request | Shown on the ApproveScreen and login flow |
| Signature | *(never shown to end users)* | Internal only — omit from all UI copy |
| ECDSA P-256 | *(never shown to end users)* | Internal only — omit from all UI copy |
| Polygon Amoy | Secured on blockchain | Network name shown in tooltip only, never inline |
| txHash | Blockchain receipt | Shown after on-chain registration or revocation |
| clientId | clientId | Developer-facing only — keep as-is |
| clientSecret | clientSecret | Developer-facing only — keep as-is |
| DID (in user context) | @username or Your Identity ID | If the user has a username, show it as the primary identifier. Never show the raw DID as the primary label — relegate it to subtext, Advanced sections, Polygonscan links, and copy-for-developers flows. |

---

## Routes

| Route                   | Protection    | Description                                    |
|-------------------------|---------------|------------------------------------------------|
| `/`                     | Public        | Marketing landing — stats, pricing, how AaaS works |
| `/docs`                 | Public        | Integration docs + live SDK code examples      |
| `/identity`             | Public        | Public DID resolver widget                     |
| `/create`               | Public        | Identity creation wizard (v1 updated)          |
| `/login`                | Public        | IDKitty sign-in request dashboard login        |
| `/dashboard`            | Tenant auth   | API keys, usage chart, recent events           |
| `/dashboard/settings`   | Tenant auth   | Webhook config, origins, rotate secret         |
| `/dashboard/audit`      | Tenant auth   | Audit log table                                |

---

## Pages

### `/` — Marketing Landing

Sections:
1. **Hero**: Headline `"AUTH THAT YOU OWN."`, subtext about decentralized AaaS, two CTAs: `[GET YOUR API KEY]` (→ /dashboard) and `[READ THE DOCS]` (→ /docs).
2. **Live Stats Strip**: `totalTenants`, `totalIdentities`, `totalAuthentications` — fetched from `/api/stats`, polled every 60s. Includes a marquee strip with scrolling feature callouts; replace `"100% client-side key generation"` with `"Own your @username — no platform can take it"`.
3. **How AaaS Works**: Three-step process cards — Step 1: *"Pick a @username. Your identity is yours — not ours."*, Step 2: "Integrate the SDK", Step 3: "Users authenticate".
4. **Integration Example**: Live code block showing `@idkitty/sdk` usage with copy button and syntax highlighting.
5. **Pricing Table**: Free / Pro / Enterprise tiers.
6. **CTA Footer**: Join waitlist / sign up.

---

### `/docs` — Integration Docs

Tabbed layout:
- **Quickstart**: Install SDK, `IDKitty.init()`, `IDKitty.authenticate()` with copy buttons
- **API Reference**: All endpoints with request/response examples (expandable sections)
- **Webhooks**: How to verify HMAC signatures, event types, payload schemas
- **React Example**: Full working React component using `@idkitty/sdk`
- **Security Guide**: Key storage recommendations, token handling

Code blocks use Prism/Shiki syntax highlighting. All examples are copy-paste ready.

---

### `/identity` — DID Resolver

Contains the `DIDResolver` component with two lookup tabs:

- **Tab 1 — By DID**: User types their Identity ID, hits enter, sees the identity card + DID Document JSON. (existing behaviour)
- **Tab 2 — By Username**: Input accepts `@swayam` or `swayam` (strips leading `@`). Calls `GET /api/identity/username/:username` and renders the same `IdentityCard`.

---

### `/create` — Identity Creation Wizard

3-step flow for web users creating a new identity.

**Step 1 — GENERATE**
- Button `[GENERATE KEYPAIR]` → derives keypair client-side using `window.crypto.subtle` (ECDSA P-256)
- Shows Your Identity ID in a cream terminal box (DID string shown as subtext)
- Shows Your Identity Address (truncated)
- Signing Key held in memory only — never sent to the server

**Step 2 — CLAIMS** (optional)
- Name input, email input
- `[SKIP]` and `[CONTINUE]` buttons

**Step 2.5 — CHOOSE A USERNAME** (optional)

Label: `CHOOSE A USERNAME`

Subtext: *"Pick a name so others can find you without a long ID string."*

```
  @[                    ]
  ✓ @swayam is available    ← green, shown after availability check
```

- Prefix `@` shown as non-editable input adornment
- Real-time availability check: debounced 400ms, calls `GET /api/identity/username/:username/available`
- States:
  - Typing: neutral (no indicator)
  - Checking: grey *"Checking..."* text below input
  - Available: green *"✓ @swayam is available"*
  - Taken: red *"✗ @swayam is taken"*
  - Reserved: red *"✗ This username is reserved"*
  - Invalid format: red inline validation message
- `[SKIP FOR NOW]` text link — username can be claimed later from the identity's Settings page
- If a username is entered and valid, it is claimed via `POST /api/identity/:did/username` after the SAVE step completes

**Step 3 — SAVE**

Three export paths presented in priority order:

**Primary — SAVE TO MOBILE APP (Recommended)**
- Cyan button, large
- Generates a one-time encrypted QR payload: `{ did, privateKey, claims }`
- QR is displayed full-size on screen for scanning
- User scans with the IDKitty mobile app
- Mobile app receives payload, saves Signing Key to `expo-secure-store`, and sends a confirmation signal back; web page clears the key from memory
- On confirmation: page shows `"✓ Saved to your IDKitty app"` and advances to success state
- Note shown below button: *"Requires the IDKitty mobile app to be installed. If unavailable, use Download Backup File."*

**Secondary — DOWNLOAD BACKUP FILE**
- Ghost button
- User sets a password (min 12 chars; strength indicator shown inline)
- Generates an encrypted keystore file using AES-256-GCM with a PBKDF2-derived key
- File downloaded as: `idkitty-backup-<did-prefix>.json`
- Warning shown: *"Keep this file offline. You will need your password to recover access."*

**Tertiary — SHOW KEY (Advanced)**
- Small text link, not a styled button
- Opens `ConfirmModal` with message: *"I understand that losing this key means permanent loss of access. There is no recovery."*
- Only after user confirms: raw Signing Key is revealed inline in a cream terminal block
- Warning banner remains visible the entire time the key is shown

---

### `/login` — IDKitty-powered Dashboard Login

Two-mode login page. The DID is pre-filled from a URL param (`?did=`) or the identity store. On success, NextAuth creates a session from the verified JWT's claims.

---

#### Mode A — QR Flow (default)

```
┌────────────────────────────────┐
│  LOGIN WITH IDKITTY            │
│                                │
│  1. Open the IDKitty app       │
│  2. Tap [Scan QR]              │
│  3. Point at this code         │
│                                │
│  [QR code — 240×240]           │
│  Expires in 58s  [↻ Refresh]  │
│                                │
│  ──── or ────                  │
│                                │
│  [Use signing key instead →]   │
└────────────────────────────────┘
```

**QR generation:**
- On page load, auto-fetches a challenge via `GET /api/sdk/challenge/:did`
- QR encodes: `{ tenantId, did, challenge, appName, appDomain, requestedAt, isVerified }`
- Countdown timer counts down from the server-returned `expiresIn`
- Auto-refreshes challenge and regenerates QR every 55 seconds; `[↻ Refresh]` button triggers an immediate refresh
- Uses React Query with `refetchInterval: 55_000`

**Polling after QR scan:**
- Once the QR is displayed a session poller starts: `GET /api/sdk/auth-status/:sessionId` every 2 seconds
- On `status: 'approved'`: page transitions to the success state and redirects
- On `status: 'denied'`: shows an error banner — *"Sign-in was denied on your device."*
- On `status: 'expired'`: shows an inline message — *"This request has expired."* and auto-refreshes the QR

**Success state:**

```
✓ Approved on your device. Signing you in...
```

Shown as a full-width cyan banner while the redirect completes.

---

#### Mode B — Manual Key Entry (collapsed by default)

Activated by clicking `[Use signing key instead →]`. Expands inline below the divider — does not navigate away.

- **Identity ID or @username** input (pre-filled if available, editable)
  - Label: *"Your Identity ID or @username"*
  - Placeholder: `@swayam or did:idkitty:...`
  - On submit: if input starts with `did:idkitty:` → use directly; if starts with `@` or matches `/^[a-z0-9_]{3,20}$/` → resolve via `GET /api/identity/username/:username` first; otherwise → show validation error
- Signing Key input (masked, paste-friendly)
- `[SIGN IN]` button
- Small warning shown below the button: *"Your signing key never leaves your browser."*

This uses the `ChallengeModal` flow (see below), repositioned as an inline section rather than a modal.

---

### `/dashboard` — Dashboard Home

**Layout**: Fixed left sidebar (`SidebarNav`) + top bar (`TopBar`) + main content area.

Main content:
1. **Quick Start card**: `QuickStartCard` — shown until dismissed (see spec below).
2. **Stat row**: 4 `StatCard` components — Total Auths This Month, Success Rate, Active Sessions, API Calls Today.
3. **Usage Chart**: `UsageChart` — last 30 days auth events.
4. **API Key Card**: `ApiKeyCard` — shows masked key, copy, rotate.
5. **Recent Auth Events**: Last 10 events from `AuditLog`, linked to `/dashboard/audit`.
6. **Webhook Status**: Inline webhook health indicator — last delivery time, fail count.

---

#### Quick Start Card

Replaces the SDK setup and "done" steps removed from `TenantOnboarding`. Shown at the top of the dashboard until the tenant dismisses it. Visibility is controlled by `tenant.quickStartDismissed: boolean` in tenant metadata; `[DISMISS]` PATCHes this flag via `PATCH /api/tenants/me`.

```
┌─────────────────────────────────────────────────────┐
│  QUICK START                              [DISMISS]  │
│  ─────────────────────────────────────────────────  │
│  ☑  Add an allowed origin         [→ Settings]      │
│  □  Install the SDK               [→ Docs]           │
│     npm install @idkitty/sdk                         │
│  □  Make your first authentication [→ Docs]          │
│  □  Set up a webhook (optional)   [→ Settings]       │
└─────────────────────────────────────────────────────┘
```

- Each step shows a filled checkmark `☑` once complete, derived from tenant state:
  - **Add an allowed origin** — checked when `tenant.allowedOrigins.length > 0`
  - **Install the SDK** — always unchecked (client-side only; no way to verify)
  - **Make your first authentication** — checked when `tenant.totalAuths > 0`
  - **Set up a webhook** — checked when `tenant.webhookUrl != null`
- `[→]` links: "Add an allowed origin" and "Set up a webhook" link to `/dashboard/settings`; "Install the SDK" and "Make your first authentication" link to the relevant `/docs` anchor.
- `[DISMISS]` sits in the top-right corner. Once dismissed the card is permanently hidden for this tenant (not per-session).
- The inline `npm install @idkitty/sdk` snippet has a copy button.

---

### `/dashboard/settings` — Settings

Sections:
1. **Tenant Profile**: name, contactEmail, description — inline edit.
2. **API Credentials**: `ApiKeyCard` — rotate secret with confirm modal.
3. **Allowed Origins**: List of origin URLs with add/remove. Input validates URL format.
4. **Webhook Config**: URL input, event checkboxes, `WebhookTester`.
5. **Plan**: Shows current plan + usage. Upgrade CTA for free tier.
6. **Danger Zone**: Delete tenant account (with typed-confirmation modal).

---

### `/dashboard/audit` — Audit Log

Full-page `AuditLogTable` with:
- Filter by: event type (multi-select), date range (calendar picker), DID (text search)
- Pagination (25 rows per page)
- Export to CSV button
- Color-coded rows by event type

---

## Components

### `ApiKeyCard.tsx`

```tsx
interface ApiKeyCardProps {
  clientId:     string;
  maskedSecret: string;   // "cs_***...***" — only last 4 chars shown
  onRotate:     () => Promise<void>;
  onCopy:       (value: string) => void;
}

// State:
// - isCopied: boolean (reset after 1.5s)
// - isRotating: boolean
// - showConfirm: boolean (rotation confirm modal)

// Behavior:
// - clientId shown in full (it's public)
// - secret shown masked; "REVEAL" button not available (security)
// - COPY button copies clientId to clipboard
// - ROTATE SECRET button opens ConfirmModal
//   - ConfirmModal asks user to type "ROTATE" to confirm
//   - On confirm: calls onRotate(), shows new secret once in a special display modal
//     with "COPY NOW — this will not be shown again" warning
//   - After modal closes, maskedSecret updates
```

**Rendered layout:**
```
┌─────────────────────────────────────────────────────┐
│  CLIENT ID                                          │
│  client_4a7b9c2d1e3f5a6b  [COPY]                   │
│                                                     │
│  CLIENT SECRET                                      │
│  cs_•••••••••••••••••••••••••••••f3a2              │
│                                          [ROTATE ↻] │
└─────────────────────────────────────────────────────┘
```

---

### `UsageChart.tsx`

```tsx
interface UsageChartProps {
  data:   DailyUsage[];
  period: '7d' | '30d' | '90d';
  onPeriodChange: (period: '7d' | '30d' | '90d') => void;
}

interface DailyUsage {
  date:    string;    // "2025-01-15"
  success: number;
  failed:  number;
}
```

Recharts `AreaChart` with two data series:
- `success` → filled area, `#5EC374` (green)
- `failed` → filled area, `#E74B4A` (red), stacked below success

Axis labels: JetBrains Mono, 11px. Grid lines: `rgba(3, 4, 4, 0.1)`.

Period selector: three buttons `[7D] [30D] [90D]` styled as `.btn-ghost` with active state.

Custom tooltip: black background, cream text, shows date + success/failed counts.

---

### `AuditLogTable.tsx`

```tsx
interface AuditLogTableProps {
  tenantId:  string;
  pageSize?: number;   // default 25
}

// Internal state:
// - filters: { events: string[], dateFrom: Date | null, dateTo: Date | null, didSearch: string }
// - page: number
// - data: fetched via useAuditLog hook (React Query)
```

**Columns:**
| Column     | Width  | Notes |
|------------|--------|-------|
| Timestamp  | 180px  | `YYYY-MM-DD HH:mm:ss` in JetBrains Mono |
| Event      | 160px  | Color-coded badge |
| DID        | 280px  | Truncated with ellipsis, hover shows full |
| IP         | 130px  | Plain text |
| User Agent | auto   | Truncated, hover tooltip |

**Event badge colors:**
```
AUTH_SUCCESS    → green bg  (#5EC374), black text
AUTH_FAILED     → red bg    (#E74B4A), white text
REGISTERED      → cyan bg   (#25CFE6), black text
KEY_ROTATED     → yellow bg (#F5A623), black text
SESSION_REVOKED → grey bg   (#21242B), white text
IDENTITY_REVOKED→ red bg    (#E74B4A), white text, bold
```

**Filter bar:**
- Event type: multi-select dropdown (checkboxes per event type)
- Date range: `from` and `to` date inputs
- DID search: text input with 300ms debounce
- `[CLEAR FILTERS]` button
- `[EXPORT CSV]` button — downloads current filtered result

---

### `WebhookTester.tsx`

```tsx
interface WebhookTesterProps {
  webhookUrl:     string | null;
  onSend:         () => Promise<WebhookTestResult>;
}

interface WebhookTestResult {
  delivered:    boolean;
  statusCode:   number;
  responseTime: number;
  error?:       string;
}

// State:
// - isSending: boolean
// - lastResult: WebhookTestResult | null

// Behavior:
// - Shows webhook URL (read-only display)
// - "SEND TEST WEBHOOK" button → calls onSend()
// - Result display:
//   - Success: green box, "✓ DELIVERED  200  142ms"
//   - Failure: red box, "✗ FAILED  500  or  TIMEOUT  error message"
// - Disabled if no webhookUrl configured
```

---

### `TenantOnboarding.tsx`

2-step fast-path wizard shown on first dashboard login. Advanced configuration (origins, webhooks, SDK setup) is deferred to the persistent Quick Start card on the dashboard home.

```tsx
interface TenantOnboardingProps {
  onComplete: (clientId: string) => void;
}

// State:
// - step: 1 | 2
// - appName: string
// - contactEmail: string
// - description: string          (optional, collapsed by default)
// - descriptionExpanded: boolean
// - clientId: string | null       (populated after step 1 submit)
// - clientSecret: string | null   (one-time, cleared after step 2)
// - secretCopied: boolean         (must be true to enable [GO TO DASHBOARD →])
```

---

#### Step 1 — Name your app

```
┌─────────────────────────────────────────────────────┐
│  NAME YOUR APP                           Step 1 of 2 │
│                                                      │
│  App name *                                          │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Contact email *                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Add description ▸                                   │
│                                                      │
│                              [CONTINUE →]            │
└─────────────────────────────────────────────────────┘
```

- App name and contact email are required; inline validation on blur.
- "Add description ▸" is a toggle that expands a `<textarea>` inline. No page re-render.
- `[CONTINUE →]` calls `POST /api/tenants` with `{ appName, contactEmail, description? }`. On success, the response includes `clientId` and the one-time `clientSecret`; advances to step 2.

---

#### Step 2 — Your API keys

```
┌─────────────────────────────────────────────────────┐
│  YOUR API KEYS                           Step 2 of 2 │
│                                                      │
│  CLIENT ID                                           │
│  client_4a7b9c2d1e3f5a6b              [COPY]        │
│                                                      │
│  CLIENT SECRET                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  cs_9f3a...e2b1                              │   │
│  │                [COPY NOW]                    │   │  ← cyan, large
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ ⚠ This is the only time your secret will     │   │
│  │   be shown. Copy it now and store it safely. │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ☐  I've copied my secret key                        │
│                                                      │
│                      [GO TO DASHBOARD →]             │
│                      (disabled until checkbox ticked)│
│                                                      │
│  You can configure origins, webhooks, and other      │
│  settings later.                                     │
└─────────────────────────────────────────────────────┘
```

- `clientId` is shown in full and is always copyable.
- `clientSecret` is shown in full only on this screen. `[COPY NOW]` copies it to clipboard; the button label changes to `✓ COPIED` for 2 seconds.
- The warning banner uses `var(--warning)` left-border accent (matches error state spec).
- `[GO TO DASHBOARD →]` is disabled until the checkbox is ticked. On click: clears `clientSecret` from component state, calls `onComplete(clientId)`, and redirects to `/dashboard`.
- No back-navigation from step 2 — the secret cannot be re-shown.

---

### `DIDResolver.tsx`

```tsx
interface DIDResolverProps {
  initialDid?: string;  // pre-fill from URL query param
}

// State:
// - inputDid: string
// - identity: Identity | null
// - loading: boolean
// - error: string | null

// Behavior:
// - Input: "did:idkitty:..." with [RESOLVE] button
// - On resolve: fetches GET /api/sdk/identity/:did
// - Shows IdentityCard if found
// - Shows DID Document JSON in collapsible terminal block
// - Shows Polygonscan link
// - Shows "REVOKED" banner if revokedAt != null
```

---

### `IdentityCard.tsx` (updated from v1)

Same two-panel layout as v1. Changes for v2:
- Shows `keyVersion` badge (`KEY V2`)
- Shows `blockchainStatus` indicator (`● CONFIRMED` / `⟳ PENDING` / `✗ FAILED`)
- Shows chain badge (`POLYGON AMOY` / `BASE`)
- QR encodes full DID Document URL (`https://idkitty.io/identity?did=...`)

**Username display:**

If `username` is set:
- Primary display: `@swayam` — large, prominent, JetBrains Mono
- Secondary display: `did:idkitty:...0x1a2b` — small, grey, truncated, tap/click to copy

If no `username`:
- Primary display: "Identity ID" (label)
- Secondary display: `did:idkitty:...0x1a2b` — truncated
- Call-to-action: `[Claim your @username →]` — small cyan link

---

### `ChallengeModal.tsx` (updated from v1)

`ChallengeModal` now implements only **Mode B — Manual Key Entry**. The QR flow lives directly on the `/login` page. The component can still be rendered as a modal by other integrators, but on `/login` it is mounted inline inside the collapsed section.

```tsx
interface ChallengeModalProps {
  did?:         string;   // pre-filled; user can edit if not provided
  tenantName?:  string;   // shown in header — "Signing in to: My App"
  onSuccess:    (jwt: string, sessionId: string) => void;
  onCancel?:    () => void;
}

// Internal state:
// - did: string
// - privateKeyHex: string   (masked input, never logged)
// - challenge: string | null
// - isLoading: boolean
// - error: string | null
```

**Behaviour:**
1. On mount (or when `did` changes): fetches challenge via `GET /api/sdk/challenge/:did`
2. Countdown timer based on server-returned `expiresIn`; auto-refetches when expired
3. Header: *"Signing in to: **\<tenantName\>**"* (omitted if `tenantName` not provided)
4. Identity ID or @username input — pre-filled and editable; if input matches `/^[a-z0-9_]{3,20}$/` or starts with `@`, it is resolved via `GET /api/identity/username/:username` first to extract the DID before fetching the challenge; refetches challenge on change (300ms debounce)
5. Signing Key input — masked, paste-friendly; value held in component state only, never sent over the network
6. `[SIGN IN]` button — signs the challenge client-side, POSTs signature to `/api/auth/verify`
7. Small warning below the button: *"Your signing key never leaves your browser."*
8. On success: calls `onSuccess(jwt, sessionId)`
9. On error: shows inline error message in red

---

## Error State Specifications

Error states are displayed inline on the page where the error occurs. Each uses the neobrutalism card style: `border: 2px solid var(--black)`, `var(--shadow-sm)`, with a coloured 4px left-border accent indicating severity.

---

### 1. `AUTH_FAILED` — Invalid signature

**Trigger:** `/api/auth/verify` returns `401` with `code: 'AUTH_FAILED'`

**Left-border accent:** `var(--error)` (#E74B4A)

| Field | Copy |
|---|---|
| Title | Sign-in failed |
| Body | The signing key didn't match the identity `<did>`. Make sure you're using the correct key for this identity. |

**Actions:**
- `[TRY AGAIN]` — clears the Signing Key input and re-focuses it (cyan button)
- `[WHICH KEY DO I USE? →]` — links to `/docs#troubleshooting` (ghost button)

---

### 2. `CHALLENGE_EXPIRED` — Challenge expired

**Trigger:** Server returns `410` with `code: 'CHALLENGE_EXPIRED'`, or the client-side countdown reaches zero

**Left-border accent:** `var(--warning)` (#F5A623)

| Field | Copy |
|---|---|
| Title | Request expired |
| Body | Sign-in requests are only valid for 60 seconds. This one has expired. |

**Actions:**
- `[REQUEST NEW CODE]` — re-fetches challenge via `GET /api/sdk/challenge/:did` (cyan button)

---

### 3. `DID_REVOKED` — Identity revoked

**Trigger:** Any endpoint returns `403` with `code: 'DID_REVOKED'`

**Left-border accent:** `var(--error)` (#E74B4A)

| Field | Copy |
|---|---|
| Title | This identity has been revoked |
| Body | This identity is no longer active. If this was intentional, create a new identity. If not, your signing key may be compromised. |

**Actions:**
- `[CREATE NEW IDENTITY →]` — navigates to `/create` (cyan button)
- `[LEARN MORE →]` — links to `/docs#revocation` (ghost button)

---

### 4. `DID_NOT_FOUND` — Identity not found (404)

**Trigger:** Any endpoint returns `404` with `code: 'DID_NOT_FOUND'`

**Left-border accent:** `var(--warning)` (#F5A623)

| Field | Copy |
|---|---|
| Title | Identity not found |
| Body | No identity exists for `<did>`. Check the ID and try again, or create a new one. |

**Actions:**
- `[TRY AGAIN]` — re-focuses the DID input (cyan button)
- `[CREATE IDENTITY →]` — navigates to `/create` (ghost button)

---

### 5. Network / RPC error during registration

**Trigger:** `POST /api/identity/register` succeeds but `blockchainStatus` returns `'pending'` or `'failed'`; or a network timeout occurs during the on-chain write

**Left-border accent:** `var(--warning)` (#F5A623)

| Field | Copy |
|---|---|
| Title | Blockchain write pending |
| Body | Your identity was saved, but the blockchain confirmation is delayed. This will resolve automatically — you can continue using your identity now. |

**Actions:**
- `[CONTINUE →]` — proceeds to the success state (cyan button)

**Note:** This is the graceful degradation path for `blockchainStatus: 'pending'`. The identity is usable immediately; `IdentityCard` will show `⟳ PENDING` until the chain confirms.

---

## State Management

### `store/tenant.store.ts`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  clientId:        string | null;
  tenantName:      string | null;
  plan:            'free' | 'pro' | 'enterprise' | null;
  isAuthenticated: boolean;
  setTenant:       (data: Partial<TenantState>) => void;
  clearTenant:     () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      clientId:        null,
      tenantName:      null,
      plan:            null,
      isAuthenticated: false,
      setTenant:       (data) => set((s) => ({ ...s, ...data })),
      clearTenant:     () => set({ clientId: null, tenantName: null, plan: null, isAuthenticated: false }),
    }),
    { name: 'idkitty-tenant' }
  )
);
```

### `store/identity.store.ts`

```ts
import { create } from 'zustand';

interface IdentityState {
  did:         string | null;
  publicKey:   string | null;
  privateKey:  string | null;     // stored in memory only — not persisted
  claims:      Record<string, string>;
  accessToken: string | null;     // sessionStorage
  sessionId:   string | null;

  setIdentity: (identity: Partial<IdentityState>) => void;
  setTokens:   (accessToken: string, sessionId: string) => void;
  clearAll:    () => void;
}

export const useIdentityStore = create<IdentityState>()((set) => ({
  did:         null,
  publicKey:   null,
  privateKey:  null,
  claims:      {},
  accessToken: typeof window !== 'undefined' ? sessionStorage.getItem('idkitty_at') : null,
  sessionId:   typeof window !== 'undefined' ? sessionStorage.getItem('idkitty_sid') : null,

  setIdentity: (identity) => set((s) => ({ ...s, ...identity })),
  setTokens:   (accessToken, sessionId) => {
    sessionStorage.setItem('idkitty_at',  accessToken);
    sessionStorage.setItem('idkitty_sid', sessionId);
    set({ accessToken, sessionId });
  },
  clearAll: () => {
    sessionStorage.removeItem('idkitty_at');
    sessionStorage.removeItem('idkitty_sid');
    set({ did: null, publicKey: null, privateKey: null, claims: {}, accessToken: null, sessionId: null });
  },
}));
```

---

## React Query Hooks

### `hooks/useTenantStats.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useTenantStats = (period: '7d' | '30d' | '90d' = '30d') =>
  useQuery({
    queryKey: ['tenant-stats', period],
    queryFn:  () => api.get(`/api/tenants/stats?period=${period}`).then(r => r.data),
    refetchInterval: 30_000,
    staleTime:       60_000,
  });
```

### `hooks/useAuditLog.ts`

```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AuditFilters {
  events?:   string[];
  dateFrom?: string;
  dateTo?:   string;
  did?:      string;
  page?:     number;
  limit?:    number;
}

export const useAuditLog = (filters: AuditFilters) =>
  useInfiniteQuery({
    queryKey:        ['audit-log', filters],
    queryFn:         ({ pageParam = 1 }) =>
      api.get('/api/tenants/audit', { params: { ...filters, page: pageParam } }).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: (last, _, lastPageParam) =>
      last.hasMore ? (lastPageParam as number) + 1 : undefined,
  });
```

---

# Part B: Mobile Authenticator App (React Native / Expo)

## Stack

| Layer            | Choice                              | Version  |
|------------------|-------------------------------------|----------|
| Framework        | Expo                                | SDK 52   |
| Language         | TypeScript                          | 5.x      |
| Navigation       | React Navigation (native stack)     | 6.x      |
| Styling          | NativeWind                          | 4.x      |
| Animations       | Reanimated                          | 3.x      |
| State            | Zustand + MMKV                      | 4.x / 2.x |
| Secure Storage   | expo-secure-store                   | 14.x     |
| Biometrics       | expo-local-authentication           | 14.x     |
| Camera / QR      | expo-camera + expo-barcode-scanner  | 15.x     |
| Crypto           | expo-crypto                         | 13.x     |
| Fonts            | expo-google-fonts/jetbrains-mono    | latest   |
| Push (stretch)   | expo-notifications + FCM/APNs       | 0.29.x   |
| Data Fetching    | TanStack React Query                | 5.x      |
| HTTP             | Axios                               | 1.x      |

---

## Design System (NativeWind + Custom)

```js
// tailwind.config.js (for NativeWind)
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream:   '#F5F3E7',
        black:   '#030404',
        grey:    '#21242B',
        cyan:    '#25CFE6',
        success: '#5EC374',
        error:   '#E74B4A',
        warning: '#F5A623',
        terminal:'#030404',
      },
      fontFamily: {
        mono:  ['JetBrainsMono_400Regular'],
        monoBold: ['JetBrainsMono_700Bold'],
      },
    },
  },
};
```

**UI rules:**
- Background: cream `#F5F3E7` on all screens
- Cards: `border-2 border-black shadow-[4px_4px_0px_#030404]`
- Buttons: `border-2 border-black font-monoBold uppercase tracking-widest`
- Zero `borderRadius` on all elements
- Pixel cat mascot appears as animated section header across multiple screens

---

## Folder Structure

```
IDkitty-mobile/
├── app/
│   ├── _layout.tsx                      ← NavigationContainer + providers
│   ├── (onboarding)/
│   │   ├── _layout.tsx                  ← onboarding stack navigator
│   │   ├── index.tsx                    ← WelcomeScreen
│   │   ├── create.tsx                   ← CreateIdentityScreen
│   │   └── import.tsx                   ← ImportIdentityScreen
│   └── (main)/
│       ├── _layout.tsx                  ← tab navigator (Home, Scan, Activity, Settings)
│       ├── home.tsx                     ← HomeScreen
│       ├── scan.tsx                     ← ScanScreen
│       ├── activity.tsx                 ← ActivityScreen
│       └── settings.tsx                 ← SettingsScreen
├── components/
│   ├── identity/
│   │   ├── MobileIdentityCard.tsx
│   │   └── KeyDisplay.tsx
│   ├── auth/
│   │   └── ApproveScreen.tsx            ← modal screen overlaying main tabs
│   ├── shared/
│   │   ├── PixelCatAnimated.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── PressableButton.tsx          ← haptic + animated button
│   │   ├── SecureInput.tsx
│   │   └── ConfirmSheet.tsx             ← bottom sheet confirm
├── store/
│   ├── identity.store.ts                ← Zustand + MMKV (non-sensitive)
│   └── auth.store.ts                    ← recent auth requests, activity feed
├── services/
│   ├── crypto.service.ts                ← expo-crypto based key ops
│   ├── api.service.ts
│   ├── biometric.service.ts
│   └── secureStore.service.ts           ← secure key storage abstraction
├── hooks/
│   ├── useBiometric.ts
│   ├── useDeepLink.ts
│   └── useAuthActivity.ts
├── types/
│   └── index.ts
├── constants/
│   └── chains.ts
├── app.json
└── tsconfig.json
```

---

## Navigation Structure

```
NavigationContainer
└── RootStack
    ├── OnboardingStack         ← shown if no identity in SecureStore
    │   ├── WelcomeScreen
    │   ├── CreateIdentityScreen
    │   └── ImportIdentityScreen
    └── MainTabs                ← shown if identity exists
        ├── HomeTab             → HomeScreen
        ├── ScanTab             → ScanScreen
        ├── ActivityTab         → ActivityScreen
        └── SettingsTab         → SettingsScreen

        [Modal Stack — overlays MainTabs]
        └── ApproveScreen       ← launched from scan or deep link
```

---

## Screens

### `WelcomeScreen`

**Path:** `app/(onboarding)/index.tsx`

```
┌──────────────────────────────────┐
│                                  │
│         [PixelCatAnimated]       │
│         (blinking, 96×96)        │
│                                  │
│   IDKITTY                        │
│   Your @username.                │
│   Your identity. No passwords.   │
│                                  │
│   [CREATE IDENTITY →]            │
│   (cyan bg, black border)        │
│                                  │
│   [IMPORT EXISTING →]            │
│   (ghost button)                 │
│                                  │
└──────────────────────────────────┘
```

---

### `CreateIdentityScreen`

**Path:** `app/(onboarding)/create.tsx`

3-step flow:

**Step 1 — GENERATE**
- Button `[GENERATE KEYPAIR]` → calls `cryptoService.generateKeyPair()` using `expo-crypto`
- Shows Your Identity ID in cream terminal box (DID string shown as subtext)
- Shows Your Identity Address (truncated)
- Shows masked Signing Key with `[REVEAL]` toggle
- Warning: "Screenshot this screen. Store your Signing Key safely."

**Step 2 — CLAIMS** (optional)
- Name input, email input
- `[SKIP]` and `[CONTINUE]` buttons

**Step 2.5 — CHOOSE A USERNAME** (optional)

Label: `CHOOSE A USERNAME`

Subtext: *"Pick a name so others can find you without a long ID string."*

- Input: `@[          ]` — prefix `@` shown as non-editable adornment
- Real-time availability check: debounced 400ms, calls `GET /api/identity/username/:username/available`
- States: typing (neutral) / checking (grey) / available (green `✓`) / taken (red `✗`) / reserved (red `✗`) / invalid format (red inline message)
- `[SKIP FOR NOW]` text link — username can be claimed later from SettingsScreen Section 1
- If a username is entered and valid, it is claimed via `POST /api/identity/:did/username` after registration completes

**Step 3 — SAVE**

Three export paths presented in priority order:

**Primary — SAVE TO THIS DEVICE (Recommended)**
- Cyan button, large
- Triggers biometric prompt: *"Authenticate to save your Signing Key"*
- On biometric success: saves Signing Key to `expo-secure-store` (`requireAuthentication: true`), other identity data to MMKV
- Calls `POST /api/identity/register` with chain selection
- Shows success state with Identity ID card

**Secondary — DOWNLOAD BACKUP FILE**
- Ghost button
- User sets a password (min 12 chars; strength indicator shown inline)
- Generates an encrypted keystore file using AES-256-GCM with a PBKDF2-derived key
- File saved via share sheet: `idkitty-backup-<did-prefix>.json`
- Warning shown: *"Keep this file offline. You will need your password to recover access."*

**Tertiary — SHOW KEY (Advanced)**
- Small text link, not a styled button
- Opens `ConfirmSheet` (bottom sheet) with message: *"I understand that losing this key means permanent loss of access. There is no recovery."*
- Only after user confirms: raw Signing Key is revealed inline in a cream terminal block
- Warning banner remains visible the entire time the key is shown

---

## Error State Specifications

Error states on mobile use the `ConfirmSheet` component (bottom sheet). Each sheet has a coloured icon at the top, a title, a body, one primary action button, and a secondary "Dismiss" text link. Screen capture is disabled on all error sheets that display a DID.

---

### 1. `AUTH_FAILED` — Invalid signature

**Trigger:** `/api/auth/verify` returns `401` with `code: 'AUTH_FAILED'`

**Icon:** ✗ (red — `var(--error)`)

| Field | Copy |
|---|---|
| Title | Sign-in failed |
| Body | The signing key didn't match the identity `<did>`. Make sure you're using the correct key for this identity. |

**Primary action:** `[TRY AGAIN]` — closes the sheet and returns to `ApproveScreen`

**Secondary:** Dismiss (text link)

---

### 2. `CHALLENGE_EXPIRED` — Challenge expired

**Trigger:** Client-side countdown reaches zero, or server returns `410` with `code: 'CHALLENGE_EXPIRED'`

**Icon:** ⏱ (yellow — `var(--warning)`)

| Field | Copy |
|---|---|
| Title | Request expired |
| Body | Sign-in requests are only valid for 60 seconds. This one has expired. |

**Primary action:** `[SCAN AGAIN]` — closes the sheet and navigates back to `ScanScreen`

**Secondary:** Dismiss (text link)

---

### 3. `DID_REVOKED` — Identity revoked

**Trigger:** Any endpoint returns `403` with `code: 'DID_REVOKED'`

**Icon:** ✗ (red — `var(--error)`)

| Field | Copy |
|---|---|
| Title | This identity has been revoked |
| Body | This identity is no longer active. If this was intentional, create a new identity. If not, your signing key may be compromised. |

**Primary action:** `[EXPORT RECOVERY DATA]` — triggers the Export Identity flow (biometric-gated) so the user can retrieve their Signing Key before losing access (cyan button)

**Secondary actions (shown below primary, in order):**
- `[CREATE NEW IDENTITY →]` — navigates to the onboarding `CreateIdentityScreen` (ghost button)
- Dismiss (text link)

---

### 4. `DID_NOT_FOUND` — Identity not found (404)

**Trigger:** Any endpoint returns `404` with `code: 'DID_NOT_FOUND'`

**Icon:** ? (yellow — `var(--warning)`)

| Field | Copy |
|---|---|
| Title | Identity not found |
| Body | No identity exists for `<did>`. Check the ID and try again, or create a new one. |

**Primary action:** `[TRY AGAIN]` — closes the sheet and returns to the previous screen

**Secondary:** Dismiss (text link)

---

### 5. Network / RPC error during registration

**Trigger:** `POST /api/identity/register` succeeds but `blockchainStatus` returns `'pending'` or `'failed'`

**Icon:** ⟳ (yellow — `var(--warning)`)

| Field | Copy |
|---|---|
| Title | Blockchain write pending |
| Body | Your identity was saved, but the blockchain confirmation is delayed. This will resolve automatically — you can continue using your identity now. |

**Primary action:** `[CONTINUE →]` — closes the sheet and navigates to `HomeScreen` (cyan button)

**Secondary:** Dismiss (text link)

**Note:** The `HomeScreen` `MobileIdentityCard` will show `⟳ PENDING` until the chain confirms. The identity is usable immediately — this is the graceful degradation path for `blockchainStatus: 'pending'`.

---

## Key Export Payload Schema

Used by both the `/create` web page (Download Backup File path) and `CreateIdentityScreen` mobile (Download Backup File path). The QR payload for the primary "Save to Mobile App / Save to This Device" path is an in-memory transfer only and is never persisted to disk in this format.

```json
{
  "version": 1,
  "did": "string",
  "encryptedPrivateKey": "string",
  "salt": "string",
  "iv": "string",
  "createdAt": "ISO8601"
}
```

| Field | Type | Notes |
|---|---|---|
| `version` | `number` | Schema version — currently `1` |
| `did` | `string` | Full DID string, e.g. `did:idkitty:poly:0x…` |
| `encryptedPrivateKey` | `string` | AES-256-GCM ciphertext, base64-encoded; key derived from user password via PBKDF2 (SHA-256, 310 000 iterations) |
| `salt` | `string` | 32-byte random salt, hex-encoded; unique per export |
| `iv` | `string` | 12-byte random IV, hex-encoded; unique per export |
| `createdAt` | `string` | ISO 8601 timestamp of export |

---

### `ImportIdentityScreen`

**Path:** `app/(onboarding)/import.tsx`

- Identity ID input
- Signing Key input (masked, paste-friendly)
- `[VERIFY & IMPORT]` → fetches Identity ID from backend to validate Identity Address matches
- On success: saves to SecureStore, navigates to MainTabs

---

### `HomeScreen`

**Path:** `app/(main)/home.tsx`

```
┌──────────────────────────────────┐
│  IDKITTY          [⚙ Settings]  │
├──────────────────────────────────┤
│  [MobileIdentityCard]            │
│  • @swayam                       │  ← large, if username set
│  • did:...0x1a2b   (11px grey)  │  ← always shown below username
│  • Name / email claims           │
│  • ● ACTIVE    KEY V1            │
│  • Secured on blockchain [ℹ]    │
├──────────────────────────────────┤
│  RECENT ACTIVITY                 │
│  ┌────────────────────────────┐  │
│  │ ✓ PurrBank       2 min ago │  │
│  │ ✓ DevPortal      1 hr ago  │  │
│  │ ✗ Unknown        3 hr ago  │  │
│  └────────────────────────────┘  │
│  [VIEW ALL ACTIVITY →]           │
├──────────────────────────────────┤
│  [SCAN QR TO LOGIN]              │
│  (large cyan button)             │
└──────────────────────────────────┘
```

If no username is set, a yellow banner is shown inside the `MobileIdentityCard` area:

```
┌──────────────────────────────────┐
│  Claim your @username →          │  ← yellow bg, taps to SettingsScreen §1
└──────────────────────────────────┘
```

---

### `ScanScreen`

**Path:** `app/(main)/scan.tsx`

Full-screen QR scanner using `expo-camera`.

- Camera permission request on first open
- QR viewfinder with IDKitty corner brackets
- Parses scanned QR: expects `{ tenantId, did, challenge, appName, appDomain, requestedAt, isVerified, appIcon? }`
- On valid QR: navigates to `ApproveScreen` (modal) passing parsed data
- On invalid QR: shows error toast

---

### `ApproveScreen`

**Path:** `components/auth/ApproveScreen.tsx` (modal)

This is the most security-critical screen. Launched from either:
1. QR scan result
2. Deep link `idkitty://auth?...`
3. (Stretch) Push notification tap

**`AuthRequest` interface:**

```tsx
interface AuthRequest {
  tenantId:     string;
  did:          string;
  challenge:    string;
  appName:      string;
  appDomain:    string;   // e.g. "purrbank.io" — extracted from tenant allowedOrigins[0]
  requestedAt:  number;   // unix timestamp from challenge issuedAt
  isVerified:   boolean;  // true if tenant has at least one verified allowedOrigin
  appIcon?:     string;   // optional image URL
  callbackUrl?: string;   // deep link return URL (deep link flow only)
}
```

**Wireframe:**

```
┌──────────────────────────────────┐
│  SIGN-IN REQUEST                 │
│  ──────────────────────────────  │
│  [App Icon]  <appName>           │
│  <appDomain>   [✓ VERIFIED] or   │
│                [UNVERIFIED]      │
│  Requested <N> seconds ago       │
│  ──────────────────────────────  │
│  Signing in as:                  │
│  @swayam                         │
│  did:idkitty:...0x1a2b  [COPY]  │
│  ──────────────────────────────  │
│  [▸ Advanced — show challenge]   │  ← collapsed by default
│  ──────────────────────────────  │
│  [DENY]          [APPROVE ✓]    │
│                                  │
│  Biometric required to approve.  │
└──────────────────────────────────┘
```

- `[✓ VERIFIED]` badge: cyan bg, black text — shown when `isVerified === true`.
- `[UNVERIFIED]` badge: grey bg, white text — shown when `isVerified === false`.
- `Requested <N> seconds ago` is derived from `requestedAt`, updated every second on a `setInterval`.
- "Signing in as:" shows `@username` on the first line (if set) and the truncated DID on the second line. If no username, only the truncated DID is shown.
- `[COPY]` copies the full (untruncated) DID to clipboard.
- The **Advanced** accordion is collapsed by default. When expanded it reveals the raw challenge string in a monospace terminal block. The challenge is never shown in the main view.

**Approve flow:**
1. Screen mounts; `requestedAt` age is computed and a 1-second interval begins.
2. `[APPROVE]` button triggers `LocalAuthentication.authenticateAsync()`.
3. On biometric success: `cryptoService.signChallenge(challenge, privateKeyHex)` (loaded from SecureStore).
4. POST to `/api/auth/verify` with `{ did, signature, tenantId }`.
5. On success: show success animation + "Authenticated with PurrBank". Add to activity log.
6. If deep link flow: open `callbackUrl` with JWT as query param.

**Security requirements for this screen:**
- Screen capture disabled: `expo-screen-capture` `preventScreenCapture()` called on mount
- Biometric is mandatory — cannot be bypassed
- If `isVerified === false`: show a yellow warning banner above the action buttons — *"⚠ This app has not verified its domain with IDKitty. Proceed with caution."*
- If `requestedAt` is more than 55 seconds ago: disable `[APPROVE]` and show *"This request has expired."* in red below the buttons; auto-dismiss the screen at 60 seconds
- Raw challenge string is hidden behind the collapsed "Advanced" section — never shown in the main view

---

### `SettingsScreen`

**Path:** `app/(main)/settings.tsx`

Sections:
1. **Identity**: Name, email, avatar — edit and re-register claims; username claim/change
2. **Security**: Require biometric to approve sign-in requests (toggle), rotate key (biometric required)
3. **Recovery Devices**: Add and manage recovery devices (see full spec below)
4. **Export Identity**: Shows masked Signing Key with biometric reveal
5. **Danger Zone**: Revoke identity (double-confirm)
6. **About**: Version, licenses, contact

---

#### Section 1 — Identity (username field)

Below the name, email, and avatar fields:

```
USERNAME
@swayam                     [CHANGE USERNAME]
```

If no username set:
```
USERNAME
Not set                     [CLAIM @USERNAME]
```

Tapping `[CHANGE USERNAME]` or `[CLAIM @USERNAME]` opens a `ConfirmSheet` (bottom sheet) with:
- Input: `@[current username or empty]`
- Real-time availability check (same debounced flow as `CreateIdentityScreen`)
- If username was changed within the last 30 days: *"You can change your username again on \<date\>."* (input disabled)
- `[SAVE]` button (disabled until a valid, available username is entered)
- `[CANCEL]` text link

On save: calls `POST /api/identity/:did/username`.

---

#### Section 2 — Security

**"Require biometric to approve sign-in requests"** toggle (replaces generic "Biometric toggle"):
- When toggled off, a warning is shown inline before the change is applied: *"Disabling biometrics means anyone with your phone can approve sign-in requests."*
- User must confirm the warning before the setting takes effect.

**Rotate key**: biometric required to proceed.

---

#### Section 3 — Recovery Devices

**Header:** `RECOVERY DEVICES`

**Subtext:** *"Add a second device. If you lose this phone, you can still access your identity."*

**State A — No recovery device added:**

```
┌──────────────────────────────────┐
│  ⚠ You have no recovery device. │
│  If you lose this phone, your    │
│  identity cannot be recovered.   │
└──────────────────────────────────┘

[+ ADD RECOVERY DEVICE]   ← cyan button
```

**State B — 1 or more recovery devices:**

Each device is shown as a list row:
- Device label (e.g. "iPhone 15 Pro")
- Added: `<addedAt date>`
- Last used: `<lastUsedAt date>` or "Never"
- `[REVOKE]` button per row — opens `ConfirmSheet` before revoking

Below the list:

```
[+ ADD ANOTHER DEVICE]   ← ghost button
```

---

#### Add Recovery Device Flow

**Step 1 — QR generation (current device)**

Current device generates and displays a QR code containing a signed add-device request:

```json
{
  "did": "string",
  "requestingDeviceId": "string",
  "timestamp": "number",
  "signature": "string"
}
```

The QR is valid for 60 seconds. Screen capture is disabled for this view.

**Step 2 — Scan on second device**

Second device scans the QR using IDKitty's ScanScreen. The app recognises the add-device payload and navigates to `ImportIdentityScreen`, pre-filled with the DID.

**Step 3 — Second device registers its key**

Second device generates its own keypair, then calls:

```
POST /api/identity/:did/add-device
Body: { newPublicKey, deviceLabel, authSignature }
```

`authSignature` is produced by the current (primary) device's Signing Key, authorising the addition.

**Step 4 — On-chain registration**

Backend calls `addKey()` on-chain with `KeyPurpose.Authentication` and adds a `DeviceSchema` entry to the Identity document.

**Step 5 — Confirmation**

Both devices now show the DID as active. The new device appears in the Recovery Devices list with `addedAt` set to now.

---

#### Key Rotation for Recovery (Lost Primary Device)

If the primary device is lost, the recovery device can call:

```
POST /api/identity/:did/rotate-key
```

This revokes the lost device's key on-chain and promotes the recovery device's key as the new active key. The recovered identity is then accessible exclusively from the recovery device until a new recovery device is added.

---

### `ActivityScreen`

**Path:** `app/(main)/activity.tsx`

Full auth history from local MMKV store + backend `/api/auth/sessions`.

Each item:
- App name + icon
- `✓ SUCCESS` or `✗ FAILED` with event time
- "X active session" chip on recent entries
- Tap to expand: full Identity ID, sign-in request, IP, user agent

---

## Secure Storage Schema

```ts
// services/secureStore.service.ts
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  PRIVATE_KEY: 'idkitty.identity.privateKey',
  DID:         'idkitty.identity.did',
} as const;

export const savePrivateKey = (key: string) =>
  SecureStore.setItemAsync(KEYS.PRIVATE_KEY, key, {
    requireAuthentication: true,     // biometric required on every read
    authenticationPrompt:  'Authenticate to save your Signing Key',
    keychainAccessible:    SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  });

export const loadPrivateKey = () =>
  SecureStore.getItemAsync(KEYS.PRIVATE_KEY, {
    requireAuthentication: true,
    authenticationPrompt:  'Authenticate to approve this sign-in request',
  });

export const saveDID = (did: string) =>
  SecureStore.setItemAsync(KEYS.DID, did);

export const loadDID = () =>
  SecureStore.getItemAsync(KEYS.DID);

export const clearIdentity = async () => {
  await SecureStore.deleteItemAsync(KEYS.PRIVATE_KEY);
  await SecureStore.deleteItemAsync(KEYS.DID);
};
```

**Storage tiers:**
| Data | Storage | Reason |
|---|---|---|
| Private key | `expo-secure-store` with `requireAuthentication: true` | Hardware-backed, biometric gate |
| DID | `expo-secure-store` | Sensitive but no biometric needed |
| Claims (name, email) | MMKV encrypted store | Fast read, not cryptographic secrets |
| Auth activity feed | MMKV | Local cache, rebuilt from API |
| JWT / access token | Memory only (Zustand, no persistence) | Cleared on app close |

---

## Crypto Service (Expo)

```ts
// services/crypto.service.ts
import * as ExpoRandom from 'expo-random';
import { loadPrivateKey } from './secureStore.service';

// Key generation using expo-crypto (wraps Web Crypto on RN)
export const generateKeyPair = async (chain = 'polygon-amoy') => {
  const kp = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  const pubRaw   = await crypto.subtle.exportKey('raw',   kp.publicKey);
  const privPkcs = await crypto.subtle.exportKey('pkcs8', kp.privateKey);

  const bufToHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');

  const pubHex = bufToHex(pubRaw);
  return {
    did:        `did:idkitty:${chain}:${pubHex.slice(2, 22)}`,
    publicKey:  pubHex,
    privateKey: bufToHex(privPkcs),
  };
};

// Sign a challenge — loads private key from SecureStore (triggers biometric)
export const signChallenge = async (challenge: string): Promise<string> => {
  const privateKeyHex = await loadPrivateKey(); // biometric gate here
  if (!privateKeyHex) throw new Error('PRIVATE_KEY_NOT_FOUND');

  const hexToBuf = (hex: string) =>
    new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16))).buffer;

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    hexToBuf(privateKeyHex),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(challenge)
  );
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2,'0')).join('');
};
```

---

## API Service (`services/api.service.ts`)

Thin wrappers around the Axios instance for SDK-facing endpoints consumed by the mobile app and the `/login` page QR flow.

```ts
import { api } from './api';

// Fetch a sign-in challenge for a given DID
export const fetchChallenge = (did: string) =>
  api.get<{ challenge: string; expiresIn: number; sessionId: string }>(
    `/api/sdk/challenge/${did}`
  ).then(r => r.data);

// Poll for QR auth result after challenge QR is displayed
// Returns 'pending' until the mobile app approves/denies, or the challenge expires
export const checkAuthStatus = (sessionId: string) =>
  api.get<{ status: 'pending' | 'approved' | 'denied' | 'expired' }>(
    `/api/sdk/auth-status/${sessionId}`
  ).then(r => r.data);

// Submit a manually-signed challenge (Mode B / ChallengeModal)
export const verifySignature = (payload: {
  did:       string;
  signature: string;
  tenantId:  string;
}) =>
  api.post<{ accessToken: string; sessionId: string }>(
    '/api/auth/verify',
    payload
  ).then(r => r.data);
```

---

## Auth Flows

### 1. QR-Based Auth Flow

```
[Integrated App Login Page]
  ↓ App backend generates challenge via GET /api/auth/challenge/:did
  ↓ App renders QR containing: { tenantId, did, challenge, appName, appDomain, requestedAt, isVerified }

[IDKitty Mobile App]
  ↓ User opens ScanScreen → scans QR
  ↓ ApproveScreen shown with app name, domain, verified badge, and elapsed time
  ↓ User taps [APPROVE]
  ↓ Biometric prompt (Face ID / fingerprint)
  ↓ On success: loadPrivateKey() from SecureStore
  ↓ signChallenge(challenge) → hex signature
  ↓ POST /api/auth/verify { did, signature, tenantId }
  ↓ Backend verifies → issues JWT → calls tenant webhook with token
  ↓ Tenant app receives JWT via webhook
  ↓ Mobile app shows "✓ Authenticated with PurrBank"

[Integrated App]
  ↓ Webhook received: { event: 'auth.success', data: { did, accessToken, sessionId } }
  ↓ User is now logged in
```

### 2. Deep Link Flow

```
[Integrated App Login Page]
  ↓ User taps "Login with IDKitty"
  ↓ App opens deep link:
    idkitty://auth?
      challenge=a3f9c2...
      &tenantId=client_xxx
      &appName=PurrBank
      &callbackUrl=https://purrbank.io/auth/callback

[iOS/Android]
  ↓ Opens IDKitty app (or prompts install)
  ↓ useDeepLink hook parses URL params
  ↓ Navigates to ApproveScreen with parsed data

[IDKitty App — same as QR flow from ApproveScreen onward]
  ↓ On success: open callbackUrl with ?token=eyJ...&sessionId=sess_xxx
  ↓ Browser returns to PurrBank with JWT in query string

[PurrBank]
  ↓ Reads token from query string
  ↓ Verifies via GET /.well-known/jwks.json or backend validation
  ↓ User logged in
```

### 3. Push Notification Flow (Stretch Goal)

```
[Tenant Backend]
  ↓ User initiates login on web → tenant calls POST /api/auth/challenge/:did
  ↓ Backend enqueues FCM/APNs notification to device registered for this DID

[IDKitty Mobile App]
  ↓ Push notification arrives: "PurrBank wants to log you in — APPROVE or DENY"
  ↓ User taps notification → app opens to ApproveScreen
  ↓ Flow continues same as QR flow
```

---

## Deep Link URL Scheme

**`app.json` configuration:**
```json
{
  "expo": {
    "scheme": "idkitty",
    "intentFilters": [{
      "action": "VIEW",
      "data": [{ "scheme": "idkitty" }],
      "category": ["BROWSABLE", "DEFAULT"]
    }]
  }
}
```

**Supported deep link formats:**

| URL | Action |
|---|---|
| `idkitty://auth?challenge=X&tenantId=Y&appName=Z&appDomain=D&requestedAt=T&isVerified=1&callbackUrl=U` | Open ApproveScreen |
| `idkitty://identity/did:idkitty:...` | Open identity viewer for given DID |
| `idkitty://import?did=X` | Pre-fill ImportIdentityScreen |

---

## `hooks/useDeepLink.ts`

```ts
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';

export const useDeepLink = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      if (parsed.path === 'auth' && parsed.queryParams?.challenge) {
        navigation.navigate('Approve', {
          challenge:   String(parsed.queryParams.challenge),
          tenantId:    String(parsed.queryParams.tenantId),
          appName:     String(parsed.queryParams.appName ?? 'Unknown App'),
          appDomain:   String(parsed.queryParams.appDomain ?? ''),
          requestedAt: Number(parsed.queryParams.requestedAt ?? Date.now()),
          isVerified:  parsed.queryParams.isVerified === '1',
          callbackUrl: parsed.queryParams.callbackUrl
            ? String(parsed.queryParams.callbackUrl) : undefined,
        });
      }
    };

    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then(url => { if (url) handleUrl({ url }); });
    return () => sub.remove();
  }, [navigation]);
};
```

---

## Security Requirements

| Requirement | Implementation |
|---|---|
| Private key hardware-backed | `expo-secure-store` with `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` |
| Biometric required for signing | `requireAuthentication: true` on SecureStore read |
| Screen capture prevention | `expo-screen-capture` `preventScreenCapture()` on ApproveScreen and KeyDisplay |
| Jailbreak/root detection | `expo-device` `isRootedExperimentalAsync()` → show warning banner |
| No key transmission | Private key never sent over network — all signing on-device |
| JWT in memory only | Access token stored in Zustand (not MMKV/SecureStore) — cleared on app close |
| Certificate pinning (stretch) | Pin to `api.idkitty.io` cert hash in Axios interceptor |
| Timeout on approve screen | Auto-dismiss at challenge expiry (60s countdown) |
