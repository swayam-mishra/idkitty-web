# IDKitty — Frontend Spec

## Stack

| Layer | Choice |
|---|---|
| Framework | React + Vite |
| Styling | Tailwind CSS |
| Web3 | ethers.js (client-side, DID generation) |
| Crypto | Web Crypto API (built-in browser) |
| Routing | React Router v6 |
| HTTP | Axios |
| QR Code | qrcode.react |
| Icons | lucide-react |

---

## Design System — Vibrant Cat Neobrutalism

### Core Philosophy

Hard shadows, thick borders, flat colors, zero gradients, zero border-radius. **Neo-brutalism as the skeleton. Cat as the soul.** The rawness stays — but every sharp edge gets a whisker, every shadow gets warmth, and every interaction feels alive. Dark base, warm off-white, tabby orange as the dominant brand color.

Think: a cat sitting on a brutalist concrete slab. The concrete is cold and structural. The cat does not care. The cat is vibing.

---

### Color Palette

```css
:root {
  /* Base */
  --black: #0a0a0a;
  --white: #f5f0e8;          /* warm off-white — like old paper */

  /* Brand — tabby cat energy */
  --orange: #FF6B2B;         /* PRIMARY — tabby orange, brand color */
  --yellow: #FFE500;         /* cat-eye yellow — shadows, accents */
  --lavender: #C084FC;       /* secondary — cat toy purple */

  /* States */
  --mint: #00FF94;           /* success / active */
  --hot-pink: #FF2D78;       /* danger / warnings */
  --electric-blue: #0066FF;  /* info / links */

  /* Background */
  --bg: #0a0a0a;
  --bg-raised: #141414;      /* slightly lifted surfaces */
  --bg-terminal: #0d1117;    /* code/terminal blocks */
}
```

**Shadow palette** — shadows are how you express mood:
```css
--shadow-orange:  6px 6px 0px #FF6B2B;   /* default card — warm, brand */
--shadow-yellow:  6px 6px 0px #FFE500;   /* identity card — precious */
--shadow-pink:    4px 4px 0px #FF2D78;   /* danger buttons */
--shadow-lavender:4px 4px 0px #C084FC;   /* secondary buttons */
--shadow-mint:    4px 4px 0px #00FF94;   /* success states */
```

---

### Typography

```css
font-family: 'Space Grotesk', sans-serif;   /* headings, UI labels */
font-family: 'IBM Plex Mono', monospace;    /* DIDs, keys, terminal, code */
```

Import both from Google Fonts. Space Grotesk has a slight playfulness that fits — not too precious, not too corporate.

---

### Core UI Rules

```css
/* Neo-brutalist card */
border: 3px solid var(--white);
box-shadow: var(--shadow-orange);
border-radius: 0px;            /* zero rounding — always */
background: var(--bg-raised);

/* Button — primary */
border: 3px solid var(--white);
box-shadow: var(--shadow-pink);
background: var(--orange);
color: var(--black);
font-family: 'Space Grotesk', sans-serif;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.05em;
transition: all 0.08s ease;

/* Button hover — shadow collapses, element shifts, feels clicked */
button:hover {
  transform: translate(4px, 4px);
  box-shadow: 0px 0px 0px var(--hot-pink);
}

/* Input fields */
border: 3px solid var(--white);
background: var(--bg-terminal);
color: var(--white);
font-family: 'IBM Plex Mono', monospace;
outline: none;

input:focus {
  border-color: var(--orange);
  box-shadow: var(--shadow-orange);
}
```

---

### The IDKitty Logo (Build This First)

A pixel/blocky cat face — **left eye is a normal cat eye, right eye is a key icon**. Drawn in SVG. Takes 20 minutes. Makes every screen look instantly polished and ties the brand concept (identity + security + kitty) into one glyph.

```
   ████  ████        ← cat ears (tall rectangles)
  ██████████
 ████████████
 ██  ◆    🔑  ██     ← left eye = filled square (yellow), right eye = key icon (orange)
 ████  ▲  ████      ← nose = small triangle
  ██████████
   ══  ══  ══        ← whisker lines (thin horizontal)
```

