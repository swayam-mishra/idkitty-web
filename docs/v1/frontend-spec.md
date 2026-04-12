# IDKitty v1 — Frontend Spec

> Builds directly on the v0 React + Vite codebase. Same stack, same design system. No framework migration. All changes are additive.

---

## Stack (unchanged from v0)

| Layer | Choice | Version |
|---|---|---|
| Framework | React + Vite | 18.3.1 / 6.0.7 |
| Styling | Tailwind CSS + custom CSS | 3.4.17 |
| Routing | React Router DOM | 6.28.0 |
| HTTP | Axios | 1.7.9 |
| Crypto | Web Crypto API (browser built-in) | — |
| QR Code | qrcode.react | 4.2.0 |
| Icons | lucide-react | 0.469.0 |

**New dependencies:**
- `aes-js` or `@noble/ciphers` — for AES-256-GCM keystore encryption in the backup flow (optional, see Create wizard step 3)

---

## Design System (unchanged)

Same neobrutalism system as v0:
- Cream/black palette (`--white: #F5F3E7`, `--black: #030404`)
- `4px 4px 0px #030404` flat shadows
- `border-radius: 0 !important` globally
- JetBrains Mono (headings/buttons) + Pixelify Sans (body)
- All button labels uppercase

The only additions are new event badge colors for the audit log and a green availability indicator for username checking:
```css
/* Audit log event badge colors */
.badge-auth-success   { background: #5EC374; color: #030404; }
.badge-auth-failed    { background: #E74B4A; color: #F5F3E7; }
.badge-registered     { background: #25CFE6; color: #030404; }
.badge-key-rotated    { background: #F5A623; color: #030404; }
.badge-session-revoked { background: #21242B; color: #F5F3E7; }
.badge-identity-revoked { background: #E74B4A; color: #F5F3E7; font-weight: 800; }
.badge-username-claimed { background: #5EC374; color: #030404; }
.badge-username-changed { background: #F5A623; color: #030404; }

/* Username availability indicator */
.username-available { color: #5EC374; }
.username-taken     { color: #E74B4A; }
.username-checking  { color: #21242B; }
```

---

## Routes

| Path | Component | Auth Required |
|---|---|---|
| `/` | `Landing` | No |
| `/create` | `CreateIdentity` | No |
| `/dashboard` | `Dashboard` | Identity in localStorage |
| `/login` | `Login` | No |
| `/demo` | `DemoService` | JWT in sessionStorage |
| `/audit` | `AuditLog` | JWT in sessionStorage |

New route: `/audit`

---

## Store Changes (`store/identity.store.js`)

Add refresh token storage to the existing store:

```js
// Refresh token → localStorage (long-lived)
saveRefreshToken(token)
loadRefreshToken()
clearRefreshToken()

// Access token (short-lived) → sessionStorage (unchanged, was "JWT")
saveAccessToken(token)     // rename from saveJWT
loadAccessToken()          // rename from loadJWT
clearAccessToken()         // rename from clearJWT

// Keep old names as aliases for backwards compatibility
saveJWT = saveAccessToken
loadJWT = loadAccessToken
clearJWT = clearAccessToken
```

Add username to stored identity object:
```js
{
  did:        'did:idkitty:0x...',
  publicKey:  '04a9f2c3...',
  privateKey: '<pkcs8 hex>',
  username:   'alice',           // NEW — null if not claimed
  claims:     { name: '', email: '' },
  createdAt:  '<ISO8601>',
  txHash:     '<Polygon tx hash>',
}
```

---

## API Service Changes (`services/api.js`)

Add new API calls:

