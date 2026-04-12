# IDKitty v1 — Backend Spec

> Builds on the v0 Express + MongoDB codebase. No new infrastructure. All additions are backwards-compatible with the existing data.

---

## 1. Tech Stack Changes from v0

| Layer | v0 | v1 |
|---|---|---|
| JWT | HS256 (`jsonwebtoken`) | **RS256** (`jsonwebtoken`) |
| Rate limiting | None | **`express-rate-limit`** (in-process) |
| New dependency | — | **`bcryptjs`** (refresh token hashing) |
| Challenges | In-memory `Map` | In-memory `Map` (unchanged) |
| Sessions | None | Refresh tokens on Identity document |

No Redis. No BullMQ. No TypeScript. No Fly.io.

---

## 2. Data Models

### 2.1 Identity (extended)

All v0 fields remain. New fields added:

```js
// src/models/identity.model.js

{
  did:               { type: String, required: true, unique: true },
  publicKey:         { type: String, required: true },           // current active key (hex)

  // NEW
  keyHistory:        [{ publicKey: String, rotatedAt: Date }],   // archived keys
  keyType:           { type: String, default: 'EC-P256' },       // hardcoded for now

  claims: {
    name:  String,
    email: String,
  },

  // NEW
  username:          { type: String, sparse: true, unique: true, lowercase: true },
  usernameChangedAt: Date,

  // NEW — refresh token store (bcrypt-hashed, TTL enforced in application code)
  refreshTokens: [{
    hash:      String,   // bcrypt hash of the raw token
    expiresAt: Date,     // 30 days from issuance
  }],

  txHash:            String,
  authCount:         { type: Number, default: 0 },

  // NEW
  revokedAt:         Date,   // set when identity is revoked; null = active

  createdAt:         { type: Date, default: Date.now },
  updatedAt:         Date,
}

// Indexes
// { did: 1 }           — unique (already exists)
// { username: 1 }      — unique sparse (new)
```

### 2.2 AuditLog (new collection)

```js
// src/models/auditLog.model.js

{
  did:       { type: String, required: true, index: true },
  event:     {
    type: String,
    enum: [
      'REGISTERED',
      'AUTH_SUCCESS',
      'AUTH_FAILED',
      'KEY_ROTATED',
      'USERNAME_CLAIMED',
      'USERNAME_CHANGED',
      'IDENTITY_REVOKED',
      'SESSION_REVOKED',
    ],
    required: true,
  },
  ip:        String,
  userAgent: String,
  metadata:  Object,   // e.g. { newUsername: 'alice' }, { reason: 'wrong_signature' }
  timestamp: { type: Date, default: Date.now },
}

// Compound index: { did: 1, timestamp: -1 }
```

---

## 3. Services

### 3.1 `jwt.service.js` (replace existing)

```js
// src/services/jwt.service.js

// Load RSA private key from JWT_PRIVATE_KEY env var (base64-encoded PEM)
// Derive public key from private key using Node crypto

signAccessToken(payload)      // RS256, 15-minute expiry
                               // payload: { sub: did, username, iat, exp, jti }

signRefreshToken(did)          // random 64-byte hex string (NOT a JWT — raw token)
                               // caller bcrypt-hashes before storing

verifyAccessToken(token)       // throws on invalid/expired

buildJWKS()                    // returns { keys: [ RSA public key as JWK ] }
                               // includes: kty, use, alg, kid, n, e
```

**Environment variables:**
```
JWT_PRIVATE_KEY=<base64-encoded RSA-2048 PEM private key>
JWT_KID=<arbitrary string, e.g. "v1-2024">
```

**Utility script:**
```
scripts/generate-keypair.js
```
Generates an RSA-2048 key pair and prints `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` as base64 env vars ready to paste into `.env`.

### 3.2 `crypto.service.js` (unchanged from v0)

```js
generateChallenge()           // 32-byte random hex string
verifySignature(challenge, signature, publicKeyHex)  // ECDSA-P256 via crypto.webcrypto.subtle
```