**SVG spec — `CatLogo.jsx`:**
```jsx
// src/components/CatLogo.jsx
// All shapes are rectangles or polygons — no curves, pure neo-brutalist

const CatLogo = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {/* Left ear */}
    <rect x="4" y="2" width="10" height="14" fill="#f5f0e8" />
    {/* Right ear */}
    <rect x="34" y="2" width="10" height="14" fill="#f5f0e8" />
    {/* Face */}
    <rect x="2" y="12" width="44" height="32" fill="#0a0a0a" stroke="#f5f0e8" strokeWidth="3" />
    {/* Left eye — cat-eye yellow square */}
    <rect x="10" y="20" width="8" height="8" fill="#FFE500" />
    {/* Right eye — key icon (use lucide Key rendered as SVG path) */}
    <g transform="translate(28, 18)">
      <path
        d="M6 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 6a4 4 0 1 1 7.748 1.338L14 11.586V14h-2.5v-2H9v-2H7.414L6.338 8.748A4 4 0 0 1 2 6z"
        fill="#FF6B2B"
        transform="scale(0.85)"
      />
    </g>
    {/* Nose */}
    <polygon points="22,34 26,34 24,37" fill="#FF6B2B" />
    {/* Whiskers left */}
    <rect x="2" y="36" width="12" height="2" fill="#f5f0e8" opacity="0.5" />
    {/* Whiskers right */}
    <rect x="34" y="36" width="12" height="2" fill="#f5f0e8" opacity="0.5" />
  </svg>
);

export default CatLogo;
```

The logo blinks. The left eye (yellow square) fades out and back in every ~5 seconds:

```css
/* animations.css */
@keyframes cat-blink {
  0%, 92%, 100% { opacity: 1; transform: scaleY(1); }
  94%, 98%      { opacity: 0; transform: scaleY(0.1); }
}

.cat-eye-left {
  animation: cat-blink 5s ease-in-out infinite;
  transform-origin: center;
}
```

---

### Microinteractions — Making It Feel Alive

These are the details that make judges remember your project. All are low-effort, high-impact.

**1. Paw print cursor (optional but great)**
```css
/* index.css — apply globally */
* { cursor: url('/paw-cursor.svg') 8 8, auto; }
a, button { cursor: url('/paw-cursor-pointer.svg') 8 8, pointer; }
```
SVG paw cursor: a 24×24 SVG of a simple blocky paw print (4 toe beans + 1 big pad), white fill, black stroke.

**2. Card purr on hover**

On hover, cards do a 2-frame ultra-subtle horizontal shimmy — like a cat's purr vibrating the surface:

```css
@keyframes purr {
  0%, 100% { transform: translateX(0px); }
  25%      { transform: translateX(-1.5px); }
  75%      { transform: translateX(1.5px); }
}

.card:hover { animation: purr 0.15s ease-in-out 3; }
```

**3. Key generation bounce**

When the DID appears in the terminal box, it bounces in:

```css
@keyframes bounce-in {
  0%   { transform: scale(0.95); opacity: 0; }
  60%  { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1); }
}

.did-reveal { animation: bounce-in 0.35s ease-out forwards; }
```

**4. Floating paw background**

Landing page only: 6–8 paw SVGs at 4% opacity, randomly positioned, each slowly drifting up (`translateY`) on a long 20–30s animation loop. Pure CSS, no JS. Makes the background feel alive without distracting.

```css
@keyframes float-paw {
  0%   { transform: translateY(0px) rotate(var(--rot)); }
  100% { transform: translateY(-120vh) rotate(var(--rot)); }
}

.bg-paw { position: absolute; opacity: 0.04; animation: float-paw var(--dur) linear infinite; }
```

**5. Status badge pulse**

The `●` dot in `StatusBadge` pulses — a slow, breathing glow:

```css
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; }
  50%       { box-shadow: 0 0 0 6px transparent; }
}

.status-dot { animation: pulse-dot 2s ease-in-out infinite; }
```

**6. Terminal typing effect**

In `CreateIdentity.jsx` Step 1, lines appear one character at a time using a typewriter CSS animation. No library needed — just staggered `animation-delay` on each line.

---

### Cat-Themed Copy Rules

Keep it sharp. Don't over-cat it — one cat joke per screen max, always in the subtext, never in a heading.

| Context | Copy |
|---|---|
| Landing subtext | `"No passwords. No databases. No breaches. Just you and your keys."` |
| Private key warning | `"🙀 We never see your private key. Screenshot it. Write it down. Don't lose it."` |
| DID generated | `"Your identity is ready, curious one."` |
| Auth success | `"✓ AUTHENTICATED — No password. No collar. Just your keys."` |
| Auth fail | `"✗ Invalid signature. Even cats check their keys."` |
| Dashboard card label | `"IDKITTY"` |
| Demo service name | `"PurrBank — Secured by IDKitty"` |

