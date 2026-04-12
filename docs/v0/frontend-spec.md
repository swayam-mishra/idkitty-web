# IDKitty — Frontend Spec

## Stack

| Layer     | Choice                          | Version  |
|-----------|---------------------------------|----------|
| Framework | React + Vite                    | 18.3.1 / 6.0.7 |
| Styling   | Tailwind CSS + custom CSS       | 3.4.17   |
| Web3      | ethers.js                       | 6.13.4   |
| Crypto    | Web Crypto API (browser built-in) | —      |
| Routing   | React Router DOM                | 6.28.0   |
| HTTP      | Axios                           | 1.7.9    |
| QR Code   | qrcode.react                    | 4.2.0    |
| Icons     | lucide-react                    | 0.469.0  |

---

## Design System — Light Pixel / Neobrutalism

### Core Philosophy

Hard shadows, thick borders, flat colors, zero gradients, zero border-radius. Light cream base instead of dark. Pixel art typography and sprite assets reinforce the retro-cat aesthetic. Every interaction has a physical feel — buttons shift, cards purr, and the logo blinks.

---

### Color Palette

```css
:root {
  --white:       #F5F3E7;   /* cream — page background, card backgrounds */
  --black:       #030404;   /* near-black — text, borders, shadows      */
  --grey:        #21242B;   /* muted/secondary text                      */
  --accent-blue: #25CFE6;   /* primary CTA, active states                */
  --success:     #5EC374;   /* success states, mint accents              */
  --error:       #E74B4A;   /* danger, error states                      */
  --bg-terminal: #030404;   /* terminal/code blocks (stays dark)         */
}
```

All shadows use `4px 4px 0px #030404` (flat black offset) on the light cream background. Colored shadows are used sparingly for specific states:
- `.btn-ghost-mint`: `4px 4px 0px #5EC374`

Global rule: `border-radius: 0 !important` — applied to all elements.

---

### Typography

```css
/* Loaded from Google Fonts in index.html */
font-family: 'JetBrains Mono', monospace;   /* headings, UI labels, buttons */
font-family: 'Pixelify Sans', sans-serif;   /* body text, cards, inputs     */
```

Note: CSS variable naming in `tailwind.config.js` is inverted from what you might expect:
- `--font-pixel` → maps to `'JetBrains Mono'` in the config
- `--font-mono`  → maps to `'Pixelify Sans'` in the config

The config also lists `Press Start 2P` and `VT323` as extensions but these are not used in any current component.

---

### Core UI Rules

```css
/* Card */
.card {
  border:     3px solid #030404;
  box-shadow: 4px 4px 0px #030404;
  background: #F5F3E7;
  padding:    1.5rem;
}
.card:hover { animation: purr 0.15s ease-in-out 3; }

/* Button base */
.btn {
  border:          3px solid #030404;
  box-shadow:      4px 4px 0px #030404;
  font-family:     'JetBrains Mono', monospace;
  font-weight:     800;
  font-size:       0.875rem;
  text-transform:  uppercase;
  letter-spacing:  0.04em;
  transition:      transform 0.08s ease, box-shadow 0.08s ease;
}
.btn:hover {
  transform:  translate(2px, 2px);
  box-shadow: 2px 2px 0px #030404;
}

/* Button variants */
.btn-primary  { background: #25CFE6; color: #030404; }
.btn-danger   { background: #E74B4A; color: #F5F3E7; }
.btn-ghost    { background: transparent; color: #030404; }

/* Input */
.input-field {
  border:      3px solid #030404;
  background:  #F5F3E7;
  font-family: 'Pixelify Sans', sans-serif;
}
.input-field:focus { box-shadow: 4px 4px 0px #25CFE6; }

/* Terminal / code block (dark island on a light page) */
.terminal {
  background:  #030404;
  color:       #F5F3E7;
  font-family: 'Pixelify Sans', sans-serif;
  box-shadow:  6px 6px 0px #21242B;
}
```

---

### Custom Cursors

PNG sprite files served from `public/`:

```css
*                                { cursor: url('/cursor.png') 8 8, auto; }
a, button, [role="button"]       { cursor: url('/cursor-hover.png') 8 8, pointer; }
*:active                         { cursor: url('/cursor-click.png') 8 8, auto; }

/* Disabled on the create page */
.page-create *                   { cursor: auto !important; }
```