### 3.3 `audit.service.js` (new)

```js
// src/services/audit.service.js

writeLog({ did, event, ip, userAgent, metadata })
// Fire-and-forget: wraps AuditLog.create() in setImmediate; never blocks the request
// Logs errors to console but does not throw
```

Call pattern in route handlers:
```js
setImmediate(() => auditService.writeLog({ did, event: 'AUTH_SUCCESS', ip: req.ip, userAgent: req.get('user-agent') }));
```

---

## 4. Middleware

### 4.1 `verifyJWT.js` (new)

```js
// src/middleware/verifyJWT.js
// Reads Authorization: Bearer <token>
// Calls jwtService.verifyAccessToken(token)
// Attaches decoded payload to req.user = { sub: did, username, jti, ... }
// Returns 401 on missing/invalid token
```

### 4.2 `rateLimiter.js` (new)

```js
// src/middleware/rateLimiter.js
// Uses express-rate-limit

challengeLimiter   // windowMs: 60_000, max: 10, keyGenerator: req.ip
verifyLimiter      // windowMs: 60_000, max: 5,  keyGenerator: req.ip
```

Applied in route definitions:
```js
router.get('/challenge/:did', challengeLimiter, challengeController);
router.post('/verify', verifyLimiter, verifyController);
```

---

## 5. API Endpoints

### 5.1 Identity Endpoints

#### `POST /api/identity/register` (unchanged from v0)

No changes to request/response. Internally: also writes `REGISTERED` audit log.

```js
// After existing MongoDB save:
setImmediate(() => auditService.writeLog({ did, event: 'REGISTERED', ip: req.ip, userAgent: req.get('user-agent') }));
```

---

#### `GET /api/identity/:did` (unchanged from v0)

Returns existing response. Now also includes `username` and `keyHistory` length:

