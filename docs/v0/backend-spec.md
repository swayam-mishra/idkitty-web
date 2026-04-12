# IDKitty — Backend Spec

## Stack

| Layer      | Choice                                      | Version  |
|------------|---------------------------------------------|----------|
| Runtime    | Node.js (ES modules, `"type": "module"`)    | —        |
| Framework  | Express.js                                  | 5.2.1    |
| Database   | MongoDB + Mongoose                          | 9.3.3    |
| Crypto     | Node.js `crypto.webcrypto` (Web Crypto API) | built-in |
| Blockchain | ethers.js + Polygon Amoy testnet            | 6.16.0   |
| Auth       | JWT (jsonwebtoken)                          | 9.0.3    |
| Env        | dotenv                                      | 17.3.1   |
| Deployment | Render.com                                  | —        |

---

## Folder Structure

```
idkitty-backend/
├── src/
│   ├── controllers/
│   │   ├── identity.controller.js
│   │   ├── auth.controller.js
│   │   └── stats.controller.js
│   ├── routes/
│   │   ├── identity.routes.js
│   │   ├── auth.routes.js
│   │   └── stats.routes.js
│   ├── models/
│   │   └── Identity.model.js
│   ├── services/
│   │   ├── crypto.service.js
│   │   └── blockchain.service.js
│   ├── middleware/
│   │   └── verifyJWT.js
│   └── app.js
├── contracts/
│   └── DIDRegistry.json        ← ABI, loaded at runtime by blockchain.service.js
├── scripts/
│   └── deploy.js               ← programmatic contract deployment
├── .env
├── .env.example
├── render.yaml                 ← Render.com deployment config
└── server.js                   ← entry point
```

---

## MongoDB Schema

```js
// Identity.model.js
{
  did:       { type: String, required: true, unique: true },
  publicKey: { type: String, required: true },
  claims: {
    name:  { type: String },
    email: { type: String },
  },
  txHash:    { type: String, required: true },
  authCount: { type: Number, default: 0 },   // incremented on every successful auth
  createdAt: { type: Date,   default: Date.now },
}
```

> No passwords. No secrets. This entire DB can be public and it doesn't matter.

---

## API Endpoints

### Identity
```
POST   /api/identity/register
GET    /api/identity/:did
```

### Auth
```
GET    /api/auth/challenge/:did
POST   /api/auth/verify
```

### Stats
```
GET    /api/stats
```

### Root
```
GET    /                        → health check
```

---

## Endpoint Specs

### `POST /api/identity/register`

Receives DID + public key from the frontend, attempts on-chain registration, saves to MongoDB.

**Request body:**
```json
{
  "did":       "did:idkitty:0x1a2b3c...",
  "publicKey": "04a1b2c3...",
  "claims":    { "name": "Swayam", "email": "s@x.com" }
}
```

**Response (201):**
```json
{
  "success": true,
  "did":    "did:idkitty:0x1a2b3c...",
  "txHash": "0xabc..."
}
```

**Graceful blockchain degradation:**
If the Polygon RPC call fails (network error, missing env vars, etc.), the controller catches the error, logs a warning, and substitutes a random 32-byte hex string as a mock `txHash`. The identity is still saved to MongoDB. This allows the app to function without a live blockchain connection.

---

### `GET /api/identity/:did`

Resolves a DID — returns the stored public key, claims, and a Polygonscan link.

**Response (200):**
```json
{
  "did":        "did:idkitty:0x1a2b3c...",
  "publicKey":  "04a1b2c3...",
  "claims":     { "name": "Swayam" },
  "txHash":     "0xabc...",
  "polygonscan": "https://amoy.polygonscan.com/tx/0xabc..."
}
```

**Response (404):**
```json
{ "success": false, "error": "Identity not found" }
```

---

### `GET /api/auth/challenge/:did`

Generates a 32-byte random hex challenge, stores it in an in-memory `Map` with a 60-second TTL, and returns it to the client.

**Response (200):**
```json
{
  "challenge": "a3f9c2...randomhex...7b1d",
  "expiresIn": 60
}
```

Challenges are stored as `Map<did, { challenge: string, expiresAt: number }>`. No Redis required. The map is volatile — it resets on server restart.

---

### `POST /api/auth/verify`

Verifies the signed challenge against the stored public key using `crypto.webcrypto.subtle` (ECDSA P-256, SHA-256). On success, increments `authCount` and issues a 24-hour JWT.

**Request body:**
```json
{
  "did":       "did:idkitty:0x1a2b3c...",
  "signature": "3045022100..."
}
```

