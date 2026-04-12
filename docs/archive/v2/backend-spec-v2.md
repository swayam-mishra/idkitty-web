# IDKitty v2 — Backend Spec

## Stack

| Layer              | Choice                                      | Version / Notes                                      |
|--------------------|---------------------------------------------|------------------------------------------------------|
| Runtime            | Node.js LTS (ES modules)                    | 22 LTS                                               |
| Framework          | Express.js                                  | 5.x                                                  |
| Database           | MongoDB + Mongoose                          | 7.x / 8.x                                           |
| Cache / Sessions   | Redis (Upstash or self-hosted)              | Upstash serverless for hosted; `ioredis` client       |
| Queue              | BullMQ                                      | 5.x — blockchain writes + webhook delivery           |
| JWT                | RS256 asymmetric (jsonwebtoken)             | 9.x — private key signs, public key verifies         |
| Request Validation | Zod                                         | 3.x                                                  |
| Logging            | Winston + Axiom transport                   | structured JSON logs, shipped to Axiom               |
| Blockchain         | ethers.js                                   | 6.x                                                  |
| Rate Limiting      | `@upstash/ratelimit` + `ioredis`            | per-IP, per-DID, per-tenant                          |
| Security Headers   | Helmet.js                                   | 7.x                                                  |
| Password Hashing   | bcrypt                                      | 5.x — for client secrets                             |
| Crypto             | Node.js `crypto.webcrypto`                  | built-in — ECDSA P-256 verification                  |
| Deployment         | Fly.io (backend), MongoDB Atlas, Upstash    | `fly.toml` included                                  |
| Dev tooling        | tsx, Vitest, Supertest                      | TS-first dev, fast unit + integration tests          |

---

## Folder Structure

```
idkitty-backend/
├── src/
│   ├── app.js                          ← Express app setup, middleware chain
│   ├── controllers/
│   │   ├── identity.controller.js
│   │   ├── auth.controller.js
│   │   ├── tenant.controller.js
│   │   ├── sdk.controller.js
│   │   ├── admin.controller.js
│   │   └── stats.controller.js
│   ├── routes/
│   │   ├── identity.routes.js
│   │   ├── auth.routes.js
│   │   ├── tenant.routes.js
│   │   ├── sdk.routes.js
│   │   ├── admin.routes.js
│   │   └── stats.routes.js
│   ├── models/
│   │   ├── Identity.model.js
│   │   ├── Tenant.model.js
│   │   ├── AuditLog.model.js
│   │   └── Session.model.js
│   ├── services/
│   │   ├── crypto.service.js           ← challenge gen, signature verify
│   │   ├── blockchain.service.js       ← multi-chain ethers.js abstraction
│   │   ├── redis.service.js            ← ioredis client + helpers
│   │   ├── jwt.service.js              ← RS256 sign/verify, JWKS
│   │   ├── webhook.service.js          ← HMAC signing, delivery helpers
│   │   └── audit.service.js            ← fire-and-forget audit log writes
│   ├── queues/
│   │   ├── blockchain.queue.js         ← BullMQ queue + worker for on-chain writes
│   │   └── webhook.queue.js            ← BullMQ queue + worker for webhook delivery
│   ├── middleware/
│   │   ├── verifyJWT.js                ← validate RS256 access token
│   │   ├── tenantAuth.js               ← validate clientId + clientSecret
│   │   ├── rateLimiter.js              ← Upstash rate limit middleware factory
│   │   ├── requestId.js                ← attach x-request-id to every req
│   │   ├── validateBody.js             ← Zod schema middleware factory
│   │   └── adminOnly.js                ← check admin role in JWT claims
│   ├── validators/
│   │   ├── identity.validators.js
│   │   ├── auth.validators.js
│   │   ├── tenant.validators.js
│   │   └── admin.validators.js
│   ├── config/
│   │   ├── chains.config.js            ← SUPPORTED_CHAINS registry
│   │   ├── redis.config.js
│   │   └── jwt.config.js               ← load RSA key pair from env
│   ├── utils/
│   │   ├── logger.js                   ← Winston instance
│   │   ├── errors.js                   ← AppError class + error codes
│   │   └── asyncHandler.js             ← express async wrapper
│   └── __tests__/
│       ├── identity.test.js
│       ├── auth.test.js
│       └── tenant.test.js
├── contracts/
│   ├── DIDRegistryV2.json              ← compiled ABI
│   └── chains/                         ← per-chain deployment addresses
│       ├── polygon-amoy.json
│       ├── polygon-mainnet.json
│       ├── base-mainnet.json
│       └── base-sepolia.json
├── scripts/
│   ├── deploy.js                       ← deploy DIDRegistryV2 to any chain
│   ├── generate-keypair.js             ← generate RSA key pair for JWT signing
│   └── seed-admin.js                   ← create initial admin tenant
├── sdk/                                ← @idkitty/sdk package source
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── crypto.ts
│   │   ├── jwks.ts
│   │   └── types.ts
│   ├── dist/
│   │   ├── index.cjs
│   │   └── index.mjs
│   ├── package.json
│   └── tsconfig.json
├── .env
├── .env.example
├── fly.toml
├── package.json
└── server.js
```

---

## MongoDB Schemas

### `Identity.model.js`

```js
import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  deviceId:      { type: String, required: true },
  publicKey:     { type: String, required: true },   // device-specific key
  keyType:       { type: String, default: 'ECDSA-P256' },
  label:         { type: String },                   // "iPhone 15 Pro"
  addedAt:       { type: Date, default: Date.now },
  lastUsedAt:    { type: Date },
  revokedAt:     { type: Date, default: null },
}, { _id: false });

const KeyHistorySchema = new mongoose.Schema({
  publicKey:   { type: String, required: true },
  keyVersion:  { type: Number, required: true },
  keyType:     { type: String, default: 'ECDSA-P256' },
  registeredAt:{ type: Date, required: true },
  revokedAt:   { type: Date, default: null },
}, { _id: false });

const IdentitySchema = new mongoose.Schema({
  did:           { type: String, required: true, unique: true, index: true },
  publicKey:     { type: String, required: true },
  keyType:       { type: String, default: 'ECDSA-P256' },
  keyVersion:    { type: Number, default: 1 },
  keyHistory:    { type: [KeyHistorySchema], default: [] },
  controller:    { type: String, required: true },   // wallet address that registered on-chain
  chain:         { type: String, required: true, default: 'polygon-amoy' },
  txHash:        { type: String, required: true },
  blockchainStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'mock'],
    default: 'pending',
  },
  claims: {
    name:        { type: String },
    email:       { type: String },
    phone:       { type: String },
    avatar:      { type: String },
  },
  metadata:      { type: mongoose.Schema.Types.Mixed, default: {} },
  devices:       { type: [DeviceSchema], default: [] },
  tenantIds:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }],
  username: {
    type:      String,
    unique:    true,
    sparse:    true,    // allows multiple null values (identities without usernames)
    lowercase: true,
    trim:      true,
    match:     /^[a-z0-9_]{3,20}$/,
    index:     true,
  },
  usernameChangedAt: { type: Date, default: null },
  authCount:     { type: Number, default: 0 },
  revokedAt:     { type: Date, default: null },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
});

IdentitySchema.index({ 'claims.email': 1 });
IdentitySchema.index({ tenantIds: 1 });
IdentitySchema.pre('save', function (next) { this.updatedAt = new Date(); next(); });

export default mongoose.model('Identity', IdentitySchema);
```

