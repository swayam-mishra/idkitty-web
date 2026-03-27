# IDKitty — Backend Spec

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Crypto | Node.js built-in `crypto` module |
| Blockchain | ethers.js + Polygon Amoy |
| Auth | JWT (post-verification session token) |
| Env | dotenv |

---

## Folder Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── identity.controller.js
│   │   └── auth.controller.js
│   ├── routes/
│   │   ├── identity.routes.js
│   │   └── auth.routes.js
│   ├── models/
│   │   └── Identity.model.js
│   ├── services/
│   │   ├── crypto.service.js
│   │   └── blockchain.service.js
│   ├── middleware/
│   │   └── verifyJWT.js
│   └── app.js
├── contracts/
│   └── DIDRegistry.sol
├── scripts/
│   └── deploy.js
├── .env
└── server.js
```

---

## MongoDB Schema

```js
// Identity.model.js
{
  did: String,          // "did:idkitty:0x1a2b3c..."
  publicKey: String,    // hex encoded public key
  claims: {
    name: String,
    email: String
  },
  txHash: String,       // Polygon transaction hash
  createdAt: Date
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

---

## Endpoint Specs

### `POST /api/identity/register`

Receives DID + public key from frontend, writes to blockchain, saves to MongoDB.

**Request body:**
```json
{
  "did": "did:idkitty:0x1a2b3c...",
  "publicKey": "04a1b2c3...",
  "claims": { "name": "Swayam", "email": "s@x.com" }
}
```

**Response:**
```json
{
  "success": true,
  "did": "did:idkitty:0x1a2b3c...",
  "txHash": "0xabc..."
}
```

---

### `GET /api/identity/:did`

Resolves a DID — returns public key + claims + Polygonscan link.

**Response:**
```json
{
  "did": "did:idkitty:0x1a2b3c...",
  "publicKey": "04a1b2c3...",
  "claims": { "name": "Swayam" },
  "txHash": "0xabc...",
  "polygonscan": "https://amoy.polygonscan.com/tx/0xabc..."
}
```

---

### `GET /api/auth/challenge/:did`

Generates a random challenge string, caches it in memory (`Map`), returns it.

**Response:**
```json
{
  "challenge": "a3f9c2...randomhex...7b1d",
  "expiresIn": 60
}
```

Store challenges in a simple in-memory `Map` with a 60s TTL. No Redis needed.

```js
// crypto.service.js
const challenges = new Map();

export const generateChallenge = (did) => {
  const challenge = crypto.randomBytes(32).toString('hex');
  challenges.set(did, { challenge, expiresAt: Date.now() + 60000 });
  return challenge;
};
```

---

### `POST /api/auth/verify`

Core auth endpoint. Verifies the signed challenge against the stored public key.

**Request body:**
```json
{
  "did": "did:idkitty:0x1a2b3c...",
  "signature": "3045022100..."
}
```

**Response (success):**
```json
{
  "success": true,
  "token": "eyJhbGci..."
}
```

**Response (fail):**
```json
{
  "success": false,
  "error": "Invalid signature"
}
```

**Verification logic:**
```js
// crypto.service.js
import crypto from 'crypto';

export const verifySignature = (challenge, signature, publicKeyHex) => {
  const verify = crypto.createVerify('SHA256');
  verify.update(challenge);
  const pubKeyBuffer = Buffer.from(publicKeyHex, 'hex');
  return verify.verify(pubKeyBuffer, Buffer.from(signature, 'hex'));
};
```

---

## Blockchain Service

```js
// blockchain.service.js
import { ethers } from 'ethers';
import DIDRegistry from '../contracts/DIDRegistry.json' assert { type: 'json' };

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, DIDRegistry.abi, wallet);

export const registerOnChain = async (did, publicKey) => {
  const tx = await contract.registerDID(did, publicKey);
  await tx.wait();
  return tx.hash;
};
```

---

## Smart Contract

```solidity
// DIDRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DIDRegistry {
    struct Identity {
        string publicKey;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Identity) private registry;

    event DIDRegistered(string did, uint256 timestamp);

    function registerDID(string memory did, string memory publicKey) public {
        require(!registry[did].exists, "DID already registered");
        registry[did] = Identity(publicKey, block.timestamp, true);
        emit DIDRegistered(did, block.timestamp);
    }

    function resolveDID(string memory did) public view returns (string memory, uint256) {
        require(registry[did].exists, "DID not found");
        return (registry[did].publicKey, registry[did].timestamp);
    }
}
```

> Deploy this first, paste the address in `.env`.

---

## `.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=0x...
```

---

## Build Order

| Step | Task | Time |
|---|---|---|
| 1 | `app.js` + `server.js` setup | 15 min |
| 2 | MongoDB connection + Identity model | 15 min |
| 3 | Deploy smart contract on Amoy | 30 min |
| 4 | `blockchain.service.js` | 20 min |
| 5 | `POST /identity/register` | 30 min |
| 6 | `GET /auth/challenge/:did` + challenge Map | 20 min |
| 7 | `POST /auth/verify` + JWT issue | 40 min |
| 8 | `GET /identity/:did` | 15 min |
| 9 | Test all endpoints with Postman | 30 min |
| | **Total** | **~3.5 hours** |