**Response (200 — success):**
```json
{ "success": true, "token": "eyJhbGci..." }
```

**Response (400 — expired or missing challenge):**
```json
{ "success": false, "error": "Challenge expired or not found" }
```

**Response (401 — invalid signature):**
```json
{ "success": false, "error": "Invalid signature" }
```

JWT payload:
```json
{ "did": "did:idkitty:...", "claims": { "name": "...", "email": "..." } }
```
Expires in 24 hours. Secret: `JWT_SECRET` env var.

---

### `GET /api/stats`

Returns aggregate counts from MongoDB and the current in-memory challenge map size. No auth required.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalIdentities":      42,
    "totalAuthentications": 137,
    "activeChallenges":     3
  }
}
```

`totalAuthentications` is computed via MongoDB aggregation (`$sum: "$authCount"` across all Identity documents). `activeChallenges` is `challenges.size` from the in-memory Map.

---

## Crypto Service

```js
// src/services/crypto.service.js
// Uses Node.js built-in crypto.webcrypto — same Web Crypto API as the browser

const { subtle } = crypto;   // Node 19+: global `crypto` exposes webcrypto

// Verify an ECDSA P-256 signature
export const verifySignature = async (challenge, signature, publicKeyHex) => {
  const publicKey = await subtle.importKey(
    'raw',
    Buffer.from(publicKeyHex, 'hex'),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );
  const encoder = new TextEncoder();
  return await subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    Buffer.from(signature, 'hex'),
    encoder.encode(challenge)
  );
};
```

Other exports from `crypto.service.js`:
- `generateChallenge(did)` — creates and caches a challenge, returns the hex string
- `getValidChallenge(did)` — returns challenge string if not expired, else `null`
- `clearChallenge(did)` — removes challenge after successful auth
- `getActiveChallengeCount()` — returns `challenges.size`, used by stats endpoint

---

## Blockchain Service

```js
// src/services/blockchain.service.js
import { ethers } from 'ethers';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const DIDRegistry = require('../contracts/DIDRegistry.json');

// Lazily initialized contract instance
let contract;

const getContract = () => {
  if (!contract) {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, DIDRegistry.abi, wallet);
  }
  return contract;
};

export const registerOnChain = async (did, publicKey) => {
  const instance = getContract();
  const tx = await instance.registerDID(did, publicKey);
  await tx.wait();
  return tx.hash;
};
```

If `POLYGON_RPC_URL`, `PRIVATE_KEY`, or `CONTRACT_ADDRESS` are not set, `getContract()` will throw. The caller in `identity.controller.js` wraps this in a try/catch and falls back to a mock `txHash`.

---

## JWT Middleware

`src/middleware/verifyJWT.js` — reads `Authorization: Bearer <token>`, verifies against `JWT_SECRET`, and attaches decoded payload to `req.user`. Returns 401 on missing or invalid token.

Currently not applied to any route by default (all routes are public). Available for future use on protected endpoints.

---

## CORS Configuration

Applied in `app.js`:

```js
app.use(cors({
  origin:         process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods:        ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

In production (Render), set `CORS_ORIGIN` to the deployed frontend URL.

---

## `.env`

```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/idkitty
JWT_SECRET=<random-32-byte-hex>
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=<wallet-private-key>
CONTRACT_ADDRESS=<deployed-contract-address>
CORS_ORIGIN=https://your-frontend.vercel.app
```

> `server.js` falls back to `PORT=5000` if not set, but the frontend's `api.js` expects port `5001` locally. Set `PORT=5001` in `.env`.

---

## Deployment (Render.com)

The repo includes `render.yaml` for deployment to Render.

```yaml
services:
  - type: web
    name: idkitty-backend
    runtime: node
    buildCommand: npm install
    startCommand:  npm start
    envVars:
      - key:   POLYGON_RPC_URL
        value: https://rpc-amoy.polygon.technology
      - key:   MONGO_URI
        sync: false
      - key:   JWT_SECRET
        sync: false
      - key:   PRIVATE_KEY
        sync: false
      - key:   CONTRACT_ADDRESS
        sync: false
      - key:   CORS_ORIGIN
        sync: false
```

`MONGO_URI`, `JWT_SECRET`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`, and `CORS_ORIGIN` must be set manually in the Render dashboard (marked `sync: false`).

---

## Smart Contract (reference)

See [docs/sms-spec.md](./sms-spec.md) for the full `DIDRegistry.sol` source, ABI, and deployment instructions.