---

### `Tenant.model.js`

```js
import mongoose from 'mongoose';

const WebhookConfigSchema = new mongoose.Schema({
  url:            { type: String },
  secret:         { type: String },                  // HMAC signing secret, stored plaintext (not a password)
  events:         [{ type: String, enum: [
    'auth.success', 'auth.failed', 'identity.registered',
    'identity.revoked', 'key.rotated', 'session.revoked',
  ]}],
  enabled:        { type: Boolean, default: true },
  failCount:      { type: Number, default: 0 },
  lastDeliveredAt:{ type: Date },
}, { _id: false });

const PlanLimitsSchema = new mongoose.Schema({
  monthlyAuths:   { type: Number, default: 1000 },   // free tier
  rateLimit:      { type: Number, default: 60 },     // requests per minute
  retentionDays:  { type: Number, default: 30 },     // audit log retention
}, { _id: false });

const TenantSchema = new mongoose.Schema({
  clientId:       { type: String, required: true, unique: true, index: true },
  clientSecret:   { type: String, required: true },  // bcrypt hashed
  name:           { type: String, required: true },
  description:    { type: String },
  contactEmail:   { type: String, required: true },
  allowedOrigins: [{ type: String }],                // CORS whitelist
  webhookConfig:  { type: WebhookConfigSchema, default: () => ({}) },
  plan:           { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  planLimits:     { type: PlanLimitsSchema, default: () => ({}) },
  usageCount:     { type: Number, default: 0 },      // auths this month
  usageResetAt:   { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  active:               { type: Boolean, default: true },
  quickStartDismissed:  { type: Boolean, default: false },
  adminNotes:           { type: String },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now },
});

TenantSchema.pre('save', function (next) { this.updatedAt = new Date(); next(); });

export default mongoose.model('Tenant', TenantSchema);
```

---

### `AuditLog.model.js`

```js
import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  did:        { type: String, required: true, index: true },
  tenantId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  event:      {
    type: String,
    required: true,
    enum: [
      'REGISTERED',
      'AUTH_SUCCESS',
      'AUTH_FAILED',
      'KEY_ROTATED',
      'KEY_REVOKED',
      'SESSION_REVOKED',
      'DEVICE_ADDED',
      'DEVICE_REVOKED',
      'IDENTITY_REVOKED',
      'USERNAME_CLAIMED',
      'USERNAME_CHANGED',
    ],
  },
  ip:         { type: String },
  userAgent:  { type: String },
  requestId:  { type: String },
  metadata:   { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp:  { type: Date, default: Date.now, index: true },
});

// TTL index — auto-delete old logs based on tenant retention policy
// Managed manually by a cron job checking tenant.planLimits.retentionDays
AuditLogSchema.index({ timestamp: 1 });
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });

export default mongoose.model('AuditLog', AuditLogSchema);
```

---

### `Session.model.js`

```js
import mongoose from 'mongoose';

const DeviceInfoSchema = new mongoose.Schema({
  userAgent:  { type: String },
  ip:         { type: String },
  platform:   { type: String },    // "web", "ios", "android"
  deviceId:   { type: String },
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  sessionId:      { type: String, required: true, unique: true, index: true },
  did:            { type: String, required: true, index: true },
  tenantId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  refreshToken:   { type: String, required: true },  // bcrypt hashed
  accessTokenJti: { type: String },                  // latest issued access token JTI (for revocation check)
  deviceInfo:     { type: DeviceInfoSchema },
  expiresAt:      { type: Date, required: true },    // 30 days from creation
  revokedAt:      { type: Date, default: null },
  lastUsedAt:     { type: Date, default: Date.now },
  createdAt:      { type: Date, default: Date.now },
});

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL
SessionSchema.index({ did: 1, tenantId: 1 });

export default mongoose.model('Session', SessionSchema);
```

---

### `ReleasedUsername.model.js`

Tracks usernames that were recently released, preventing immediate re-registration by squatters. Documents are auto-deleted after 7 days via MongoDB TTL index, at which point the username becomes claimable again.

```js
import mongoose from 'mongoose';

const ReleasedUsernameSchema = new mongoose.Schema({
  username:   { type: String, required: true, index: true },
  releasedAt: { type: Date,   required: true, default: Date.now },
  releasedBy: { type: String, required: true },  // DID that released it
});

// TTL index — auto-delete after 7 days; username becomes claimable again
ReleasedUsernameSchema.index({ releasedAt: 1 }, { expireAfterSeconds: 604800 });

export default mongoose.model('ReleasedUsername', ReleasedUsernameSchema);
```

---

## Username System

Usernames are a human-readable discovery layer on top of DIDs. They are stored in MongoDB only — not on-chain. The DID remains the cryptographic identity; the username is a mutable alias.

### Format Rules

- **Length:** 3–20 characters
- **Allowed characters:** lowercase alphanumeric + underscores only
- **Regex:** `/^[a-z0-9_]{3,20}$/`
- **Case handling:** case-insensitive on input, stored and compared as lowercase
- **Uniqueness:** enforced globally across all identities (sparse unique index)
- **Optional:** an identity can exist without a username — the existing DID-only flow is unchanged

### Reserved Words

The following usernames cannot be registered:

```
admin, idkitty, support, help, system, root, api, null, undefined,
wallet, did, identity, auth, login, signup, register, me, self
```

### Change Policy

- A username can be changed at most once every **30 days** (enforced via `usernameChangedAt`)
- When a username is changed, the old username enters a **7-day hold** (`ReleasedUsername` collection) before becoming claimable by anyone else
- An identity can release its username entirely (set to `null`); the old username enters the same 7-day hold

---

## API Endpoints

### `/api/identity/*`

---

#### `POST /api/identity/register`

| Field       | Value |
|---|---|
| Auth        | Tenant API key (`clientId` + `clientSecret` in `Authorization: Basic <base64>`) |
| Rate limit  | 10 req/min per IP, 5 req/min per tenant |

**Request body (Zod):**
```js
z.object({
  did:       z.string().startsWith('did:idkitty:'),
  publicKey: z.string().min(64),
  chain:     z.enum(['polygon-amoy', 'polygon-mainnet', 'base-mainnet', 'base-sepolia']).default('polygon-amoy'),
  claims:    z.object({
    name:  z.string().max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
})
```

**Response 201:**
```json
{
  "success": true,
  "did": "did:idkitty:polygon-amoy:0x1a2b3c...",
  "txHash": "0xabc...",
  "blockchainStatus": "pending",
  "keyVersion": 1
}
```

**Behavior:**
1. Validate DID not already registered.
2. Save identity to MongoDB with `blockchainStatus: 'pending'`.
3. Enqueue blockchain write job in BullMQ `blockchain-writes` queue (async).
4. Write `REGISTERED` audit log (async, non-blocking).
5. Increment tenant `usageCount`.
6. Return 201 immediately — blockchain confirmation comes later.

**Error codes:**
- `409` — DID already registered
- `429` — rate limit exceeded
- `402` — tenant monthly auth limit exceeded