```js
// Auth
verifyAuth({ did, signature })
  → POST /api/auth/verify
  → Now returns { accessToken, refreshToken, expiresIn, did }

refreshToken({ did, refreshToken })
  → POST /api/auth/refresh
  → Returns { accessToken, expiresIn }

revokeSession({ refreshToken })
  → POST /api/auth/revoke-session  (Authorization: Bearer <accessToken>)

// Username
checkUsernameAvailable(username)
  → GET /api/identity/username/:username/available

claimUsername({ did, username }, accessToken)
  → POST /api/identity/:did/username  (Authorization: Bearer <accessToken>)

resolveUsername(username)
  → GET /api/identity/username/:username

// Key rotation
rotateKey({ did, newPublicKey }, accessToken)
  → POST /api/identity/:did/rotate-key  (Authorization: Bearer <accessToken>)

// Revocation
revokeIdentity(did, accessToken)
  → POST /api/identity/:did/revoke  (Authorization: Bearer <accessToken>)

// Audit log
getAuditLog({ did, page, event }, accessToken)
  → GET /api/identity/:did/audit?page=&limit=25&event=  (Authorization: Bearer <accessToken>)

// JWKS (for PurrBank demo)
getJWKS()
  → GET /.well-known/jwks.json
```

---

## Crypto Service Changes (`services/crypto.js`)

Add keystore encryption for the backup file:

```js
// Generate an encrypted keystore file (AES-256-GCM + PBKDF2)
export const encryptKeystore = async (privateKeyHex, password) => {
  // PBKDF2 → 32-byte AES key
  // AES-256-GCM encrypt the private key hex
  // Return { ciphertext, iv, salt } as a JSON blob
  // Caller downloads as idkitty-backup-<did-prefix>.json
};

export const decryptKeystore = async (keystoreJson, password) => {
  // Reverse of above — returns raw privateKeyHex
};
```

These functions use only `window.crypto.subtle` (no external library needed):
- Key derivation: `PBKDF2` with SHA-256, 200,000 iterations
- Encryption: `AES-GCM` with a random 12-byte IV and 16-byte salt

---

## New Component: `ConfirmModal.jsx`

Reusable modal for destructive actions. Used by key rotation and identity revocation.

**Props:**
```js
{
  title:         String,   // e.g. "ROTATE KEY"
  message:       String,   // explanatory text
  confirmText:   String,   // text the user must type to confirm (e.g. "ROTATE")
  onConfirm:     Function,
  onCancel:      Function,
  loading:       Boolean,
  danger:        Boolean,  // if true, confirm button is .btn-danger
}
```

**Behavior:**
- Input field with placeholder `Type "${confirmText}" to confirm`
- Confirm button disabled until typed value exactly matches `confirmText`
- On confirm: calls `onConfirm()`, shows inline loader, closes on success

---

## New Component: `AuditEventBadge.jsx`

Maps an audit event string to a colored badge.

```js
// Event → badge label + CSS class
{
  AUTH_SUCCESS:     ['AUTH OK',   'badge-auth-success'],
  AUTH_FAILED:      ['AUTH FAIL', 'badge-auth-failed'],
  REGISTERED:       ['REGISTERED','badge-registered'],
  KEY_ROTATED:      ['KEY ROTATED','badge-key-rotated'],
  SESSION_REVOKED:  ['SESSION END','badge-session-revoked'],
  IDENTITY_REVOKED: ['REVOKED',   'badge-identity-revoked'],
  USERNAME_CLAIMED: ['USERNAME',  'badge-username-claimed'],
  USERNAME_CHANGED: ['USERNAME',  'badge-username-changed'],
}
```

---

## New Component: `UsernameInput.jsx`

Username input field with real-time availability check.

**Behavior:**
- `@` prefix adornment (non-editable)
- Debounced availability check: 400ms after last keystroke
- State indicator inline with the input:
  - Typing: grey `checking...`
  - Available: green `✓ available`
  - Taken: red `✗ taken`
  - Reserved: red `✗ reserved`
  - Invalid format: red `✗ 3–20 chars, letters, numbers, underscores only`
- Calls `checkUsernameAvailable(value)` from api.js

**Props:** `value`, `onChange`, `onValidityChange`

---

## Modified Page: `CreateIdentity.jsx`