---

## Folder Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── CatLogo.jsx          ← SVG logo, blink animation
│   │   ├── IdentityCard.jsx
│   │   ├── ChallengeModal.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── NavBar.jsx
│   │   └── Loader.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── CreateIdentity.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   └── DemoService.jsx
│   ├── services/
│   │   ├── crypto.js
│   │   └── api.js
│   ├── store/
│   │   └── identity.store.js
│   ├── styles/
│   │   └── animations.css       ← all cat keyframes live here
│   ├── App.jsx
│   └── main.jsx
├── public/
│   ├── paw-cursor.svg           ← custom cursor
│   └── paw-cursor-pointer.svg
├── index.html
└── tailwind.config.js
```

---

## Pages

### 1. `Landing.jsx`

The hook. Convinces in 5 seconds. Floating paw background is active only on this page.

```
[NAVBAR]
  Left:  [CatLogo] + "IDKitty" in Space Grotesk, bold
  Right: ["How it works"] — plain text link, underline on hover
  Nav border: 3px solid white, bottom only — like a shelf the cat sits on

[HERO — centered, full height]
  Giant heading (Space Grotesk, 96px, uppercase, tight leading):
    "YOUR IDENTITY.
     NO ONE ELSE'S."

  Subtext (IBM Plex Mono, 18px, --white 70% opacity):
    "No passwords. No databases. No breaches. Just you and your keys."

  [CREATE IDENTITY →]
    background: --orange
    shadow: 6px 6px 0px --yellow
    hover: shifts down-right, shadow collapses

  [LEARN HOW IT WORKS ↓]
    ghost button — border only, no fill
    shadow: 4px 4px 0px --lavender

[STAT STRIP — full width dark bar, 3px top+bottom border]
  "4.5B records breached in 2023"
  🐾
  "0 passwords stored"
  🐾
  "You own your keys. Always."

[HOW IT WORKS — 3 cards horizontal, equal width]
  Card 1:  "01"  Generate Keys
           "Your browser generates a keypair. We never touch the private key."
           shadow: --orange

  Card 2:  "02"  Anchor on Chain
           "Your public key gets written to Polygon. Immutable. Yours forever."
           shadow: --lavender

  Card 3:  "03"  Sign to Login
           "Prove you're you by signing a challenge. No password typed. Ever."
           shadow: --yellow

[FOOTER — minimal]
  Left: [CatLogo small] IDKitty
  Right: "Built at hackathon with love and caffeine"
```

---

### 2. `CreateIdentity.jsx`

The core onboarding flow. Single page, 3 steps, no page reload.

**Step progress bar** — 3 thick blocks at the top. Orange fill for completed, white border for upcoming. No text labels needed — the blocks speak.

```
[████████] [░░░░░░░░] [░░░░░░░░]   ← step 1 of 3
```

---

**Step 1 — GENERATE**

```
[TERMINAL BOX — bg: --bg-terminal, border: 3px white]
  (typewriter animation, lines appear one by one)

  > Initializing IDKitty vault...       ← yellow text
  > Generating ECDSA keypair (P-256)... ← white text
  > DID:         did:idkitty:0x1a2b3c... ← orange, bounce-in animation
  > Public Key:  04a9f2c3...             ← mint
  > Private Key: ████████████ [REVEAL] [COPY]   ← masked, hot-pink text

[WARNING BANNER — border: 3px --hot-pink, background: --hot-pink at 10% opacity]
  🙀 We never see your private key. Screenshot it. Write it down. Don't lose it.

[NEXT: CLAIM YOUR IDENTITY →] — orange bg, yellow shadow
```

---

**Step 2 — ADD CLAIMS** *(optional)*

```
Small label above: "OPTIONAL — skip if you want anonymity"

[Name input]   — thick border, mono font, orange focus glow
[Email input]  — thick border, mono font, orange focus glow

[REGISTER IDENTITY →]   ← orange button, yellow shadow
[SKIP →]                ← ghost button, lavender shadow
```

---

**Step 3 — ANCHORING**

```
[Status list — left-aligned, mono font]
  [✓] Keypair generated               ← mint check
  [✓] Claims packaged
  [⟳] Writing to Polygon Amoy...     ← spinning orange icon (lucide Loader2)
  [ ] Awaiting confirmation
  [ ] Identity anchored

→ On-chain confirmed:
  [✓] Identity anchored               ← all mint
  [TX: 0xabc123... → Polygonscan ↗]  ← clickable, orange underline