---

#### `GET /api/identity/:did`

| Field | Value |
|---|---|
| Auth | None (public) |
| Rate limit | 30 req/min per IP |

**Response 200:**
```json
{
  "did": "did:idkitty:polygon-amoy:0x1a2b3c...",
  "publicKey": "04a1b2...",
  "keyVersion": 1,
  "keyType": "ECDSA-P256",
  "chain": "polygon-amoy",
  "txHash": "0xabc...",
  "blockchainStatus": "confirmed",
  "claims": { "name": "Swayam" },
  "username": "swayam",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "revokedAt": null,
  "didDocument": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:idkitty:polygon-amoy:0x1a2b3c...",
    "verificationMethod": [{
      "id": "did:idkitty:polygon-amoy:0x1a2b3c...#key-1",
      "type": "EcdsaSecp256r1VerificationKey2019",
      "controller": "did:idkitty:polygon-amoy:0x1a2b3c...",
      "publicKeyHex": "04a1b2..."
    }],
    "authentication": ["did:idkitty:polygon-amoy:0x1a2b3c...#key-1"],
    "controller": "0xWALLET_ADDRESS"
  }
}
```

**Error codes:**
- `404` — DID not found

---

#### `POST /api/identity/:did/rotate-key`

| Field | Value |
|---|---|
| Auth | User JWT (access token for the DID being rotated) |
| Rate limit | 3 req/hour per DID |

**Request body:**
```js
z.object({
  newPublicKey: z.string().min(64),
  keyType:      z.enum(['ECDSA-P256']).default('ECDSA-P256'),
})
```

**Response 200:**
```json
{
  "success": true,
  "did": "did:idkitty:polygon-amoy:0x1a2b3c...",
  "keyVersion": 2,
  "newPublicKey": "04d5e6...",
  "blockchainStatus": "pending"
}
```

**Behavior:**
1. Verify JWT `sub` matches `:did` param.
2. Move current public key to `keyHistory[]` with `revokedAt: now`.
3. Set new public key, increment `keyVersion`.
4. Invalidate all active sessions for this DID (Redis + MongoDB).
5. Enqueue on-chain `rotateKey` call via BullMQ.
6. Write `KEY_ROTATED` audit log.

---

#### `POST /api/identity/:did/revoke`

| Field | Value |
|---|---|
| Auth | User JWT |
| Rate limit | 3 req/hour per DID |

**Request body:** Empty (or optional `{ reason: string }`).

**Response 200:**
```json
{ "success": true, "revokedAt": "2025-01-01T00:00:00.000Z" }
```

**Behavior:**
1. Set `revokedAt` on identity.
2. Revoke all active sessions.
3. Enqueue on-chain `revokeDID` via BullMQ.
4. Write `IDENTITY_REVOKED` audit log.

---

#### `POST /api/identity/:did/add-device`

Add a new device's public key to an existing identity. Authorization comes from a signature produced by the current controlling device — not a JWT.

| Field | Value |
|---|---|
| Auth | Signature from existing active key (see body) |
| Rate limit | 3 req/hour per DID |

**Request body (Zod):**
```js
z.object({
  newDevicePublicKey:   z.string().min(64),
  deviceLabel:          z.string().max(50).optional(),
  platform:             z.enum(['web', 'ios', 'android']).optional(),
  authorizingSignature: z.string(),   // ECDSA-P256 signature over SHA-256(did + newDevicePublicKey + timestamp)
  timestamp:            z.number(),   // unix ms — must be within 60s of server time
})
```

**Response 200:**
```json
{
  "success":  true,
  "deviceId": "dev_xxxxxxxx",
  "devices": [
    {
      "deviceId":   "dev_xxxxxxxx",
      "label":      "iPhone 15 Pro",
      "platform":   "ios",
      "publicKey":  "04d5e6...",
      "addedAt":    "2025-01-01T00:00:00.000Z",
      "lastUsedAt": null
    }
  ]
}
```

**Behavior:**
1. Reject if `timestamp` is more than 60 seconds from server time (replay protection).
2. Load identity from MongoDB; verify `authorizingSignature` against `identity.publicKey` (the current active key) over `SHA-256(did + newDevicePublicKey + timestamp)`.
3. If invalid → return `401 { error: 'INVALID_AUTHORIZING_SIGNATURE' }`.
4. Generate `deviceId` (`dev_` + 8 random bytes hex).
5. Push new `DeviceSchema` entry to `identity.devices[]`.
6. Enqueue `addKey(newDevicePublicKey, KeyPurpose.Authentication)` on-chain via BullMQ `blockchain-writes` queue.
7. Write `DEVICE_ADDED` audit log.
8. Return updated device list.

**Error codes:**
- `401` — invalid or missing authorizing signature
- `408` — timestamp outside 60-second window
- `409` — `newDevicePublicKey` already registered to this DID
- `429` — rate limit exceeded

---

#### `GET /api/identity/username/:username`

Resolve a username to a full identity. Returns the same response shape as `GET /api/identity/:did`.

| Field | Value |
|---|---|
| Auth | None (public) |
| Rate limit | 30 req/min per IP |

**Behavior:**
- Lookup `Identity` where `username === req.params.username` (case-insensitive, i.e. lowercase compare)
- If found: return identical response to `GET /api/identity/:did`
- If not found: `404 { error: 'USERNAME_NOT_FOUND' }`

---

#### `GET /api/identity/username/:username/available`

Check whether a username is available to claim.

| Field | Value |
|---|---|
| Auth | None (public) |
| Rate limit | 20 req/min per IP |

**Response 200:**
```json
{ "available": true,  "username": "swayam" }
{ "available": false, "username": "swayam", "reason": "taken" }
{ "available": false, "username": "admin",  "reason": "reserved" }
{ "available": false, "username": "sw",     "reason": "invalid_format" }
{ "available": false, "username": "swayam", "reason": "recently_released" }
```

**Returns `available: false` when:**
- Username is taken by another identity (`reason: 'taken'`)
- Username matches the reserved words list (`reason: 'reserved'`)
- Username fails format validation (`reason: 'invalid_format'`)
- Username exists in `ReleasedUsername` collection (7-day hold) (`reason: 'recently_released'`)

---

#### `POST /api/identity/:did/username`

Claim or update a username for an identity.

| Field | Value |
|---|---|
| Auth | User JWT (`sub` must match `:did`) |
| Rate limit | 5 req/hour per DID |

**Request body (Zod):**
```js
z.object({
  username: z.string()
    .min(3).max(20)
    .regex(/^[a-z0-9_]{3,20}$/, 'Username must be 3–20 chars, lowercase letters, numbers, underscores only')
    .transform(v => v.toLowerCase()),
})
```

**Response 200:**
```json
{ "success": true, "username": "swayam", "did": "did:idkitty:polygon-amoy:..." }
```

