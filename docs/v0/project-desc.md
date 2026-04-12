# IDKitty

**Decentralized Digital Identity for Secure Online Authentication**

---

## Problem

Every time you sign up for a service, your credentials — passwords, emails, personal data — get stored in a centralized database. These databases are honeypots. A single breach exposes millions of users. The problem isn't weak passwords; it's the architecture itself.

---

## Solution

IDKitty eliminates centralized credential storage entirely. Users own their identity as a cryptographic keypair generated in the browser. Authentication happens via challenge-response signing — no password ever transmitted or stored. The identity is anchored on the Polygon blockchain, making it publicly verifiable, tamper-proof, and platform-independent.

---

## How It Works

### 1. Identity Creation

- User visits IDKitty and clicks "Create Identity"
- A keypair (ECDSA P-256) is generated client-side using the Web Crypto API
- Private key is stored in the browser (never leaves the device)
- A DID (Decentralized Identifier) is derived from the public key — e.g. `did:idkitty:0x1a2b3c...`
- The DID + public key is written to a smart contract on Polygon Amoy testnet
- User gets an identity card: DID, linked claims (name, email), QR code

### 2. Authentication Flow

- User wants to log into a service (demo'd within the app as "PurrBank")
- Server sends a random 32-byte hex challenge (60-second TTL)
- Client signs the challenge with the private key using ECDSA-SHA256
- Server verifies the signature against the stored public key
- If valid → authenticated. No password. No database of secrets. JWT issued for the session.

### 3. Verification

- Anyone can verify an identity by looking up the DID on the smart contract
- Polygonscan link available on every identity card — fully transparent

---

## Tech Stack

| Layer        | Tech                                            | Version              |
|--------------|-------------------------------------------------|----------------------|
| Frontend     | React + Vite                                    | 18.3.1 / 6.0.7       |
| Backend      | Node.js + Express (ES modules)                  | Express 5.2.1        |
| Auth Crypto  | Web Crypto API (browser) + `crypto.webcrypto` (server) | built-in       |
| Blockchain   | Solidity smart contract on Polygon Amoy testnet | —                    |
| Web3         | ethers.js                                       | 6.16.0 (BE) / 6.13.4 (FE) |
| Database     | MongoDB + Mongoose                              | 9.3.3                |
| Auth tokens  | JWT (jsonwebtoken)                              | 9.0.3                |
| Deployment   | Render.com (backend), Vercel (frontend)         | —                    |

---

## Data Model (MongoDB)

```js
{
  did:       String,          // "did:idkitty:0x1a2b3c..."
  publicKey: String,          // hex-encoded uncompressed P-256 public key
  claims: {
    name:  String,            // optional
    email: String,            // optional
  },
  txHash:    String,          // Polygon Amoy transaction hash
  authCount: Number,          // incremented on every successful authentication
  createdAt: Date,
}
```

> No passwords. No secrets. This entire DB can be public and it doesn't matter.

---

## API Endpoints (Summary)

```
POST  /api/identity/register    Register a new DID on-chain and in MongoDB
GET   /api/identity/:did        Resolve a DID — returns public key, claims, txHash
GET   /api/auth/challenge/:did  Get a 60-second challenge to sign
POST  /api/auth/verify          Submit signature → receive JWT on success
GET   /api/stats                Platform stats: total identities, auths, active challenges
```

---

## Smart Contract (Registry)

A minimal `DIDRegistry.sol` — one mapping, two functions:

- `registerDID(did, publicKey)` — called once at identity creation
- `resolveDID(did)` — returns the public key for verification

Deployed on Polygon Amoy. Verifiable on Polygonscan. See `docs/sms-spec.md` for full contract source, ABI, and deployment instructions.

---

## What Makes It Different

| Traditional Auth              | IDKitty                             |
|-------------------------------|-------------------------------------|
| Password stored on server     | No password exists                  |
| Breach exposes all users      | Breach exposes nothing useful       |
| Platform owns your identity   | You own your identity               |
| Single point of failure       | Decentralized, blockchain-anchored  |

---

## Demo Flow

1. Create an identity → show keypair generation, DID, identity card
2. Show the transaction on Polygonscan — identity is on-chain
3. Live stats on landing page show real-time identity and authentication counts
4. Log into the demo service ("PurrBank") using signature-based auth — no password prompt
5. Attempt to log in with a wrong key — show it fails
6. Show MongoDB — only public keys, nothing sensitive

---

## Impact

Applicable to any platform that currently uses password-based auth — social media, fintech, healthcare. IDKitty's architecture means even if the server is fully compromised, there are zero user credentials to steal.