[GO TO DASHBOARD →]    ← orange bg, yellow shadow, bounce-in animation
```

---

### 3. `Dashboard.jsx`

Your identity, displayed like it matters.

```
[IDENTITY CARD — landscape, fixed ratio ~2.5:1, like a credit card]
  border: 3px solid --white
  box-shadow: 8px 8px 0px --yellow   ← most prominent shadow on the page

  Top row:
    Left:  [CatLogo small]  "IDKITTY"  (Space Grotesk, small, uppercase)
    Right: StatusBadge "● ACTIVE"  (mint)

  Center: DID in IBM Plex Mono, large, color --orange
    did:idkitty:0x1a2b3c...

  Claims row (if set):
    [Name icon] Swayam   [Mail icon] s@x.com

  Bottom row:
    Left:  "SINCE 2024-03-28"  — mono, small, white 50%
    Right: [QR CODE — 80x80, white on transparent]

  Cat whisker decoration: two thin horizontal lines (3px, white 15% opacity)
  extending left and right from just below the DID — like whiskers on the card


[ACTION ROW — horizontal, gap between]
  [TEST LOGIN]            — orange bg, pink shadow
  [COPY DID]              — ghost, lavender shadow    → copies to clipboard, button text flashes "COPIED 🐾" for 1.5s
  [VIEW ON POLYGONSCAN ↗] — ghost, yellow shadow

[SECURITY CALLOUT — border: 3px --hot-pink, bg: --hot-pink at 8% opacity]
  "Your private key lives only in your browser.
   This server stores: your DID, your public key.
   That's it. We couldn't leak your secrets even if we tried."
```

---

### 4. `Login.jsx`

Prove you're you. No password involved.

```
[PAGE LABEL — small, mono, orange]
  "CRYPTOGRAPHIC LOGIN — POWERED BY IDKITTY"

[DID INPUT]
  label: "YOUR DID"
  placeholder: "did:idkitty:0x..."
  border: 3px white, mono font, orange focus

[REQUEST CHALLENGE →]   ← orange, yellow shadow

→ Challenge box appears (bounce-in):
  [TERMINAL BOX]
    > Challenge issued:
    > a3f9c2...7b1d                       ← mono, yellow, selectable
    > "Sign this string with your private key."
    > Expires in: 60s                     ← countdown, turns pink below 10s

[PRIVATE KEY INPUT — password type]
  label: "YOUR PRIVATE KEY"
  warning below: "Stays in your browser. Never sent."

[SIGN & AUTHENTICATE →]   ← orange, pink shadow

→ Success state (slide-in from bottom):
  [BOX — border: --mint, bg: --mint at 10%]
    ✓ AUTHENTICATED
    "No password. No collar. Just your keys."
    JWT: eyJhbGci... [truncated]  [COPY]

→ Fail state:
  [BOX — border: --hot-pink, bg: --hot-pink at 10%]
    ✗ INVALID SIGNATURE
    "Even cats check their keys."
```

---

### 5. `DemoService.jsx`

A fake app that requires IDKitty login. Makes the demo tangible and gives judges something to click.

```
[If no JWT → redirect to Login.jsx immediately]

[Once authenticated:]

[TOP BAR — full width, bg: --bg-raised, border-bottom: 3px white]
  Left:  "🏦 PURRBANK" in Space Grotesk, bold
  Right: "Secured by [CatLogo small] IDKitty" — orange text

[HERO AUTH BANNER — green, prominent]
  border: 3px --mint, bg: --mint at 10%
  ✓ AUTHENTICATED VIA CRYPTOGRAPHIC SIGNATURE
  "No password stored. No session cookie. Just math."

[USER PANEL — card with --yellow shadow]
  "Logged in as:"
  did:idkitty:0x1a2b3c...       ← mono, orange
  "Identity verified on Polygon Amoy"

[FAKE DASHBOARD CONTENT — makes it look like a real app]
  3 dummy stat cards (balance, transactions, etc.)
  Data is hardcoded/fake — just needs to look real enough for a demo
  Use --lavender and --orange shadows on cards to keep the energy up

[LOG OUT] — ghost button, pink shadow → clears JWT, redirects to Landing
```

---

## Crypto Service (client-side)

```js
// services/crypto.js

export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const pubKeyRaw = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privKeyRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: bufferToHex(pubKeyRaw),
    privateKey: bufferToHex(privKeyRaw),
    did: `did:idkitty:${bufferToHex(pubKeyRaw).slice(0, 20)}`
  };
};