**Behavior:**
1. Validate format — return `400 { error: 'USERNAME_INVALID_FORMAT', message }` if invalid.
2. Check reserved words list — return `400 { error: 'USERNAME_RESERVED' }` if match.
3. Check `ReleasedUsername` collection — return `409 { error: 'USERNAME_RECENTLY_RELEASED', reason: 'recently_released' }` if found.
4. Check availability in `Identity` collection — return `409 { error: 'USERNAME_TAKEN' }` if taken.
5. Check cooldown: if `identity.usernameChangedAt` is set and less than 30 days ago, return `429 { error: 'USERNAME_CHANGE_COOLDOWN', nextChangeAt: <ISO date> }`.
6. If the identity already has a username, insert the old username into `ReleasedUsername` with `releasedBy: did`.
7. Set `identity.username = username` and `identity.usernameChangedAt = new Date()`.
8. Write `USERNAME_CLAIMED` (first-time) or `USERNAME_CHANGED` (update) to AuditLog.
9. Return `{ success: true, username, did }`.

**Error codes:**
- `400` — invalid format or reserved word
- `409` — username taken or in 7-day release hold
- `429` — 30-day change cooldown not yet elapsed

---

### `/api/auth/*`

---

#### `GET /api/auth/challenge/:did`

| Field | Value |
|---|---|
| Auth | Tenant API key |
| Rate limit | 20 req/min per DID, 100 req/min per tenant |

**Query params:**
- `tenantId` (required — for Redis key namespacing)

**Response 200:**
```json
{
  "challenge":  "a3f9c2...randomhex...7b1d",
  "expiresIn":  60,
  "issuedAt":   "2025-01-01T00:00:00.000Z"
}
```

**Behavior:**
- Generate 32-byte random hex challenge.
- Store in Redis: key `challenge:{did}:{tenantId}`, TTL 60s.
- If DID is revoked, return `403 { error: "DID_REVOKED" }`.

---

#### `POST /api/auth/verify`

| Field | Value |
|---|---|
| Auth | Tenant API key |
| Rate limit | 5 req/min per DID (failed attempts count double), 20 req/hour per DID |

**Request body:**
```js
z.object({
  did:          z.string().startsWith('did:idkitty:'),
  signature:    z.string(),
  tenantId:     z.string(),
  deviceInfo:   z.object({
    platform:   z.enum(['web', 'ios', 'android']).optional(),
    deviceId:   z.string().optional(),
    userAgent:  z.string().optional(),
  }).optional(),
})
```

**Response 200 (success):**
```json
{
  "success":       true,
  "accessToken":   "eyJhbGci...",
  "refreshToken":  "rt_xxxxxxxxxxxxxxxx",
  "expiresIn":     900,
  "tokenType":     "Bearer",
  "sessionId":     "sess_xxxxxxxx",
  "did":           "did:idkitty:polygon-amoy:0x...",
  "username":      "swayam"
}
```

`username` is `null` if the identity has not yet claimed one. The JWT payload also includes `username`: `{ sub: did, claims, tenantId, username, jti }`.

**Response 401 (invalid signature):**
```json
{ "success": false, "error": "INVALID_SIGNATURE", "code": 401 }
```

**Response 400 (expired challenge):**
```json
{ "success": false, "error": "CHALLENGE_EXPIRED", "code": 400 }
```

**Behavior:**
1. Fetch challenge from Redis `challenge:{did}:{tenantId}`. If missing → `CHALLENGE_EXPIRED`.
2. Delete challenge from Redis immediately (prevents replay).
3. Load identity from MongoDB; verify signature with `crypto.webcrypto.subtle`.
4. If invalid → increment rate-limit failure counter, write `AUTH_FAILED` audit log, return 401.
5. If valid:
   - Create `Session` document in MongoDB.
   - Store hashed refresh token in Redis: `session:{sessionId}` TTL 30 days.
   - Issue RS256 access token (15 min) and refresh token.
   - Increment `authCount` on identity, `usageCount` on tenant.
   - Write `AUTH_SUCCESS` audit log (async).
   - Enqueue webhook delivery if tenant has `auth.success` webhook configured.
6. Return tokens.

---

#### `POST /api/auth/refresh`

| Field | Value |
|---|---|
| Auth | None — refresh token in body |
| Rate limit | 10 req/min per sessionId |

**Request body:**
```js
z.object({
  refreshToken: z.string(),
  sessionId:    z.string(),
})
```

**Response 200:**
```json
{
  "accessToken":  "eyJhbGci...",
  "refreshToken": "rt_yyyyy...",
  "expiresIn":    900
}
```

**Behavior:**
1. Load session from Redis `session:{sessionId}`.
2. Verify refresh token hash matches stored hash.
3. Check session not revoked (`revokedAt == null`), not expired.
4. **Token rotation**: generate new refresh token, invalidate old one in Redis.
5. Issue new access token with new `jti`.
6. Update `session.lastUsedAt` and `session.accessTokenJti`.

---

#### `POST /api/auth/revoke-session`

| Field | Value |
|---|---|
| Auth | User JWT or Tenant API key |
| Rate limit | 20 req/min |

**Request body:**
```js
z.object({
  sessionId: z.string(),             // specific session, or
  revokeAll: z.boolean().optional(), // revoke ALL sessions for this DID
})
```

**Response 200:**
```json
{ "success": true, "revokedCount": 1 }
```

**Behavior:**
1. If JWT auth: can only revoke own sessions.
2. If tenant API key: can revoke sessions for DIDs authenticated through that tenant.
3. Mark sessions `revokedAt` in MongoDB.
4. Delete session entries from Redis.
5. Write `SESSION_REVOKED` audit log.

---

### `/api/tenants/*`

---

#### `POST /api/tenants/register`

| Field | Value |
|---|---|
| Auth | None (public registration) |
| Rate limit | 3 req/hour per IP |

**Request body:**
```js
z.object({
  name:           z.string().min(2).max(100),
  contactEmail:   z.string().email(),
  description:    z.string().max(500).optional(),
  allowedOrigins: z.array(z.string().url()).max(10).optional(),
  webhookUrl:     z.string().url().optional(),
})
```

**Response 201:**
```json
{
  "success":      true,
  "clientId":     "client_xxxxxxxxxxxxxxxx",
  "clientSecret": "cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "message":      "Store your clientSecret securely — it will not be shown again."
}
```

**Behavior:**
- Generate `clientId` (`client_` + 16 random bytes hex).
- Generate `clientSecret` (`cs_` + 32 random bytes hex). Store bcrypt hash in DB.
- Return plaintext secret once only.

---

#### `GET /api/tenants/me`

| Field | Value |
|---|---|
| Auth | Tenant API key |