Files in `public/`: `cursor.png`, `cursor-hover.png`, `cursor-click.png`, `cursor-original.png`.

---

## Folder Structure

```
IDkitty-web/
├── src/
│   ├── components/
│   │   ├── ChallengeModal.jsx     ← challenge display + countdown timer
│   │   ├── IdentityCard.jsx       ← two-panel card: dark avatar + cream DID/QR
│   │   ├── Loader.jsx             ← cycling terminal-style status messages
│   │   ├── NavBar.jsx             ← sticky nav, logo text scramble on scroll
│   │   ├── PixelCat.jsx           ← inline SVG pixel cat (multiple variants + exports)
│   │   ├── PixelCatLarge.jsx      ← 64×64 viewBox detailed cat face
│   │   ├── SafeImg.jsx            ← <img> with inline SVG fallback on error
│   │   └── StatusBadge.jsx        ← "● ACTIVE / PENDING / FAILED" badge
│   ├── pages/
│   │   ├── Landing.jsx            ← live stats + marquee strip + how-it-works
│   │   ├── CreateIdentity.jsx     ← 3-step identity creation wizard
│   │   ├── Dashboard.jsx          ← identity card + action buttons
│   │   ├── Login.jsx              ← challenge-based authentication flow
│   │   └── DemoService.jsx        ← "PurrBank" protected demo page
│   ├── services/
│   │   ├── crypto.js              ← Web Crypto API wrapper
│   │   └── api.js                 ← axios instance + all API calls
│   ├── store/
│   │   └── identity.store.js      ← localStorage (identity) + sessionStorage (JWT)
│   ├── styles/
│   │   └── animations.css         ← all keyframes
│   ├── assets/
│   │   └── pixel/                 ← logo.png, cat SVGs, cursor sprites, id-card-frame.svg
│   ├── App.jsx                    ← router setup
│   ├── index.css                  ← design tokens + global rules
│   └── main.jsx                   ← React entry point
├── public/
│   ├── cursor.png
│   ├── cursor-hover.png
│   ├── cursor-click.png
│   ├── cursor-original.png
│   ├── eyes-open.png
│   ├── eyes-close.png
│   └── pfp/                       ← 8 cat profile pictures (1.jpeg–8.jpeg)
├── index.html                     ← Google Fonts: JetBrains Mono + Pixelify Sans
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## Routes

| Path         | Component       | Notes                              |
|--------------|-----------------|------------------------------------|
| `/`          | `Landing`       | Public landing page                |
| `/create`    | `CreateIdentity`| 3-step wizard                      |
| `/dashboard` | `Dashboard`     | Redirects to `/create` if no identity |
| `/login`     | `Login`         | Challenge-based auth               |
| `/demo`      | `DemoService`   | Protected — redirects to `/login` if no JWT |

---

## Components

### `NavBar.jsx`

Sticky top navigation bar. Left: pixel `logo.png` + "IDKitty" text. Right: Login link.

**Logo text scramble on scroll:**
- On scroll past 40px: "ITTY" in "IDKITTY" scrambles right-to-left using chars `'0123456789ABCDEF@#$%'`, then disappears — logo collapses.
- On scroll back up: text re-expands with reverse scramble animation.
- Runs over ~12 frames at 60ms intervals per character.

---

### `PixelCat.jsx`

Inline SVG pixel-art cat component. Exports:

| Export | Description |
|---|---|
| `default PixelCat` | 16×16 viewBox static cat. Props: `variant` (`neutral` \| `happy` \| `angry` \| `blink`), `size`, `className`. |
| `PixelCatLoader` | Animated: alternates `neutral` ↔ `blink` at 500ms. Used as a loading indicator. |
| `PawIcon` | 16×16 pixel paw SVG. |
| `IdCardFrame` | 32×32 pixel corner bracket decorations for the ID card. |
| `EyesOnly` | 16×8 viewBox showing just the two eye rectangles. Props: `open` (bool). |

Eye color by variant: yellow (`neutral`, `blink`), mint (`happy`), pink (`angry`).

Note: `PixelCat` uses a dark internal palette (`#0a0a0a` body, `#f5f0e8` face) which renders well as a standalone icon against the light page background.

