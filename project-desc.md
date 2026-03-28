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
- A keypair is generated client-side using the Web Crypto API
- Private key is stored in the browser (never leaves the device)
- A DID (Decentralized Identifier) is derived from the public key — e.g. `did:vault:0x1a2b3c...`
- The DID + public key is written to a smart contract on Polygon Amoy testnet
- User gets an identity card: DID, linked claims (name, email), QR code

### 2. Authentication Flow
- User wants to log into a service (demo'd within the app)
- Server sends a random challenge string
- Client signs the challenge with the private key
- Server verifies the signature against the stored public key
- If valid → authenticated. No password. No database of secrets.

### 3. Verification
- Anyone can verify an identity by looking up the DID on the smart contract
- Polygonscan link available on every identity card — fully transparent

---

## Tech Stack

| Layer       | Tech                                          |
|-------------|-----------------------------------------------|
| Frontend    | React + Vite                                  |
| Backend     | Node.js + Express                             |
| Auth Crypto | Web Crypto API                                |
| Blockchain  | Solidity smart contract on Polygon Amoy testnet |
| Web3        | ethers.js                                     |
| Database    | MongoDB (stores public keys + DIDs, no passwords) |

---

## Smart Contract (Registry)

A minimal `DIDRegistry.sol` — one mapping, two functions:

- `registerDID(did, publicKey)` — called once at identity creation
- `resolveDID(did)` — returns the public key for verification

Deployed on Polygon Amoy. Verifiable on Polygonscan.

---

## What Makes It Different

| Traditional Auth              | IDKitty                          |
|-------------------------------|----------------------------------|
| Password stored on server     | No password exists               |
| Breach exposes all users      | Breach exposes nothing useful    |
| Platform owns your identity   | You own your identity            |
| Single point of failure       | Decentralized, blockchain-anchored |

---

## Demo Flow

1. Create an identity → show keypair generation, DID, identity card
2. Show the transaction on Polygonscan — identity is on-chain
3. Log into a demo service using signature-based auth — no password prompt
4. Attempt to log in with a wrong key — show it fails
5. Show MongoDB — only public keys, nothing sensitive

---

## Impact

Applicable to any platform that currently uses password-based auth — social media, fintech, healthcare. IDKitty's architecture means even if the server is fully compromised, there are zero user credentials to steal.
