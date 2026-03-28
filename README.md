# IDKitty

**Your identity. No one else's.**

IDKitty is a decentralized digital identity system built for the web. No passwords. No centralized databases. No breaches. Just you, your keys, and math.

Built at **HackOlympus** by [@swaayyam](https://x.com/swaayyam) & [@uutkarrsh](https://x.com/uutkarrsh).

---

## What is this?

Every time you sign up somewhere, your credentials get stuffed into a server that someone will eventually hack. IDKitty fixes the architecture, not just the password.

- Your browser generates a cryptographic keypair
- Your private key never leaves your device — ever
- Your identity gets anchored on the Polygon blockchain
- You authenticate by signing a challenge — no password typed, no secret stored

If the server gets hacked, there's nothing useful to steal.

---

## How it works

```
1. Create Identity  →  keypair generated in browser via Web Crypto API
2. Anchor on Chain  →  DID + public key written to Polygon Amoy
3. Sign to Login    →  challenge signed with private key, verified server-side
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Styling | CSS + Tailwind |
| Auth Crypto | Web Crypto API (browser built-in) |
| Blockchain | Polygon Amoy testnet |
| Web3 | ethers.js |
| Backend | [idkitty-backend](https://github.com/utkarrshgit/idkitty-backend.git) |

---

## Running locally

```bash
git clone https://github.com/your-username/idkitty-web.git
cd idkitty-web
npm install
npm run dev
```

Opens at `http://localhost:5173`

You'll also need the backend running — see [idkitty-backend](https://github.com/utkarrshgit/idkitty-backend.git) for setup. The frontend works standalone for identity creation — auth (challenge/verify) needs the backend.

---

## Pages

| Route | What it does |
|---|---|
| `/` | Landing — hero, marquee, how it works |
| `/create` | Generate your DID + keypair |
| `/login` | Sign in with your identity |
| `/dashboard` | Your identity card + DID details |
| `/demo` | PurrBank — a fake bank to demo passwordless auth |

---

## Backend

→ [utkarrshgit/idkitty-backend](https://github.com/utkarrshgit/idkitty-backend.git)

Node.js + Express + MongoDB + Polygon smart contract. Handles DID registration, challenge generation, and signature verification.

---

## The point

4.5 billion records were breached in 2023. The problem isn't that people use weak passwords — it's that passwords exist at all. IDKitty is a proof of concept that you don't need them.
