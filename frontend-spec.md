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

## Neo-Brutalism Design System

### Core Philosophy

Hard shadows, thick borders, flat colors, zero gradients, intentional rawness. Looks "broken by design" but in a confident way.

### Color Palette

```css
:root {
  --black: #0a0a0a;
  --white: #f5f0e8;        /* off-white, not pure */
  --yellow: #FFE500;       /* primary accent */
  --electric-blue: #0066FF;
  --hot-pink: #FF2D78;
  --mint: #00FF94;
  --bg: #0a0a0a;           /* dark base */
}
```

### Typography

```css
font-family: 'Space Grotesk', sans-serif;   /* headings */
font-family: 'IBM Plex Mono', monospace;    /* DIDs, keys, code */
```

Import both from Google Fonts.

### Core UI Rules

```css
/* Neo-brutalist card */
border: 3px solid #f5f0e8;
box-shadow: 6px 6px 0px #FFE500;   /* hard offset shadow, no blur */
border-radius: 0px;                 /* no rounding */
background: #0a0a0a;

/* Button */
border: 3px solid #f5f0e8;
box-shadow: 4px 4px 0px #FF2D78;
transition: all 0.1s;

/* Button hover — shadow collapses, element shifts */
button:hover {
  transform: translate(4px, 4px);
  box-shadow: 0px 0px 0px #FF2D78;
}
```

> Every interactive element shifts on hover. Shadow collapses. Feels tactile.

---

## Folder Structure

```
frontend/
├── src/
│   ├── components/
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
│   ├── App.jsx
│   └── main.jsx
├── index.html
└── tailwind.config.js
```

---

## Pages

### 1. `Landing.jsx`

The hook. Convinces in 5 seconds.

```
[NAVBAR — IDKitty logo left, "How it works" right]

[HERO]
Giant heading: "YOUR IDENTITY.
NO ONE ELSE'S."
Subtext: "No passwords. No databases. No breaches."
[CREATE IDENTITY →] button  — yellow, hard pink shadow

[STAT STRIP]  — dark bar across full width
"4.5B records breached in 2023"  |  "0 passwords stored"  |  "You own your keys"

[HOW IT WORKS — 3 cards horizontal]
1. Generate Keys    2. Anchor on Chain    3. Sign to Login
each card: thick border, offset yellow shadow, mono icon/number
```

---

### 2. `CreateIdentity.jsx`

The core onboarding flow. Single page, step-by-step. 3 steps, no page reload.

**Step 1 — GENERATE**
```
[Big terminal-style box]
> Generating keypair...
> DID: did:idkitty:0x1a2b3c...
> Public Key: 04a9f2...
> Private Key: ██████ [REVEAL] [COPY]

Warning banner (hot pink): "We never see your private key. Save it now."
[NEXT →]
```

**Step 2 — ADD CLAIMS** *(optional)*
```
Name field, Email field
Mono font inputs, thick borders
[REGISTER IDENTITY →]
```

**Step 3 — ANCHORING**
```
Animated status:
[✓] Keypair generated
[⟳] Writing to Polygon...
[✓] On-chain confirmed
[TX: 0xabc... → Polygonscan ↗]
[GO TO DASHBOARD →]
```

---

### 3. `Dashboard.jsx`

Identity card + stats. The "home" after onboarding.

```
[IDENTITY CARD — full width, bordered box]
  Top-left: "IDKITTY"  Top-right: StatusBadge "● ACTIVE" (mint green)
  Center: DID in mono font, large
  Claims: Name, Email
  Bottom-left: Created date    Bottom-right: [QR CODE]
  Shadow: 8px 8px 0px #FFE500

[ACTION ROW below card]
[TEST LOGIN]   [COPY DID]   [VIEW ON POLYGONSCAN ↗]
each: small brutalist buttons, different shadow colors

[SECURITY CALLOUT — pink bordered box]
"Your private key lives only in your browser.
This server stores: your DID, your public key.
That's it."
```

---

### 4. `Login.jsx`

Simulates logging into a service using IDKitty.

```
[Enter your DID]
input field, mono font, thick border

[REQUEST CHALLENGE →]

→ Shows challenge string in terminal box:
  "CHALLENGE: a3f9c2...7b1d"
  "Sign this with your private key to authenticate"

[Private Key input — password type]
[SIGN & LOGIN →]

→ Success state:
  Mint green box: "✓ AUTHENTICATED"
  "Signature verified. No password used."
  JWT token shown (truncated)

→ Fail state:
  Pink box: "✗ INVALID SIGNATURE"
```

---

### 5. `DemoService.jsx`

A fake "app" that requires IDKitty login — makes the demo tangible.

- Looks like a fake dashboard: `"Welcome to VaultBank"`
- Protected route — redirects to `Login.jsx` if no JWT
- Once logged in: shows `"Logged in as did:idkitty:0x..."`
- Big green banner: `"Authenticated via cryptographic signature. No password stored."`

---

## Crypto Service (client-side)

```js
// services/crypto.js

// Generate keypair using Web Crypto API
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

// Sign challenge
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
// Just a context + localStorage

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
// "● ACTIVE" in mint | "● PENDING" in yellow | "● FAILED" in pink
<span style={{ border: '2px solid', padding: '2px 10px', fontFamily: 'mono' }}>
  ● {status}
</span>
```

### `Loader`

Not a spinner. A terminal-style text loop:

```
> Connecting to Polygon...
> Broadcasting transaction...
> Awaiting confirmation...
```

Cycle through with `setInterval`, mono font, yellow text on black.

### `IdentityCard`

Styled like a physical card — landscape, fixed aspect ratio, thick yellow shadow. QR code bottom right. Print-worthy.

---

## Build Order

| Step | Task | Time |
|---|---|---|
| 1 | Vite setup + Tailwind + fonts | 20 min |
| 2 | Design system: colors, button styles, card styles in `index.css` | 30 min |
| 3 | `Landing.jsx` | 40 min |
| 4 | `crypto.js` service | 30 min |
| 5 | `CreateIdentity.jsx` | 45 min |
| 6 | `Dashboard.jsx` + `IdentityCard` component | 40 min |
| 7 | `Login.jsx` + `ChallengeModal` | 40 min |
| 8 | `DemoService.jsx` (protected route) | 20 min |
| 9 | Wire axios to backend, test full flow | 30 min |
| | **Total** | **~4.5 hours** |
