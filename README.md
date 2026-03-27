# IDKitty 🐾

**Decentralized identity. No passwords. Just your keys.**

IDKitty lets you create a cryptographic identity in your browser and use it to log into services — no password ever stored, transmitted, or leaked.

---

## The idea

Every time you sign up somewhere, your password ends up in a database. That database gets breached. Your password gets exposed. Repeat forever.

IDKitty breaks this cycle. Your identity is a keypair generated in your browser. Your private key never leaves your device. To log in, you sign a challenge — the server checks your signature, not a stored secret. Even if the server is fully compromised, there's nothing useful to steal.

Identity is anchored on the Polygon blockchain so anyone can verify it.

---

## How it works

1. **Generate** — your browser creates an ECDSA keypair. You get a DID like `did:idkitty:0x1a2b3c...`
2. **Anchor** — your public key is written to a smart contract on Polygon Amoy testnet
3. **Sign to login** — instead of typing a password, you sign a random challenge with your private key. The server verifies the signature. That's it.

---

## Running locally

**Frontend**
```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`

**Backend** — see `backend-spec.md`. Needs MongoDB + a deployed contract address in `.env`.

The frontend works standalone — you can generate an identity and explore the UI without the backend running. Auth (challenge/verify) needs the backend.

---

## Stack

| | |
|---|---|
| Frontend | React + Vite, Tailwind CSS |
| Crypto | Web Crypto API (browser built-in) |
| Blockchain | Solidity on Polygon Amoy testnet |
| Backend | Node.js + Express + MongoDB |
| Web3 | ethers.js |

---

## Demo flow

1. Hit **Create Identity** — watch the keypair generate in the terminal
2. Add your name/email (optional), register — see it anchor on-chain
3. Go to Dashboard — your identity card with QR code
4. Hit **Test Login** — enter your DID, sign the challenge with your private key
5. Visit **PurrBank** — a fake app that's now secured by your cryptographic identity

---

## Project structure

```
src/
├── components/     CatLogo, NavBar, IdentityCard, StatusBadge, ...
├── pages/          Landing, CreateIdentity, Dashboard, Login, DemoService
├── services/       crypto.js (Web Crypto), api.js (axios)
└── store/          identity.store.js (localStorage + sessionStorage)
```

---

Built at hackathon. Fonts: Space Grotesk + IBM Plex Mono.
