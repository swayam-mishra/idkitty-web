# IDKitty v2 — Smart Contract Spec

## Overview

`DIDRegistryV2.sol` is a W3C DID Core-compliant on-chain identity registry. It is deployed behind a UUPS upgradeable proxy so the logic can be upgraded by the owner without changing the contract address.

Deployed on: Polygon PoS mainnet, Polygon Amoy testnet, Base mainnet, Base Sepolia testnet.

---

## What It Stores

Each DID document on-chain records:

- The controller wallet address (Ethereum address that owns the DID)
- Registration timestamp
- Last updated timestamp
- Revocation timestamp (0 if active)
- The current active key version number
- All verification keys ever registered, indexed by key ID

Each verification key records:

- The public key (hex-encoded uncompressed P-256, 130 chars)
- Key type (`EcdsaSecp256r1VerificationKey2019`)
- Key purpose: Authentication, AssertionMethod, or KeyAgreement
- Key version number
- Added timestamp
- Revoked timestamp (0 if active)

---

## Write Functions

| Function | Who can call | What it does |
|---|---|---|
| `registerDID(did, publicKey)` | Anyone | Registers a new DID with a primary authentication key. Controller is set to `msg.sender`. Reverts if the DID is already registered or the key is invalid. |
| `rotateKey(did, newPublicKey)` | DID controller only | Marks the current active authentication key as revoked and registers a new one as the active key. Increments `keyVersion`. |
| `addKey(did, publicKey, purpose)` | DID controller only | Adds an additional key with a specific purpose (e.g. a device key for assertion or key agreement). Does not affect the active authentication key. |
| `revokeKey(did, keyId)` | DID controller only | Revokes a specific key by ID. Cannot be used to revoke the currently active authentication key — use `rotateKey` for that. |
| `revokeDID(did)` | DID controller only | Permanently revokes the DID. Irreversible. |

---

## Read Functions

| Function | What it returns |
|---|---|
| `getActiveKey(did)` | The current active public key, its version, and when it was added |
| `getKey(did, keyId)` | Full details of a specific key (public key, type, purpose, version, timestamps) |
| `getKeyIds(did)` | All key IDs ever registered for a DID (active and revoked) |
| `getKeyHistory(did)` | Parallel arrays of all keys: public keys, versions, added timestamps, revoked timestamps |
| `getDIDDocument(did)` | Full DID document metadata (controller, timestamps, revocation status, active key version) |
| `getDIDsByController(address)` | All DIDs controlled by a given wallet address |
| `isActive(did)` | Boolean — true if the DID exists and has not been revoked |

---

## Events

| Event | Emitted when |
|---|---|
| `DIDRegistered(did, controller, publicKey, timestamp)` | A new DID is registered |
| `KeyRotated(did, controller, oldVersion, newVersion, newPublicKey, timestamp)` | The active authentication key is rotated |
| `KeyAdded(did, controller, keyId, purpose, publicKey, timestamp)` | An additional key is added |
| `KeyRevoked(did, controller, keyId, timestamp)` | A specific key is revoked |
| `DIDRevoked(did, controller, timestamp)` | A DID is permanently revoked |

---

## Upgradeability

- Deployed behind a UUPS (Universal Upgradeable Proxy Standard) transparent proxy
- Only the contract owner can authorize upgrades (`_authorizeUpgrade`)
- The `constructor` disables initializers to prevent direct deployment without the proxy
- Initial setup uses an `initialize()` function instead of a constructor

---

## Key Design Decisions

- DIDs are stored as plain strings (e.g. `"did:idkitty:polygon-amoy:0x..."`) — no hashing
- Controller is the raw `msg.sender` wallet address, not a DID reference
- Key IDs are sequential integers starting at 1; key version and key ID are the same for primary auth keys
- A revoked DID cannot be re-activated — revocation is permanent
- Additional keys (device keys, assertion keys) share the same key ID space but do not affect `activeKeyVersion`