export const signChallenge = async (challenge, privateKeyHex) => {
  const keyBuffer = hexToBuffer(privateKeyHex);
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8', keyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(challenge)
  );

  return bufferToHex(signature);
};

const bufferToHex = buf => Array.from(new Uint8Array(buf))
  .map(b => b.toString(16).padStart(2, '0')).join('');

const hexToBuffer = hex => new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16))).buffer;
```

---

## Identity Store

```js
// store/identity.store.js

export const saveIdentity = (identity) => {
  localStorage.setItem('idkitty_identity', JSON.stringify(identity));
};

export const loadIdentity = () => {
  const raw = localStorage.getItem('idkitty_identity');
  return raw ? JSON.parse(raw) : null;
};

export const clearIdentity = () => localStorage.removeItem('idkitty_identity');
```

---

## Component Visual Specs

### `StatusBadge`

```jsx
// "● ACTIVE" mint  |  "● PENDING" yellow  |  "● FAILED" hot-pink
// The dot has a slow pulse animation (pulse-dot keyframe)
<span className="status-badge" data-status={status}>
  <span className="status-dot">●</span> {status}
</span>
```

### `Loader`

Not a spinner. A terminal-style cycling text with the typewriter effect:

```
> Connecting to Polygon...
> Broadcasting transaction...
> Awaiting confirmation...
```

Each line cycles with `setInterval`. IBM Plex Mono, orange text, on `--bg-terminal`. A blinking cursor `█` sits at the end of the current line.

### `IdentityCard`

Landscape, fixed `aspect-ratio: 2.5 / 1`, thick border, `--yellow` shadow at 8px offset. The whisker decorations (two thin lines flanking the DID) are `::before` and `::after` pseudo-elements — no extra DOM nodes. QR code bottom right. Print-worthy — the design should look good if someone screenshots it.

### `CatLogo`

The SVG logo. Accepts a `size` prop. Renders inline — no img tag. The left eye rectangle has `className="cat-eye-left"` for the blink CSS animation. Used in Navbar, Dashboard card, DemoService header, and Footer.

---

## Animations Reference (`styles/animations.css`)

```css
/* Logo blink */
@keyframes cat-blink {
  0%, 92%, 100% { opacity: 1; transform: scaleY(1); }
  94%, 98%      { opacity: 0; transform: scaleY(0.05); }
}
.cat-eye-left { animation: cat-blink 5s ease-in-out infinite; transform-origin: center; }

/* Card purr on hover */
@keyframes purr {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-1.5px); }
  75%      { transform: translateX(1.5px); }
}
.card:hover { animation: purr 0.15s ease-in-out 3; }

/* Content bounce-in */
@keyframes bounce-in {
  0%   { transform: scale(0.95); opacity: 0; }
  60%  { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.bounce-in { animation: bounce-in 0.3s ease-out forwards; }

/* Status dot pulse */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
.status-dot { animation: pulse-dot 2s ease-in-out infinite; }

/* Floating background paws (Landing only) */
@keyframes float-paw {
  0%   { transform: translateY(0) rotate(var(--rot)); opacity: 0; }
  10%  { opacity: 0.04; }
  90%  { opacity: 0.04; }
  100% { transform: translateY(-110vh) rotate(var(--rot)); opacity: 0; }
}
.bg-paw { position: fixed; pointer-events: none; animation: float-paw var(--dur) linear infinite; }

/* Typewriter cursor blink */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}
.terminal-cursor { animation: cursor-blink 0.8s step-end infinite; }
```

---

## Build Order

| Step | Task | Time |
|---|---|---|
| 1 | Vite setup + Tailwind + Google Fonts | 20 min |
| 2 | `animations.css` + design tokens in `index.css` | 20 min |
| 3 | `CatLogo.jsx` — SVG + blink animation | 20 min |
| 4 | `NavBar.jsx` + global button/card styles | 20 min |
| 5 | `Landing.jsx` — hero, stat strip, how-it-works cards, floating paws | 45 min |
| 6 | `crypto.js` service | 30 min |
| 7 | `CreateIdentity.jsx` — 3-step flow + typewriter terminal | 50 min |
| 8 | `Dashboard.jsx` + `IdentityCard` + `StatusBadge` | 40 min |
| 9 | `Login.jsx` + `ChallengeModal` + countdown timer | 40 min |
| 10 | `DemoService.jsx` (PurrBank, protected route) | 20 min |
| 11 | Wire axios to backend, test full flow | 30 min |
| | **Total** | **~5.5 hours** |