The existing 3-step wizard gains a **Step 2.5 — USERNAME** between claims and anchoring.

### Step Structure

| Step | Label | Content |
|---|---|---|
| 1 | GENERATE | Unchanged from v0 |
| 2 | CLAIMS | Unchanged from v0 |
| **2.5** | **USERNAME** | `UsernameInput` component; `[SKIP FOR NOW]` link |
| 3 | SAVE | Backup file download (replaces v0's direct registration) |
| 4 | ANCHOR | Unchanged from v0 (registration + blockchain) |

### Step 2.5 — USERNAME

- `UsernameInput` with availability check
- `[CONTINUE]` button — enabled only when availability is confirmed or no username entered
- `[SKIP FOR NOW]` text link — advances to Step 3 with no username

### Step 3 — SAVE (modified)

v0 went straight to registration after claims. v1 adds a save step before registration so the user has their key backup before the network call.

Two export options (only one required before continuing):

**Option A — DOWNLOAD BACKUP FILE (primary)**
- Password input with strength indicator (weak/ok/strong based on length + entropy)
- `[DOWNLOAD BACKUP]` button → calls `encryptKeystore(privateKey, password)` → downloads `idkitty-backup-<did-prefix>.json`
- On download success: shows `✓ Backup downloaded` and enables `[CONTINUE]`

**Option B — SHOW RAW KEY (advanced)**
- Text link: `Show raw key instead →`
- Opens `ConfirmModal` with message: *"Your raw private key will be shown. Anyone with this key can sign as you. Only use this if you know what you're doing."* Confirm word: `SHOW`
- On confirm: reveals key in a `.terminal` block with a persistent red warning banner
- `[CONTINUE]` is enabled immediately after acknowledgement

After export, Step 3 shows `[CONTINUE →]` button that advances to Step 4 (ANCHOR/registration).

### Step 4 — ANCHOR (unchanged logic, renumbered)

Same as v0 Step 3. After anchoring completes:
- If username was chosen in Step 2.5: call `POST /api/identity/:did/username` with the stored access token
- Save username to localStorage identity store

---

## Modified Page: `Login.jsx`

The auth flow is expanded to handle both tokens and to show new error states.

### Flow Changes

1. Same challenge-request and signing flow as v0
2. On `POST /api/auth/verify` success:
   - Save `accessToken` to sessionStorage (was: `saveJWT`)
   - Save `refreshToken` to localStorage (new)
   - Save `username` (from decoded JWT claims or identity lookup) to store
3. On `POST /api/auth/verify` failure:
   - New error state: if response is 410 → show `IDENTITY REVOKED` error with distinct styling

### New copy below sign button

```
"Your signing key never leaves your browser."
```

### Inline error states

| Error | Display |
|---|---|
| Identity not found (404) | `DID NOT FOUND` in red |
| Invalid signature (401) | `AUTHENTICATION FAILED — wrong key or expired challenge` |
| Identity revoked (410) | `IDENTITY REVOKED — this identity can no longer authenticate` (red border, bold) |
| Challenge expired | `CHALLENGE EXPIRED — request a new one` |

---

## Modified Page: `Dashboard.jsx`

The dashboard gains three new sections below the identity card: **Key Rotation**, **Recent Activity**, and **Danger Zone**.

### Identity Card Updates

The `IdentityCard` component receives two new optional props:
- `username` — displayed as `@alice` below the DID string (if set)
- `keyVersion` — displayed as `KEY V2` badge in the top-right corner of the right panel

### New Section: Key Rotation

```
┌─────────────────────────────────────────────────────┐
│ SIGNING KEY                                          │
│ Current key: 04a9f2c3...ab12 (truncated, 12 chars)  │
│ Key version: V1                                      │
│                                                      │
│ [ROTATE KEY]                                         │
└─────────────────────────────────────────────────────┘
```

`[ROTATE KEY]` button flow:
1. Opens a page-level instruction: "Generate a new keypair or paste an existing public key"
2. Calls `generateKeyPair()` in browser → shows new public key + new private key
3. Asks user to save new private key (same backup flow as Step 3 of creation wizard)
4. On confirm: calls `POST /api/identity/:did/rotate-key` with new public key + current access token
5. Success: updates localStorage identity with new keys, shows `KEY ROTATED ✓`, refreshes page
6. Warning shown: *"Your current sessions will be invalidated. You must log in again."*

This is a multi-step flow that can be implemented as an in-page wizard or a `ConfirmModal` chain. Recommended: a 3-panel inline wizard below the Key Rotation section header.

### New Section: Recent Activity

Small table showing the last 5 audit events, fetched from `GET /api/identity/:did/audit?limit=5`.

```
┌──────────────────────────────────────────────────────┐
│ RECENT ACTIVITY                      [VIEW ALL →]    │
│                                                      │
│ Timestamp           Event         IP                 │
│ 2024-01-01 12:00    AUTH OK       1.2.3.4            │
│ 2024-01-01 11:30    AUTH OK       1.2.3.4            │
│ 2024-01-01 10:00    REGISTERED    5.6.7.8            │
└──────────────────────────────────────────────────────┘
```

Timestamp column: `toLocaleString()` truncated to date + time.
Event column: `AuditEventBadge` component.
`[VIEW ALL →]` link navigates to `/audit`.

If no access token in sessionStorage: show a muted message — *"Log in to view your activity."*

### New Section: Danger Zone

```
┌──────────────────────────────────────────────────────┐
│ DANGER ZONE                                          │
│                                                      │
│ REVOKE IDENTITY                                      │
│ Permanently revoke this identity. All sessions       │
│ will be invalidated and authentication will be       │
│ blocked. This cannot be undone.                      │
│                                                      │
│ [REVOKE IDENTITY]  (btn-danger)                      │
└──────────────────────────────────────────────────────┘
```

`[REVOKE IDENTITY]` opens a `ConfirmModal` with:
- `title`: "REVOKE IDENTITY"
- `message`: "This will permanently disable authentication for this identity. You will not be able to log in again."
- `confirmText`: "REVOKE"

On confirm: calls `POST /api/identity/:did/revoke` with access token. On success: clears localStorage and sessionStorage, redirects to `/`.

---

## New Page: `AuditLog.jsx`

Full-page paginated audit log. Route: `/audit`.

Requires access token in sessionStorage (redirect to `/login` if missing).

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ NavBar                                                   │
├─────────────────────────────────────────────────────────┤
│ AUDIT LOG                                               │
│ @alice · did:idkitty:0x1a2b3c...                        │
│                                                         │
│ [ All Events ▼ ]   [ Clear filter ]                     │
│                                                         │
│ Timestamp           Event           IP        Details   │
│ ─────────────────────────────────────────────────────   │
│ 2024-01-01 12:00    [AUTH OK]       1.2.3.4   —         │
│ 2024-01-01 11:30    [AUTH FAIL]     1.2.3.4   wrong key │
│ 2024-01-01 10:00    [REGISTERED]    5.6.7.8   —         │
│                                                         │
│ ← Prev   Page 1 of 4   Next →                          │
└─────────────────────────────────────────────────────────┘
```

### Filter Bar

- Event type dropdown: All / AUTH_SUCCESS / AUTH_FAILED / KEY_ROTATED / REGISTERED / USERNAME_* / IDENTITY_REVOKED / SESSION_REVOKED
- `[CLEAR FILTER]` text button

Filter state is reflected in the API call as `?event=AUTH_SUCCESS`.

### Table

| Column | Content |
|---|---|
| Timestamp | `new Date(ts).toLocaleString()` |
| Event | `AuditEventBadge` component |
| IP | Raw IP string |
| Details | `metadata.reason` or `metadata.newUsername` if present; else `—` |

### Pagination

- 25 rows per page (matches backend default)
- `← PREV` / `NEXT →` buttons
- `Page N of M` display
- Fetched via `getAuditLog({ did, page, event })` from api.js

### Loading states

- On first load: `Loader` component (terminal-style cycling messages)
- On page change: skeleton rows (empty `<tr>` with animated opacity pulse)

---

## Modified Page: `DemoService.jsx` (PurrBank)

PurrBank now verifies JWTs locally using the JWKS endpoint instead of trusting the token blindly.

### JWKS Verification

```js
// services/jwks.js (new file)

let cachedKey = null;
let cachedKid = null;

export const verifyTokenLocally = async (accessToken) => {
  const header = JSON.parse(atob(accessToken.split('.')[0]));

  if (!cachedKey || cachedKid !== header.kid) {
    const { keys } = await getJWKS();  // from api.js
    const jwk = keys.find(k => k.kid === header.kid);
    cachedKey = await crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['verify']
    );
    cachedKid = header.kid;
  }

  // Verify signature
  const [headerB64, payloadB64, sigB64] = accessToken.split('.');
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = base64urlToBuffer(sigB64);

  const valid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    cachedKey, sig, data
  );

  if (!valid) throw new Error('Invalid token signature');

  const payload = JSON.parse(atob(payloadB64));
  if (payload.exp < Date.now() / 1000) throw new Error('Token expired');
  return payload;
};
```

On mount: `DemoService` calls `verifyTokenLocally(accessToken)` instead of trusting the token from sessionStorage. If verification fails, redirect to `/login`.

This demonstrates the JWKS model: PurrBank never calls IDKitty's backend to authenticate — it verifies the signature itself.

A small badge is shown on the PurrBank page:
```
┌─────────────────────────────────────┐
│ ✓ Verified via JWKS — no IDKitty   │
│   server call needed                │
└─────────────────────────────────────┘
```

---

## Implementation Checklist

### Store & API
- [ ] Add `saveRefreshToken`, `loadRefreshToken`, `clearRefreshToken` to identity store
- [ ] Update `saveJWT`/`loadJWT` aliases → `saveAccessToken`/`loadAccessToken`
- [ ] Add `username` field to localStorage identity shape
- [ ] Add all new API calls to `services/api.js`
- [ ] Create `services/jwks.js` with `verifyTokenLocally`

### New Components
- [ ] `ConfirmModal.jsx` — destructive action confirmation with typed input
- [ ] `AuditEventBadge.jsx` — event → badge label + color
- [ ] `UsernameInput.jsx` — debounced availability check

### Crypto Service
- [ ] Add `encryptKeystore(privateKeyHex, password)` → JSON keystore blob
- [ ] Add `decryptKeystore(keystoreJson, password)` → privateKeyHex

### CreateIdentity Wizard
- [ ] Add Step 2.5 (USERNAME) between claims and registration
- [ ] Add Step 3 (SAVE) with backup download option and raw key reveal option
- [ ] Renumber old Step 3 (ANCHOR) to Step 4
- [ ] After anchoring: if username chosen, call `claimUsername` API
- [ ] Update step indicator (1 / 2 / 3 / 4 or 1 / 2 / 2.5 / 3)

### Login
- [ ] Store `refreshToken` to localStorage after successful auth
- [ ] Handle 410 revoked identity error state
- [ ] Add "Your signing key never leaves your browser." copy

### Dashboard
- [ ] Update `IdentityCard` — show `@username` and `keyVersion`
- [ ] Add Key Rotation section with 3-panel inline wizard
- [ ] Add Recent Activity table (last 5 events via audit API)
- [ ] Add Danger Zone section with revoke flow

### New Page
- [ ] `AuditLog.jsx` — full paginated table with filter bar
- [ ] Add `/audit` route in `App.jsx`

### DemoService
- [ ] Add `services/jwks.js`
- [ ] Replace trust-by-presence with `verifyTokenLocally()` on mount
- [ ] Show "Verified via JWKS" badge on page