```json
{
  "did": "did:idkitty:0x1a2b3c...",
  "publicKey": "04ab...",
  "username": "alice",
  "claims": { "name": "Alice", "email": "alice@example.com" },
  "keyVersion": 2,
  "txHash": "0xabc...",
  "authCount": 12,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

`keyVersion` = `keyHistory.length + 1` (derived, not stored).

---

#### `POST /api/identity/:did/username`

Claim or change the username for a DID. JWT-protected.

**Request:**
```json
{ "username": "alice" }
```

**Validation:**
- Format: `/^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$/` — 3–20 chars, alphanumeric + underscores, no leading/trailing underscore
- Reserved words: `admin, idkitty, support, help, system, root, api, null, undefined, wallet, did, identity, auth, login, signup, register, me, self`
- Uniqueness: check `Identity` collection
- 30-day cooldown: `usernameChangedAt` must be null or > 30 days ago; return 429 with `cooldownUntil` if too soon

**Response 200:**
```json
{ "username": "alice", "claimedAt": "2024-01-01T00:00:00Z" }
```

**Errors:** 400 (invalid format), 409 (taken), 403 (reserved), 429 (cooldown), 401 (no JWT)

**Audit:** `USERNAME_CLAIMED` (first claim) or `USERNAME_CHANGED` (subsequent change)

---

#### `GET /api/identity/username/:username`

Resolve a username to a full identity. Public endpoint.

**Response 200:** Same shape as `GET /api/identity/:did`.

**Errors:** 404 (not found)

> **Router note:** Mount this route *before* `GET /api/identity/:did` so `username` doesn't get captured as a DID param. Or use a `/by-username/:username` path.

---

#### `GET /api/identity/username/:username/available`

Check if a username is available. Public endpoint.

**Response 200:**
```json
{
  "username": "alice",
  "available": false,
  "reason": "taken"   // "taken" | "reserved" | "invalid_format" | null (if available)
}
```

---

#### `POST /api/identity/:did/rotate-key`

Replace the current signing key. JWT-protected (the `sub` in the JWT must match `:did`).

**Request:**
```json
{ "newPublicKey": "04cd..." }
```

**Steps:**
1. Load identity; reject if revoked
2. Move `publicKey` to `keyHistory[]` with `rotatedAt: now`
3. Set `publicKey = newPublicKey`
4. Clear `refreshTokens[]` (all existing sessions invalidated)
5. Save identity
6. Fire-and-forget: `blockchainService.rotateKey(did, newPublicKey)`
7. Write `KEY_ROTATED` audit log

**Response 200:**
```json
{
  "did": "did:idkitty:0x...",
  "newPublicKey": "04cd...",
  "keyVersion": 3,
  "rotatedAt": "2024-01-01T00:00:00Z"
}
```

**Errors:** 401 (no JWT or DID mismatch), 404 (DID not found), 410 (revoked)

---

#### `POST /api/identity/:did/revoke`

Permanently revoke an identity. JWT-protected (sub must match did).

**Request:** No body required.

**Steps:**
1. Set `revokedAt = now`
2. Clear `refreshTokens[]`
3. Save identity
4. Write `IDENTITY_REVOKED` audit log

**Response 200:**
```json
{ "did": "did:idkitty:0x...", "revokedAt": "2024-01-01T00:00:00Z" }
```

**Errors:** 401, 404, 410 (already revoked)

---

#### `GET /api/identity/:did/audit`

Paginated audit log for the identity owner. JWT-protected (sub must match did).

**Query params:** `?page=1&limit=25&event=AUTH_SUCCESS`

**Response 200:**
```json
{
  "did": "did:idkitty:0x...",
  "total": 84,
  "page": 1,
  "pages": 4,
  "events": [
    {
      "event": "AUTH_SUCCESS",
      "ip": "1.2.3.4",
      "metadata": {},
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

Query: `AuditLog.find({ did }).sort({ timestamp: -1 }).skip((page-1)*limit).limit(limit)`

**Errors:** 401 (no JWT or DID mismatch), 404

---

### 5.2 Auth Endpoints

#### `GET /api/auth/challenge/:did` (modified)

Same as v0 but now rejects revoked identities.

**New behavior:**
- Load identity; if `revokedAt` is set → 410 `{ "error": "identity_revoked" }`
- Otherwise: same challenge generation + in-memory storage as v0

Rate limited: 10 requests/min per IP.

---

#### `POST /api/auth/verify` (modified)

Same signature verification as v0. **Now returns refresh token in addition to access token.**

**Request:** Same as v0 — `{ did, signature }`

**Steps:**
1. Load identity; reject if revoked
2. Fetch + delete challenge from in-memory store (unchanged)
3. Verify ECDSA-P256 signature (unchanged)
4. Generate RS256 access token (15 min)
5. Generate raw refresh token (64 random hex bytes)
6. Bcrypt-hash the refresh token and push to `identity.refreshTokens[]`
7. Prune expired tokens from the array before saving
8. Increment `authCount`
9. Write `AUTH_SUCCESS` or `AUTH_FAILED` audit log

**Response 200:**
```json
{
  "accessToken": "<RS256 JWT>",
  "refreshToken": "<64-byte hex string>",
  "expiresIn": 900,
  "did": "did:idkitty:0x..."
}
```

Rate limited: 5 requests/min per IP.

---

#### `POST /api/auth/refresh` (new)

Exchange a valid refresh token for a new access token. Public endpoint (the refresh token IS the credential).

**Request:**
```json
{ "did": "did:idkitty:0x...", "refreshToken": "<64-byte hex>" }
```

**Steps:**
1. Load identity; reject if revoked
2. Filter `refreshTokens[]` to remove any expired entries
3. Find a token where `bcrypt.compare(refreshToken, entry.hash)` passes and `entry.expiresAt > now`
4. If not found → 401
5. Issue new RS256 access token
6. (Do NOT rotate the refresh token in v1 — rotation is a v1.5 improvement)

**Response 200:**
```json
{
  "accessToken": "<RS256 JWT>",
  "expiresIn": 900
}
```

**Errors:** 401 (invalid or expired refresh token), 410 (identity revoked)

---

#### `POST /api/auth/revoke-session` (new)

Invalidate a specific refresh token. JWT-protected.

**Request:**
```json
{ "refreshToken": "<64-byte hex>" }
```

**Steps:**
1. Load identity (from `req.user.sub`)
2. Filter out the matching token using bcrypt.compare
3. Save identity
4. Write `SESSION_REVOKED` audit log

**Response 200:**
```json
{ "revoked": true }
```

**Errors:** 401, 404 (token not found in array)

---

### 5.3 JWKS Endpoint (new)

#### `GET /.well-known/jwks.json`

Public. No auth. CDN-cacheable.

**Response 200:**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "v1-2024",
      "n": "<base64url modulus>",
      "e": "AQAB"
    }
  ]
}
```

Response headers:
```
Cache-Control: public, max-age=3600
```

---

### 5.4 Stats Endpoint (unchanged)

`GET /api/stats` — public, returns aggregate counts from MongoDB. No changes.

---

## 6. Blockchain Service (modified)

```js
// src/services/blockchain.service.js