---

### `PixelCatLarge.jsx`

64×64 viewBox detailed pixel cat face, displayed at `size=96` by default. Features: 3-ring concentric eyes, inner ear markings, nose, pixel mouth, whiskers. Color scheme: cream face `#f5f0e8`, dark `#0a0a0a`, orange accent `#FF6B2B`. Used in larger display contexts.

---

### `SafeImg.jsx`

Drop-in `<img>` replacement. On `onError`, replaces the `src` with a base64-encoded inline SVG pixel cat — prevents broken image icons. Used in `IdentityCard` for the cat avatar panel.

---

### `IdentityCard.jsx`

Two-panel landscape card.

- **Left panel** (25% width, `#030404` background): random cat avatar loaded from `/pfp/1.jpeg`–`/pfp/8.jpeg` via `SafeImg`. Avatar is chosen randomly on mount with `useMemo`.
- **Right panel** (cream background): IDKITTY header + `StatusBadge`, DID string (truncated with ellipsis), optional name/email claims, footer with creation date and 80×80 QR code.
- Outer: `border: 3px solid #030404`, `box-shadow: 8px 8px 0px #030404`.
- QR encodes the DID string using `qrcode.react`.

---

### `ChallengeModal.jsx`

Shows the challenge string and handles signing.

- Displays challenge in a terminal-styled box.
- 60-second countdown timer (turns red at ≤10s).
- Password-masked private key input.
- Sign button disabled when: expired, empty key, or loading.
- Props: `challenge` (string), `onSign` (callback), `loading` (bool).

---

### `StatusBadge.jsx`

Status indicator badge. Statuses: `ACTIVE` (green/happy cat), `PENDING` (grey/neutral cat), `FAILED` (red/angry cat). The dot has a `pulse-dot` animation. Supports `inline` and `tile` display variants.

---

### `Loader.jsx`

Custom loader that cycles through status messages with a blinking cursor. Default messages: `"Connecting to Polygon"`, `"Broadcasting transaction"`, `"Awaiting confirmation"`. Eye blink via `PixelCatLoader`. No spinner — terminal aesthetic only.

---

## Pages

### `Landing.jsx`

**Live stats section** (fetched from backend):
- Calls `GET /api/stats` on mount and every 30 seconds via `setInterval`.
- Renders three stat cards: `totalIdentities` (cyan), `totalAuthentications` (green), `activeChallenges` (red).
- Shows `—` on fetch error.

**Marquee strip** (static copy, infinite scroll):
```
4.5B records breached in 2023  ·  0 passwords stored by IDKitty  ·
Your keys. Always.  ·  100% client-side key generation  ·
Polygon Amoy — immutable identity  ·  No server ever sees your private key
```
Two copies run in sequence via `marquee` CSS animation for seamless loop.

**How it works:** Three cards with step numbers and cyan/green/red accent colors.

**Footer:** Logo + project email + X/Twitter link + hackathon attribution (`HackOlympus` / `@swayyaam` & `@uutkarrsh`).

---

### `CreateIdentity.jsx`

3-step flow, no page reload. Step progress bar uses `.step-block` / `.step-block.active` / `.step-block.done`.

| Step | Content |
|---|---|
| 1 — GENERATE | Terminal-style display: DID (orange), public key (mint), masked private key with reveal/copy buttons. Warning banner about private key. |
| 2 — CLAIM | Optional name + email inputs. Can skip for anonymity. |
| 3 — ANCHOR | Status checklist: keypair generated ✓, claims packaged ✓, writing to Polygon ⟳, awaiting confirmation, identity anchored. Shows txHash + Polygonscan link on success. |

Calls `generateKeyPair()` → `registerIdentity()` API → `saveIdentity()` to localStorage.

---

### `Dashboard.jsx`

Displays `IdentityCard` with the loaded identity. Redirects to `/create` if no identity found in localStorage.

Action buttons:
- **TEST LOGIN** → navigates to `/login`
- **COPY DID** → copies to clipboard, button flashes "COPIED" for 1.5s
- **VIEW ON POLYGONSCAN** → opens Polygonscan link in new tab

Security callout: explains what is and isn't stored on the server.

---

### `Login.jsx`