**Response 200:**
```json
{
  "clientId":     "client_xxx",
  "name":         "My App",
  "plan":         "free",
  "usageCount":   245,
  "usageResetAt": "2025-02-01T00:00:00.000Z",
  "planLimits":   { "monthlyAuths": 1000, "rateLimit": 60 },
  "allowedOrigins": ["https://myapp.com"],
  "webhookConfig": {
    "url":     "https://myapp.com/webhooks/idkitty",
    "events":  ["auth.success", "auth.failed"],
    "enabled": true,
    "failCount": 0
  },
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

#### `GET /api/tenants/stats`

| Field | Value |
|---|---|
| Auth | Tenant API key |

**Query params:** `period` (`7d` | `30d` | `90d`, default `30d`)

**Response 200:**
```json
{
  "period": "30d",
  "totalAuths":    1247,
  "successRate":   0.97,
  "uniqueDIDs":    312,
  "dailyBreakdown": [
    { "date": "2025-01-01", "success": 42, "failed": 2 }
  ],
  "topEvents": [
    { "event": "AUTH_SUCCESS", "count": 1205 },
    { "event": "AUTH_FAILED",  "count":   42 }
  ]
}
```

---

#### `PATCH /api/tenants/me/webhook`

| Field | Value |
|---|---|
| Auth | Tenant API key |

**Request body:**
```js
z.object({
  url:     z.string().url(),
  events:  z.array(z.enum(['auth.success','auth.failed','identity.registered','identity.revoked','key.rotated','session.revoked'])),
  enabled: z.boolean().optional(),
})
```

**Response 200:** Updated tenant webhook config.

---

#### `POST /api/tenants/me/webhook/test`

| Field | Value |
|---|---|
| Auth | Tenant API key |

Sends a test payload to the configured webhook URL. Returns delivery status.

**Response 200:**
```json
{
  "delivered": true,
  "statusCode": 200,
  "responseTime": 142,
  "payload": { "event": "test", "timestamp": "..." }
}
```

---

#### `POST /api/tenants/me/rotate-secret`

| Field | Value |
|---|---|
| Auth | Tenant API key |

**Request body:**
```js
z.object({
  currentSecret: z.string(),  // must confirm current secret
})
```

**Response 200:**
```json
{
  "clientSecret": "cs_new_xxxxxxxx",
  "message": "Previous secret is immediately invalidated."
}
```

---

#### `PATCH /api/tenants/me/profile`

Partial update of the tenant's profile fields. Also used by the dashboard to persist Quick Start card dismissal.

| Field | Value |
|---|---|
| Auth | Tenant API key |

**Request body (Zod):**
```js
z.object({
  name:                 z.string().min(2).max(100).optional(),
  description:          z.string().max(500).optional(),
  quickStartDismissed:  z.boolean().optional(),
})
```

**Response 200:**
```json
{
  "clientId":            "client_xxx",
  "name":                "My App",
  "description":         "Auth for PurrBank",
  "quickStartDismissed": true
}
```

**Behavior:**
- Applies a partial update (`$set`) to the `Tenant` document for the authenticated tenant.
- Only the fields present in the request body are updated; all others are left unchanged.
- Returns only the subset of profile fields listed above (not credentials or plan data).

---

### `/api/sdk/*`

SDK-optimized endpoints. These are the same as `/api/auth/*` and `/api/identity/*` but:
- CORS is set per-tenant `allowedOrigins` (not `*`)
- Response payloads are lean (fewer fields)
- Extra caching headers for challenge responses

#### `POST /api/sdk/init`

Takes `clientId` (public, not secret), returns tenant's public config for SDK initialization.

```json
{
  "clientId":      "client_xxx",
  "tenantName":    "My App",
  "allowedOrigins": ["https://myapp.com"],
  "supportedChains": ["polygon-amoy"],
  "jwksUri":       "https://api.idkitty.io/.well-known/jwks.json"
}
```

#### `GET /api/sdk/challenge/:did`

Same as `/api/auth/challenge/:did` but CORS set from tenant `allowedOrigins`.

#### `POST /api/sdk/verify`

Same as `/api/auth/verify` but returns compact token response.

#### `GET /api/sdk/identity/:did`

Public DID resolver, minimal response, CDN-cacheable (5 min).

---

#### `GET /api/sdk/auth-status/:sessionId`

Polling endpoint for the QR-based web login flow. Called by the `/login` page every 2 seconds after the QR is displayed.

| Field | Value |
|---|---|
| Auth | None |
| Rate limit | 30 req/min per `sessionId` |

**Response 200:**
```json
{
  "status": "pending"
}
```
```json
{
  "status": "approved",
  "accessToken": "eyJhbGci...",
  "expiresIn": 900
}
```
```json
{ "status": "denied" }
```
```json
{ "status": "expired" }
```

**Response schema:**
```ts
{
  status:       'pending' | 'approved' | 'denied' | 'expired';
  accessToken?: string;   // only present when status === 'approved'
  expiresIn?:   number;   // only present when status === 'approved'
}
```

**Behavior:**
1. Look up `session:{sessionId}` in Redis.
2. If not found → return `{ status: 'expired' }`.
3. If found and `revokedAt` is set → return `{ status: 'denied' }`.
4. If found and `accessTokenJti` is set (i.e. access token has been issued) → return `{ status: 'approved', accessToken, expiresIn: 900 }`.
5. Otherwise → return `{ status: 'pending' }`.

**Note:** `accessToken` is returned directly here for the web QR flow. The mobile app receives its token via the `POST /api/auth/verify` response; this endpoint is only used by the web poller.

---

### `/api/admin/*`

All admin endpoints require JWT with `role: "admin"` claim.

#### `GET /api/admin/stats`

Platform-wide stats.
```json
{
  "totalTenants":     48,
  "totalIdentities":  12483,
  "totalAuths":       89234,
  "activeSessions":   3421,
  "blockchainQueue":  { "waiting": 3, "active": 1, "failed": 0 },
  "webhookQueue":     { "waiting": 12, "active": 4, "failed": 1 }
}
```

#### `GET /api/admin/tenants`

Paginated list of all tenants. Query params: `page`, `limit`, `plan`, `active`.

#### `GET /api/admin/tenants/:clientId`

Full tenant record + recent audit events.

#### `PATCH /api/admin/tenants/:clientId`

Update tenant plan, limits, active status, admin notes.

#### `GET /api/admin/audit`

Platform-wide audit log. Filterable by `did`, `tenantId`, `event`, `dateFrom`, `dateTo`.

#### `DELETE /api/admin/tenants/:clientId`

Deactivate a tenant (sets `active: false`).

---

### `/health` and `/api/stats`

#### `GET /health`

```json
{
  "status":   "ok",
  "uptime":   12345,
  "mongo":    "connected",
  "redis":    "connected",
  "version":  "2.0.0"
}
```

#### `GET /api/stats`

Public platform stats (same as v1 for backwards compat):
```json
{
  "success":             true,
  "totalIdentities":     12483,
  "totalAuthentications":89234,
  "activeChallenges":    7
}
```

---

### `GET /.well-known/jwks.json`

Returns the RS256 public key in JWKS format. Used by SDK and third parties to verify access tokens without calling the backend.

```json
{
  "keys": [{
    "kty": "RSA",
    "use": "sig",
    "kid": "idkitty-2025-01",
    "alg": "RS256",
    "n":   "...",
    "e":   "AQAB"
  }]
}
```

---

## Security Spec

### JWT — RS256 Asymmetric

```js
// src/config/jwt.config.js
import fs from 'fs';

export const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY
  ? Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('utf8')
  : fs.readFileSync('./keys/private.pem', 'utf8');

export const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY
  ? Buffer.from(process.env.JWT_PUBLIC_KEY, 'base64').toString('utf8')
  : fs.readFileSync('./keys/public.pem', 'utf8');

export const ACCESS_TOKEN_TTL   = 15 * 60;          // 15 minutes
export const REFRESH_TOKEN_TTL  = 30 * 24 * 60 * 60; // 30 days
export const KEY_ID             = 'idkitty-2025-01';
```

```js
// src/services/jwt.service.js
import jwt from 'jsonwebtoken';
import { JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, ACCESS_TOKEN_TTL, KEY_ID } from '../config/jwt.config.js';
import crypto from 'crypto';

export const issueAccessToken = (did, claims, tenantId) => {
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign(
    { sub: did, claims, tenantId, jti, type: 'access' },
    JWT_PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: ACCESS_TOKEN_TTL, keyid: KEY_ID }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] });
};

export const issueRefreshToken = () => {
  return `rt_${crypto.randomBytes(32).toString('hex')}`;
};

export const getJWKS = () => {
  // Convert RSA public key PEM to JWKS format
  const key = crypto.createPublicKey(JWT_PUBLIC_KEY);
  const jwk = key.export({ format: 'jwk' });
  return {
    keys: [{ ...jwk, use: 'sig', kid: KEY_ID, alg: 'RS256' }]
  };
};
```

---

### Rate Limiting

```js
// src/middleware/rateLimiter.js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const limiters = {
  general: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1m') }),
  auth:    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1m') }),
  authHour:new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1h') }),
  register:new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1m') }),
};

export const rateLimitMiddleware = (limiterName, keyFn) => async (req, res, next) => {
  const key = keyFn(req);
  const { success, limit, remaining, reset } = await limiters[limiterName].limit(key);

  res.setHeader('X-RateLimit-Limit',     limit);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset',     reset);

  if (!success) {
    return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', retryAfter: Math.ceil((reset - Date.now()) / 1000) });
  }
  next();
};

// Usage:
// router.post('/verify', rateLimitMiddleware('auth', req => `auth:${req.body.did}`), handler)
```

---

### Tenant Authentication Middleware

```js
// src/middleware/tenantAuth.js
import bcrypt from 'bcrypt';
import Tenant from '../models/Tenant.model.js';

export const tenantAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Basic ')) {
    return res.status(401).json({ error: 'MISSING_TENANT_CREDENTIALS' });
  }

  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  const [clientId, clientSecret] = decoded.split(':');

  if (!clientId || !clientSecret) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS_FORMAT' });
  }

  const tenant = await Tenant.findOne({ clientId, active: true }).lean();
  if (!tenant) {
    return res.status(401).json({ error: 'TENANT_NOT_FOUND' });
  }

  const match = await bcrypt.compare(clientSecret, tenant.clientSecret);
  if (!match) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  req.tenant = tenant;
  next();
};
```

---

### Webhook Delivery with HMAC Signing

```js
// src/services/webhook.service.js
import crypto from 'crypto';

export const signWebhookPayload = (payload, secret) => {
  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return `sha256=${signature}`;
};

export const buildWebhookPayload = (event, data, tenantId) => ({
  event,
  tenantId,
  timestamp: new Date().toISOString(),
  data,
});
```

```js
// src/queues/webhook.queue.js
import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../services/redis.service.js';
import { signWebhookPayload } from '../services/webhook.service.js';
import fetch from 'node-fetch';
import Tenant from '../models/Tenant.model.js';
import logger from '../utils/logger.js';

export const webhookQueue = new Queue('webhook-delivery', { connection: redisConnection });

export const webhookWorker = new Worker('webhook-delivery', async (job) => {
  const { tenantId, event, data } = job.data;

  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant?.webhookConfig?.url || !tenant.webhookConfig.enabled) return;
  if (!tenant.webhookConfig.events.includes(event)) return;

  const payload = { event, tenantId: tenant.clientId, timestamp: new Date().toISOString(), data };
  const signature = signWebhookPayload(payload, tenant.webhookConfig.secret);

  const response = await fetch(tenant.webhookConfig.url, {
    method:  'POST',
    headers: {
      'Content-Type':       'application/json',
      'X-IDKitty-Signature': signature,
      'X-IDKitty-Event':     event,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }

  await Tenant.updateOne({ _id: tenantId }, {
    'webhookConfig.lastDeliveredAt': new Date(),
    'webhookConfig.failCount': 0,
  });

}, {
  connection: redisConnection,
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
});

webhookWorker.on('failed', async (job, err) => {
  logger.error('Webhook delivery failed', { jobId: job.id, error: err.message });
  await Tenant.updateOne(
    { _id: job.data.tenantId },
    { $inc: { 'webhookConfig.failCount': 1 } }
  );
});
```

---

### Blockchain Queue

```js
// src/queues/blockchain.queue.js
import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../services/redis.service.js';
import { registerOnChain, rotateKeyOnChain, revokeDIDOnChain } from '../services/blockchain.service.js';
import Identity from '../models/Identity.model.js';
import logger from '../utils/logger.js';

export const blockchainQueue = new Queue('blockchain-writes', { connection: redisConnection });

export const blockchainWorker = new Worker('blockchain-writes', async (job) => {
  const { type, did, payload } = job.data;

  let txHash;
  switch (type) {
    case 'REGISTER':
      txHash = await registerOnChain(did, payload.publicKey, payload.chain);
      await Identity.updateOne({ did }, { txHash, blockchainStatus: 'confirmed' });
      break;

    case 'ROTATE_KEY':
      txHash = await rotateKeyOnChain(did, payload.newPublicKey, payload.chain);
      await Identity.updateOne({ did }, { 'blockchainStatus': 'confirmed' });
      break;

    case 'REVOKE':
      txHash = await revokeDIDOnChain(did, payload.chain);
      await Identity.updateOne({ did }, { blockchainStatus: 'confirmed' });
      break;
  }

  logger.info('Blockchain write confirmed', { type, did, txHash });

}, {
  connection: redisConnection,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});

blockchainWorker.on('failed', async (job, err) => {
  logger.error('Blockchain write failed permanently', { job: job.data, error: err.message });
  await Identity.updateOne({ did: job.data.did }, { blockchainStatus: 'failed' });
  // TODO: alert admin via webhook dead-letter notification
});
```

---

### Redis Service

```js
// src/services/redis.service.js
import { Redis } from 'ioredis';

export const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,   // required by BullMQ
  enableReadyCheck:     false,
  lazyConnect:          true,
});

export const redisConnection = { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT };

// Challenge store
export const setChallenge = (did, tenantId, challenge) =>
  redisClient.set(`challenge:${did}:${tenantId}`, challenge, 'EX', 60);

export const getChallenge = (did, tenantId) =>
  redisClient.get(`challenge:${did}:${tenantId}`);

export const deleteChallenge = (did, tenantId) =>
  redisClient.del(`challenge:${did}:${tenantId}`);

export const getActiveChallengeCount = () =>
  redisClient.keys('challenge:*').then(keys => keys.length);

// Session store
export const setSession = (sessionId, payload, ttlSeconds) =>
  redisClient.set(`session:${sessionId}`, JSON.stringify(payload), 'EX', ttlSeconds);

export const getSession = async (sessionId) => {
  const raw = await redisClient.get(`session:${sessionId}`);
  return raw ? JSON.parse(raw) : null;
};

export const deleteSession = (sessionId) =>
  redisClient.del(`session:${sessionId}`);

export const revokeAllSessionsForDID = async (did) => {
  const keys = await redisClient.keys(`session:did:${did}:*`);
  if (keys.length) await redisClient.del(...keys);
};
```

---

## SDK Package — `@idkitty/sdk`

### `sdk/package.json`

```json
{
  "name": "@idkitty/sdk",
  "version": "2.0.0",
  "description": "IDKitty Authentication SDK — decentralized, passwordless auth for any app",
  "type": "module",
  "main":    "./dist/index.cjs",
  "module":  "./dist/index.mjs",
  "types":   "./dist/index.d.ts",
  "exports": {
    ".": {
      "import":  "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types":   "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --minify",
    "test":  "vitest"
  },
  "devDependencies": {
    "tsup":       "^8.0.0",
    "typescript": "^5.0.0",
    "vitest":     "^1.0.0"
  }
}
```

### `sdk/src/types.ts`

```ts
export interface IDKittyConfig {
  clientId: string;
  baseUrl?:  string;   // default: 'https://api.idkitty.io'
}

export interface KeyPair {
  did:        string;
  publicKey:  string;  // hex-encoded uncompressed P-256
  privateKey: string;  // hex-encoded pkcs8
}

export interface AuthResult {
  accessToken:  string;
  refreshToken: string;
  sessionId:    string;
  expiresIn:    number;
  did:          string;
  username:     string | null;   // null if identity has not yet claimed a username
}

export interface TokenClaims {
  sub:      string;    // DID
  claims:   { name?: string; email?: string };
  tenantId: string;
  username: string | null;       // null if identity has not yet claimed a username
  jti:      string;
  iat:      number;
  exp:      number;
}

export interface Identity {
  did:         string;
  publicKey:   string;
  keyVersion:  number;
  claims:      Record<string, string>;
  createdAt:   string;
  revokedAt:   string | null;
  didDocument: object;
}

export interface SDKError {
  code:    string;
  message: string;
  status?: number;
}
```

### `sdk/src/crypto.ts`

```ts
import type { KeyPair } from './types.js';

const bufToHex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

const hexToBuf = (hex: string): ArrayBuffer =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16))).buffer;

export async function generateKeyPair(chain = 'polygon-amoy'): Promise<KeyPair> {
  const kp = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  const pubRaw  = await window.crypto.subtle.exportKey('raw',   kp.publicKey);
  const privPkcs = await window.crypto.subtle.exportKey('pkcs8', kp.privateKey);
  const pubHex = bufToHex(pubRaw);
  return {
    did:        `did:idkitty:${chain}:${pubHex.slice(2, 22)}`,
    publicKey:  pubHex,
    privateKey: bufToHex(privPkcs),
  };
}

export async function signChallenge(challenge: string, privateKeyHex: string): Promise<string> {
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    hexToBuf(privateKeyHex),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(challenge)
  );
  return bufToHex(signature);
}
```

### `sdk/src/jwks.ts`

```ts
import type { TokenClaims } from './types.js';

let cachedJWKS: CryptoKey | null = null;
let cachedAt = 0;

async function getPublicKey(jwksUri: string): Promise<CryptoKey> {
  if (cachedJWKS && Date.now() - cachedAt < 5 * 60 * 1000) return cachedJWKS;

  const res = await fetch(jwksUri);
  const { keys } = await res.json() as { keys: JsonWebKey[] };
  const key = await crypto.subtle.importKey(
    'jwk',
    keys[0],
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  cachedJWKS = key;
  cachedAt   = Date.now();
  return key;
}

export async function verifyToken(token: string, jwksUri: string): Promise<TokenClaims> {
  const [headerB64, payloadB64, sigB64] = token.split('.');
  const key = await getPublicKey(jwksUri);

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig  = Uint8Array.from(atob(sigB64.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));

  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data);
  if (!valid) throw new Error('TOKEN_INVALID');

  const claims = JSON.parse(atob(payloadB64)) as TokenClaims;
  if (claims.exp < Date.now() / 1000) throw new Error('TOKEN_EXPIRED');
  return claims;
}
```

### `sdk/src/client.ts`

```ts
import { signChallenge, generateKeyPair } from './crypto.js';
import { verifyToken } from './jwks.js';
import type { IDKittyConfig, AuthResult, Identity, KeyPair, TokenClaims } from './types.js';

export class IDKittyClient {
  private clientId:  string;
  private baseUrl:   string;
  private jwksUri:   string;

  constructor(config: IDKittyConfig) {
    this.clientId = config.clientId;
    this.baseUrl  = config.baseUrl ?? 'https://api.idkitty.io';
    this.jwksUri  = `${this.baseUrl}/.well-known/jwks.json`;
  }

  async authenticate(did: string, privateKeyHex: string): Promise<AuthResult> {
    // 1. Fetch challenge
    const challengeRes = await fetch(
      `${this.baseUrl}/api/sdk/challenge/${encodeURIComponent(did)}?tenantId=${this.clientId}`
    );
    if (!challengeRes.ok) throw await this._error(challengeRes, 'CHALLENGE_FETCH_FAILED');
    const { challenge } = await challengeRes.json() as { challenge: string };

    // 2. Sign challenge client-side
    const signature = await signChallenge(challenge, privateKeyHex);

    // 3. Verify
    const verifyRes = await fetch(`${this.baseUrl}/api/sdk/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did, signature, tenantId: this.clientId }),
    });
    if (!verifyRes.ok) throw await this._error(verifyRes, 'AUTH_FAILED');
    return verifyRes.json() as Promise<AuthResult>;
  }

  async generateIdentity(chain = 'polygon-amoy'): Promise<KeyPair> {
    return generateKeyPair(chain);
  }

  async verifyToken(jwt: string): Promise<TokenClaims> {
    return verifyToken(jwt, this.jwksUri);
  }

  async resolveIdentity(did: string): Promise<Identity> {
    const res = await fetch(`${this.baseUrl}/api/sdk/identity/${encodeURIComponent(did)}`);
    if (!res.ok) throw await this._error(res, 'IDENTITY_NOT_FOUND');
    return res.json() as Promise<Identity>;
  }

  async resolveUsername(username: string): Promise<Identity> {
    const clean = username.startsWith('@') ? username.slice(1) : username;
    const res = await fetch(
      `${this.baseUrl}/api/identity/username/${encodeURIComponent(clean)}`
    );
    if (!res.ok) throw await this._error(res, 'USERNAME_NOT_FOUND');
    return res.json() as Promise<Identity>;
  }

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const clean = username.startsWith('@') ? username.slice(1) : username;
    const res = await fetch(
      `${this.baseUrl}/api/identity/username/${encodeURIComponent(clean)}/available`
    );
    if (!res.ok) return false;
    const data = await res.json() as { available: boolean };
    return data.available;
  }

  private async _error(res: Response, code: string) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    return { code: (body.error as string) ?? code, message: String(body.message ?? res.statusText), status: res.status };
  }
}
```

### `sdk/src/index.ts`

```ts
export { IDKittyClient } from './client.js';
export { generateKeyPair, signChallenge } from './crypto.js';
export { verifyToken } from './jwks.js';
export type {
  IDKittyConfig,
  KeyPair,
  AuthResult,
  Identity,
  TokenClaims,
  SDKError,
} from './types.js';

// Convenience factory
export const createIDKitty = (config: IDKittyConfig) => new IDKittyClient(config);
```

**SDK usage example:**
```ts
import { createIDKitty } from '@idkitty/sdk';

const idkitty = createIDKitty({ clientId: 'client_xxx' });

// Generate identity (once, store keys securely)
const identity = await idkitty.generateIdentity();

// Authenticate (on every login)
const { accessToken, refreshToken } = await idkitty.authenticate(identity.did, identity.privateKey);

// Verify a token server-side (or in another service)
const claims = await idkitty.verifyToken(accessToken);
console.log(claims.sub); // did:idkitty:polygon-amoy:0x...
```

---

## `.env.example`

```env
# ─── Server ──────────────────────────────────────────────────────────────────
PORT=5001
NODE_ENV=development

# ─── MongoDB ─────────────────────────────────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/idkitty_v2

# ─── Redis ───────────────────────────────────────────────────────────────────
# Option A: Upstash (recommended for production)
UPSTASH_REDIS_URL=https://<id>.upstash.io
UPSTASH_REDIS_TOKEN=<token>

# Option B: Self-hosted (for BullMQ workers — requires raw Redis URL)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# ─── JWT (RS256) ─────────────────────────────────────────────────────────────
# Generate with: node scripts/generate-keypair.js
# Store as base64-encoded PEM in env vars
JWT_PRIVATE_KEY=<base64-encoded RSA private key PEM>
JWT_PUBLIC_KEY=<base64-encoded RSA public key PEM>
JWT_KEY_ID=idkitty-2025-01

# ─── Blockchain ──────────────────────────────────────────────────────────────
# Polygon Amoy testnet
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_AMOY_CONTRACT=0x<DIDRegistryV2 address on Amoy>
POLYGON_AMOY_PRIVATE_KEY=<wallet private key — testnet only>

# Polygon mainnet
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com
POLYGON_MAINNET_CONTRACT=0x<DIDRegistryV2 address on mainnet>
POLYGON_MAINNET_PRIVATE_KEY=<wallet private key — KEEP SECURE>

# Base mainnet
BASE_MAINNET_RPC_URL=https://mainnet.base.org
BASE_MAINNET_CONTRACT=0x<DIDRegistryV2 address on Base>
BASE_MAINNET_PRIVATE_KEY=<wallet private key>

# Base Sepolia testnet
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_SEPOLIA_CONTRACT=0x<DIDRegistryV2 address on Base Sepolia>
BASE_SEPOLIA_PRIVATE_KEY=<wallet private key>

# ─── CORS ────────────────────────────────────────────────────────────────────
# Default allowed origin for non-tenant routes
DEFAULT_CORS_ORIGIN=http://localhost:3000

# ─── Admin ───────────────────────────────────────────────────────────────────
ADMIN_CLIENT_ID=client_admin_internal
ADMIN_CLIENT_SECRET=<strong secret>

# ─── Logging ─────────────────────────────────────────────────────────────────
LOG_LEVEL=info
AXIOM_TOKEN=<Axiom ingest token>
AXIOM_DATASET=idkitty-logs

# ─── Feature Flags ───────────────────────────────────────────────────────────
BLOCKCHAIN_WRITES_ENABLED=true
WEBHOOK_DELIVERY_ENABLED=true
```

---

## `fly.toml`

```toml
app = "idkitty-backend"
primary_region = "sin"   # Singapore — closest to India

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT     = "8080"

[http_service]
  internal_port        = 8080
  force_https          = true
  auto_stop_machines   = true
  auto_start_machines  = true
  min_machines_running = 1

  [http_service.concurrency]
    type       = "requests"
    hard_limit = 250
    soft_limit = 200

[[vm]]
  cpu_kind = "shared"
  cpus     = 1
  memory   = "512mb"

[processes]
  app    = "node server.js"
  worker = "node src/queues/worker-entry.js"

[[services.ports]]
  port     = 443
  handlers = ["tls", "http"]

[[services.ports]]
  port     = 80
  handlers = ["http"]
```

---

## Multi-chain Config

```js
// src/config/chains.config.js
export const SUPPORTED_CHAINS = {
  'polygon-amoy': {
    chainId:      80002,
    rpcUrl:       process.env.POLYGON_AMOY_RPC_URL,
    contractAddr: process.env.POLYGON_AMOY_CONTRACT,
    privateKey:   process.env.POLYGON_AMOY_PRIVATE_KEY,
    explorerUrl:  'https://amoy.polygonscan.com',
    isTestnet:    true,
  },
  'polygon-mainnet': {
    chainId:      137,
    rpcUrl:       process.env.POLYGON_MAINNET_RPC_URL,
    contractAddr: process.env.POLYGON_MAINNET_CONTRACT,
    privateKey:   process.env.POLYGON_MAINNET_PRIVATE_KEY,
    explorerUrl:  'https://polygonscan.com',
    isTestnet:    false,
  },
  'base-mainnet': {
    chainId:      8453,
    rpcUrl:       process.env.BASE_MAINNET_RPC_URL,
    contractAddr: process.env.BASE_MAINNET_CONTRACT,
    privateKey:   process.env.BASE_MAINNET_PRIVATE_KEY,
    explorerUrl:  'https://basescan.org',
    isTestnet:    false,
  },
  'base-sepolia': {
    chainId:      84532,
    rpcUrl:       process.env.BASE_SEPOLIA_RPC_URL,
    contractAddr: process.env.BASE_SEPOLIA_CONTRACT,
    privateKey:   process.env.BASE_SEPOLIA_PRIVATE_KEY,
    explorerUrl:  'https://sepolia.basescan.org',
    isTestnet:    true,
  },
};

export const getChainConfig = (chain) => {
  const config = SUPPORTED_CHAINS[chain];
  if (!config) throw new Error(`Unsupported chain: ${chain}`);
  return config;
};
```

---

## Blockchain Service (Multi-chain)

```js
// src/services/blockchain.service.js
import { ethers } from 'ethers';
import { createRequire } from 'module';
import { getChainConfig } from '../config/chains.config.js';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);
const DIDRegistryV2 = require('../contracts/DIDRegistryV2.json');

const contractInstances = {};

const getContract = (chain) => {
  if (contractInstances[chain]) return contractInstances[chain];
  const { rpcUrl, contractAddr, privateKey } = getChainConfig(chain);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet   = new ethers.Wallet(privateKey, provider);
  contractInstances[chain] = new ethers.Contract(contractAddr, DIDRegistryV2.abi, wallet);
  return contractInstances[chain];
};

export const registerOnChain = async (did, publicKey, chain = 'polygon-amoy') => {
  const contract = getContract(chain);
  const tx = await contract.registerDID(did, publicKey);
  const receipt = await tx.wait(1);
  logger.info('DID registered on-chain', { did, txHash: receipt.hash, chain });
  return receipt.hash;
};

export const rotateKeyOnChain = async (did, newPublicKey, chain = 'polygon-amoy') => {
  const contract = getContract(chain);
  const tx = await contract.rotateKey(did, newPublicKey);
  const receipt = await tx.wait(1);
  logger.info('Key rotated on-chain', { did, txHash: receipt.hash, chain });
  return receipt.hash;
};

export const revokeDIDOnChain = async (did, chain = 'polygon-amoy') => {
  const contract = getContract(chain);
  const tx = await contract.revokeDID(did);
  const receipt = await tx.wait(1);
  logger.info('DID revoked on-chain', { did, txHash: receipt.hash, chain });
  return receipt.hash;
};
```