registerDID(did, publicKey)     // unchanged from v0
rotateKey(did, newPublicKey)    // NEW — calls DIDRegistry.rotateKey(did, newPublicKey)
```

Both calls are fire-and-forget:
```js
setImmediate(() => blockchainService.rotateKey(did, newPublicKey).catch(console.error));
```

Update `CONTRACT_ADDRESS` env var to the new DIDRegistry v1 deployment address.

---

## 7. Environment Variables

All v0 vars remain. Additions:

```
# JWT (RS256)
JWT_PRIVATE_KEY=<base64-encoded RSA-2048 PKCS8 PEM>
JWT_KID=v1-2024

# These REPLACE the v0 JWT_SECRET var:
# Remove: JWT_SECRET=...
```

---

## 8. Implementation Checklist

### Auth Hardening
- [ ] `scripts/generate-keypair.js` — generate RSA-2048 key pair, print base64 env vars
- [ ] `src/services/jwt.service.js` — RS256 sign/verify + JWKS builder
- [ ] `GET /.well-known/jwks.json` route
- [ ] Update `POST /api/auth/verify` — RS256 access token + refresh token issuance
- [ ] `POST /api/auth/refresh` route + controller
- [ ] `POST /api/auth/revoke-session` route + controller
- [ ] `src/middleware/rateLimiter.js` — challenge + verify limiters
- [ ] Apply rate limiters in auth router

### Identity Lifecycle
- [ ] Update `Identity.model.js` — add `keyHistory`, `keyType`, `username`, `usernameChangedAt`, `refreshTokens`, `revokedAt`; add username sparse index
- [ ] `POST /api/identity/:did/rotate-key` route + controller
- [ ] `POST /api/identity/:did/revoke` route + controller
- [ ] Update `GET /api/auth/challenge/:did` — reject revoked identities
- [ ] Update `POST /api/auth/verify` — reject revoked identities
- [ ] Update `GET /api/identity/:did` — include `username`, `keyVersion` in response

### Username System
- [ ] `POST /api/identity/:did/username` route + controller (claim/change + cooldown)
- [ ] `GET /api/identity/username/:username` route + controller
- [ ] `GET /api/identity/username/:username/available` route + controller
- [ ] Reserved words list constant

### Audit Log
- [ ] `src/models/auditLog.model.js` — schema + compound index
- [ ] `src/services/audit.service.js` — `writeLog()` fire-and-forget helper
- [ ] Wire `writeLog` calls into: register, verify (success/fail), rotate-key, revoke, username endpoints, revoke-session
- [ ] `GET /api/identity/:did/audit` route + controller (paginated, JWT-protected)

### Middleware & Infrastructure
- [ ] `src/middleware/verifyJWT.js` — RS256 JWT verification middleware
- [ ] Install new deps: `express-rate-limit`, `bcryptjs`

### Blockchain
- [ ] Update `blockchain.service.js` — add `rotateKey(did, newPublicKey)` function
- [ ] Update contract address env var after DIDRegistry v1 deployment