1. User enters DID → clicks "Request Challenge"
2. Backend returns 60s challenge → displayed in terminal box with countdown
3. User inputs private key (masked, stays in browser)
4. Clicks "Sign & Authenticate" → `signChallenge()` → `POST /api/auth/verify`
5. Success: JWT saved to sessionStorage, result displayed
6. Failure: Error box shown with retry option

---

### `DemoService.jsx`

"PurrBank" authenticated demo page. Redirects immediately to `/login` if no JWT in sessionStorage.

Shows:
- Auth banner: `✓ AUTHENTICATED VIA CRYPTOGRAPHIC SIGNATURE`
- User's DID (from decoded JWT)
- Fake stat cards (balance, transactions, security score)
- Identity status tiles using `StatusBadge`
- Logout button → `clearJWT()` + redirect to `/`

---

## Crypto Service (`services/crypto.js`)

Client-side only. Uses `window.crypto.subtle`. Never sends private key to the backend.

```js
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,       // exportable
    ['sign', 'verify']
  );

  const pubKeyRaw  = await window.crypto.subtle.exportKey('raw',   keyPair.publicKey);
  const privKeyRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey:  bufferToHex(pubKeyRaw),
    privateKey: bufferToHex(privKeyRaw),  // pkcs8 encoded
    did: `did:idkitty:${bufferToHex(pubKeyRaw).slice(0, 20)}`
  };
};

export const signChallenge = async (challenge, privateKeyHex) => {
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    hexToBuffer(privateKeyHex),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(challenge)
  );
  return bufferToHex(signature);
};
```

DID format: `did:idkitty:` + first 20 characters of the hex-encoded uncompressed public key.

---

## Identity Store (`store/identity.store.js`)

```js
// Identity (keypair + claims) → localStorage  (persists across sessions)
saveIdentity(identity)
loadIdentity()
clearIdentity()

// JWT → sessionStorage  (cleared when tab closes)
saveJWT(token)
loadJWT()
clearJWT()
```

Identity object shape stored in localStorage:
```js
{
  did:        'did:idkitty:0x...',
  publicKey:  '04a9f2c3...',
  privateKey: '<pkcs8 hex>',        // stored client-side only, never sent to backend
  claims:     { name: '', email: '' },
  createdAt:  '<ISO8601>',
  txHash:     '<Polygon tx hash>',
}
```

---

## Animations (`styles/animations.css`)

| Keyframe / Class    | Purpose                                              |
|---------------------|------------------------------------------------------|
| `cat-blink`         | Logo left-eye blink (5s loop)                        |
| `.cat-eye-left`     | Applies `cat-blink` to the eye element               |
| `purr`              | Card hover shimmy — 1.5px left/right over 3 cycles   |
| `.card:hover`       | Triggers `purr 0.15s ease-in-out 3`                  |
| `bounce-in`         | Content entrance: scale 0.95 → 1.02 → 1             |
| `slide-up`          | Content entrance: translateY 20px → 0                |
| `float-paw`         | Background paw asset drift (`.bg-paw`, Landing only) |
| `cursor-blink`      | Terminal cursor `█` blink (`.terminal-cursor`)       |
| `spin`              | Lucide `Loader2` icon rotation (`.spin`)             |
| `cat-eyes-blink`    | 2-frame eye blink for `PixelCatLoader` (1s step-end) |
| `marquee`           | Stat strip infinite scroll (`.marquee-track`, 30s)   |
| `check-pop`         | Step-complete checkmark scale-in (`.check-pop`)      |
| `pulse-dot`         | Status badge dot opacity pulse (2s, 1→0.3→1)         |

---

## API Service (`services/api.js`)

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  headers: { 'Content-Type': 'application/json' },
});

// Exports
registerIdentity({ did, publicKey, claims })   → POST /api/identity/register
getIdentity(did)                               → GET  /api/identity/:did
getChallenge(did)                              → GET  /api/auth/challenge/:did
verifyAuth({ did, signature })                 → POST /api/auth/verify
getStats()                                     → GET  /api/stats
```

---

## Environment

```env
VITE_API_URL=http://localhost:5001
```

Set in `.env` at the `IDkitty-web/` root. Used by `services/api.js` as the backend base URL.
