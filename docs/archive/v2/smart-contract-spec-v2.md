# IDKitty v2 — Smart Contract Spec

## Overview

`DIDRegistryV2.sol` upgrades the v1 minimal registry to a W3C DID Core-compliant, upgradeable, multi-purpose key registry. It supports key rotation with full history, DID revocation, and multi-key documents with capability designations (`authentication`, `assertionMethod`, `keyAgreement`).

---

## `DIDRegistryV2.sol` — Full Source

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title DIDRegistryV2
/// @notice W3C DID Core-compliant decentralized identity registry.
///         Supports key rotation, key history, revocation, and multi-key DID Documents.
/// @dev    Deployed behind a UUPS transparent proxy for upgradeability.
contract DIDRegistryV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {

    // ────────────────────────────────────────────────────────────────────────
    // TYPES
    // ────────────────────────────────────────────────────────────────────────

    enum KeyPurpose {
        Authentication,   // 0 — signing login challenges
        AssertionMethod,  // 1 — signing verifiable credentials
        KeyAgreement      // 2 — key exchange / encryption
    }

    struct VerificationKey {
        string     publicKey;    // hex-encoded uncompressed P-256 key (65 bytes → 130 hex chars)
        string     keyType;      // "EcdsaSecp256r1VerificationKey2019"
        KeyPurpose purpose;
        uint32     keyVersion;
        uint256    addedAt;
        uint256    revokedAt;    // 0 = active
        bool       exists;
    }

    struct DIDDocument {
        address    controller;          // Ethereum wallet address that owns this DID
        uint256    registeredAt;
        uint256    updatedAt;
        uint256    revokedAt;           // 0 = active
        bool       exists;
        uint32     activeKeyVersion;    // points to the current active auth key
        uint32     keyCount;            // total keys ever registered (for ID generation)
    }

    // ────────────────────────────────────────────────────────────────────────
    // STORAGE
    // ────────────────────────────────────────────────────────────────────────

    /// @dev Maps DID string → DIDDocument metadata
    mapping(string => DIDDocument) private _documents;

    /// @dev Maps DID string → keyId (1-indexed) → VerificationKey
    ///      keyId == keyVersion for the primary auth key
    mapping(string => mapping(uint32 => VerificationKey)) private _keys;

    /// @dev Maps DID string → ordered array of keyIds
    mapping(string => uint32[]) private _keyIds;

    /// @dev Maps controller address → list of DIDs they control
    mapping(address => string[]) private _controllerDIDs;

    // ────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ────────────────────────────────────────────────────────────────────────

    event DIDRegistered(
        string  indexed did,
        address indexed controller,
        string          publicKey,
        uint256         timestamp
    );

    event KeyRotated(
        string  indexed did,
        address indexed controller,
        uint32          oldKeyVersion,
        uint32          newKeyVersion,
        string          newPublicKey,
        uint256         timestamp
    );

    event KeyAdded(
        string  indexed did,
        address indexed controller,
        uint32          keyId,
        KeyPurpose      purpose,
        string          publicKey,
        uint256         timestamp
    );

    event KeyRevoked(
        string  indexed did,
        address indexed controller,
        uint32          keyId,
        uint256         timestamp
    );

    event DIDRevoked(
        string  indexed did,
        address indexed controller,
        uint256         timestamp
    );

    // ────────────────────────────────────────────────────────────────────────
    // ERRORS
    // ────────────────────────────────────────────────────────────────────────

    error DIDAlreadyRegistered(string did);
    error DIDNotFound(string did);
    error DIDRevoked(string did);
    error NotController(string did, address caller);
    error KeyNotFound(string did, uint32 keyId);
    error KeyAlreadyRevoked(string did, uint32 keyId);
    error InvalidPublicKey();
    error InvalidDIDFormat();

    // ────────────────────────────────────────────────────────────────────────
    // MODIFIERS
    // ────────────────────────────────────────────────────────────────────────

    modifier onlyController(string memory did) {
        if (!_documents[did].exists) revert DIDNotFound(did);
        if (_documents[did].controller != msg.sender) revert NotController(did, msg.sender);
        _;
    }

    modifier didActive(string memory did) {
        if (!_documents[did].exists) revert DIDNotFound(did);
        if (_documents[did].revokedAt != 0) revert DIDRevoked(did);
        _;
    }

    // ────────────────────────────────────────────────────────────────────────
    // INITIALIZER (replaces constructor for upgradeable contracts)
    // ────────────────────────────────────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    // ────────────────────────────────────────────────────────────────────────
    // WRITE FUNCTIONS
    // ────────────────────────────────────────────────────────────────────────

    /// @notice Register a new DID with a primary authentication key.
    /// @param did       The DID string — "did:idkitty:polygon-amoy:0x..."
    /// @param publicKey Hex-encoded uncompressed P-256 public key (130 chars)
    function registerDID(
        string memory did,
        string memory publicKey
    ) external {
        if (_documents[did].exists) revert DIDAlreadyRegistered(did);
        if (bytes(publicKey).length != 130) revert InvalidPublicKey();

        // Store DID document metadata
        _documents[did] = DIDDocument({
            controller:       msg.sender,
            registeredAt:     block.timestamp,
            updatedAt:        block.timestamp,
            revokedAt:        0,
            exists:           true,
            activeKeyVersion: 1,
            keyCount:         1
        });

        // Store the primary authentication key as keyId = 1
        _keys[did][1] = VerificationKey({
            publicKey:  publicKey,
            keyType:    "EcdsaSecp256r1VerificationKey2019",
            purpose:    KeyPurpose.Authentication,
            keyVersion: 1,
            addedAt:    block.timestamp,
            revokedAt:  0,
            exists:     true
        });

        _keyIds[did].push(1);
        _controllerDIDs[msg.sender].push(did);

        emit DIDRegistered(did, msg.sender, publicKey, block.timestamp);
    }

    /// @notice Rotate the primary authentication key for a DID.
    ///         The old key is revoked on-chain; the new key becomes active.
    ///         Only callable by the DID's controller.
    /// @param did          The DID to update
    /// @param newPublicKey Hex-encoded uncompressed P-256 public key
    function rotateKey(
        string memory did,
        string memory newPublicKey
    ) external onlyController(did) didActive(did) {
        if (bytes(newPublicKey).length != 130) revert InvalidPublicKey();

        DIDDocument storage doc = _documents[did];
        uint32 oldVersion = doc.activeKeyVersion;
        uint32 newVersion = oldVersion + 1;

        // Mark old key as revoked
        _keys[did][oldVersion].revokedAt = block.timestamp;

        // Register new key
        _keys[did][newVersion] = VerificationKey({
            publicKey:  newPublicKey,
            keyType:    "EcdsaSecp256r1VerificationKey2019",
            purpose:    KeyPurpose.Authentication,
            keyVersion: newVersion,
            addedAt:    block.timestamp,
            revokedAt:  0,
            exists:     true
        });

        _keyIds[did].push(newVersion);
        doc.activeKeyVersion = newVersion;
        doc.keyCount         = newVersion;
        doc.updatedAt        = block.timestamp;

        emit KeyRotated(did, msg.sender, oldVersion, newVersion, newPublicKey, block.timestamp);
    }

    /// @notice Add an additional key with a specific purpose (non-authentication keys).
    ///         Useful for adding assertion or key-agreement keys without touching the auth key.
    /// @param did       The DID to update
    /// @param publicKey Hex-encoded key
    /// @param purpose   KeyPurpose enum value
    function addKey(
        string memory did,
        string memory publicKey,
        KeyPurpose    purpose
    ) external onlyController(did) didActive(did) {
        if (bytes(publicKey).length < 64) revert InvalidPublicKey();

        DIDDocument storage doc = _documents[did];
        uint32 keyId = doc.keyCount + 1;

        _keys[did][keyId] = VerificationKey({
            publicKey:  publicKey,
            keyType:    "EcdsaSecp256r1VerificationKey2019",
            purpose:    purpose,
            keyVersion: 0,       // 0 = additional key (not the primary auth chain)
            addedAt:    block.timestamp,
            revokedAt:  0,
            exists:     true
        });

        _keyIds[did].push(keyId);
        doc.keyCount  = keyId;
        doc.updatedAt = block.timestamp;

        emit KeyAdded(did, msg.sender, keyId, purpose, publicKey, block.timestamp);
    }

    /// @notice Revoke a specific key by keyId.
    ///         Cannot revoke the currently-active authentication key (use rotateKey instead).
    function revokeKey(
        string memory did,
        uint32        keyId
    ) external onlyController(did) {
        VerificationKey storage key = _keys[did][keyId];
        if (!key.exists) revert KeyNotFound(did, keyId);
        if (key.revokedAt != 0) revert KeyAlreadyRevoked(did, keyId);

        key.revokedAt = block.timestamp;
        _documents[did].updatedAt = block.timestamp;

        emit KeyRevoked(did, msg.sender, keyId, block.timestamp);
    }

    /// @notice Permanently revoke a DID. Only callable by the controller.
    ///         This is irreversible — a revoked DID cannot be re-activated.
    function revokeDID(
        string memory did
    ) external onlyController(did) {
        _documents[did].revokedAt = block.timestamp;
        _documents[did].updatedAt = block.timestamp;

        emit DIDRevoked(did, msg.sender, block.timestamp);
    }

    // ────────────────────────────────────────────────────────────────────────
    // READ FUNCTIONS
    // ────────────────────────────────────────────────────────────────────────

    /// @notice Get the active public key for authentication.
    ///         Returns the key at the current activeKeyVersion.
    function getActiveKey(string memory did)
        external view
        returns (string memory publicKey, uint32 keyVersion, uint256 addedAt)
    {
        if (!_documents[did].exists) revert DIDNotFound(did);
        uint32 v = _documents[did].activeKeyVersion;
        VerificationKey storage key = _keys[did][v];
        return (key.publicKey, key.keyVersion, key.addedAt);
    }

    /// @notice Get a specific key by keyId.
    function getKey(string memory did, uint32 keyId)
        external view
        returns (
            string memory publicKey,
            string memory keyType,
            KeyPurpose    purpose,
            uint32        keyVersion,
            uint256       addedAt,
            uint256       revokedAt
        )
    {
        VerificationKey storage key = _keys[did][keyId];
        if (!key.exists) revert KeyNotFound(did, keyId);
        return (key.publicKey, key.keyType, key.purpose, key.keyVersion, key.addedAt, key.revokedAt);
    }

    /// @notice Get all key IDs ever registered for a DID (active + revoked).
    function getKeyIds(string memory did)
        external view
        returns (uint32[] memory)
    {
        if (!_documents[did].exists) revert DIDNotFound(did);
        return _keyIds[did];
    }

    /// @notice Get the full key history — returns parallel arrays for all registered keys.
    function getKeyHistory(string memory did)
        external view
        returns (
            string[]   memory publicKeys,
            uint32[]   memory keyVersions,
            uint256[]  memory addedAts,
            uint256[]  memory revokedAts
        )
    {
        uint32[] storage ids = _keyIds[did];
        uint256 len = ids.length;

        publicKeys  = new string[](len);
        keyVersions = new uint32[](len);
        addedAts    = new uint256[](len);
        revokedAts  = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            VerificationKey storage key = _keys[did][ids[i]];
            publicKeys[i]  = key.publicKey;
            keyVersions[i] = key.keyVersion;
            addedAts[i]    = key.addedAt;
            revokedAts[i]  = key.revokedAt;
        }
    }

    /// @notice Resolve the DIDDocument metadata (not the full W3C doc — use backend for that).
    function resolveDID(string memory did)
        external view
        returns (
            address controller,
            uint256 registeredAt,
            uint256 updatedAt,
            uint256 revokedAt,
            uint32  activeKeyVersion,
            uint32  keyCount
        )
    {
        DIDDocument storage doc = _documents[did];
        if (!doc.exists) revert DIDNotFound(did);
        return (
            doc.controller,
            doc.registeredAt,
            doc.updatedAt,
            doc.revokedAt,
            doc.activeKeyVersion,
            doc.keyCount
        );
    }

    /// @notice Check whether a DID exists and is not revoked.
    function isDIDActive(string memory did) external view returns (bool) {
        return _documents[did].exists && _documents[did].revokedAt == 0;
    }

    /// @notice Get all DIDs controlled by a wallet address.
    function getDIDsByController(address controller)
        external view
        returns (string[] memory)
    {
        return _controllerDIDs[controller];
    }

    // ────────────────────────────────────────────────────────────────────────
    // UPGRADE AUTHORIZATION
    // ────────────────────────────────────────────────────────────────────────

    /// @dev Only the contract owner (ProxyAdmin or multisig) can authorize upgrades.
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
```

---

## Functions Reference

### Write Functions

| Function | Caller | Description |
|---|---|---|
| `registerDID(did, publicKey)` | Anyone | Register a new DID. Controller = `msg.sender`. |
| `rotateKey(did, newPublicKey)` | Controller | Revoke current auth key, register new one. Increments `activeKeyVersion`. |
| `addKey(did, publicKey, purpose)` | Controller | Add an additional key (assertion, keyAgreement). |
| `revokeKey(did, keyId)` | Controller | Revoke a specific non-active key. |
| `revokeDID(did)` | Controller | Permanently revoke the DID. Irreversible. |

### Read Functions

| Function | Returns |
|---|---|
| `getActiveKey(did)` | `(publicKey, keyVersion, addedAt)` — current auth key |
| `getKey(did, keyId)` | Full `VerificationKey` struct fields |
| `getKeyIds(did)` | `uint32[]` — all key IDs |
| `getKeyHistory(did)` | Parallel arrays: publicKeys, keyVersions, addedAts, revokedAts |
| `resolveDID(did)` | DIDDocument metadata fields |
| `isDIDActive(did)` | `bool` |
| `getDIDsByController(address)` | `string[]` — all DIDs for a wallet |

### Events

| Event | Parameters |
|---|---|
| `DIDRegistered` | `did, controller, publicKey, timestamp` |
| `KeyRotated` | `did, controller, oldKeyVersion, newKeyVersion, newPublicKey, timestamp` |
| `KeyAdded` | `did, controller, keyId, purpose, publicKey, timestamp` |
| `KeyRevoked` | `did, controller, keyId, timestamp` |
| `DIDRevoked` | `did, controller, timestamp` |

---

## Full ABI

```json
[
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [{ "name": "initialOwner", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerDID",
    "inputs": [
      { "name": "did",       "type": "string" },
      { "name": "publicKey", "type": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "rotateKey",
    "inputs": [
      { "name": "did",          "type": "string" },
      { "name": "newPublicKey", "type": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addKey",
    "inputs": [
      { "name": "did",       "type": "string" },
      { "name": "publicKey", "type": "string" },
      { "name": "purpose",   "type": "uint8"  }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "revokeKey",
    "inputs": [
      { "name": "did",   "type": "string" },
      { "name": "keyId", "type": "uint32" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "revokeDID",
    "inputs": [{ "name": "did", "type": "string" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getActiveKey",
    "inputs": [{ "name": "did", "type": "string" }],
    "outputs": [
      { "name": "publicKey",  "type": "string" },
      { "name": "keyVersion", "type": "uint32" },
      { "name": "addedAt",    "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getKey",
    "inputs": [
      { "name": "did",   "type": "string" },
      { "name": "keyId", "type": "uint32" }
    ],
    "outputs": [
      { "name": "publicKey",  "type": "string" },
      { "name": "keyType",    "type": "string" },
      { "name": "purpose",    "type": "uint8"  },
      { "name": "keyVersion", "type": "uint32" },
      { "name": "addedAt",    "type": "uint256" },
      { "name": "revokedAt",  "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getKeyIds",
    "inputs": [{ "name": "did", "type": "string" }],
    "outputs": [{ "name": "", "type": "uint32[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getKeyHistory",
    "inputs": [{ "name": "did", "type": "string" }],
    "outputs": [
      { "name": "publicKeys",  "type": "string[]"  },
      { "name": "keyVersions", "type": "uint32[]"  },
      { "name": "addedAts",    "type": "uint256[]" },
      { "name": "revokedAts",  "type": "uint256[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "resolveDID",
    "inputs": [{ "name": "did", "type": "string" }],
    "outputs": [
      { "name": "controller",       "type": "address" },
      { "name": "registeredAt",     "type": "uint256" },
      { "name": "updatedAt",        "type": "uint256" },
      { "name": "revokedAt",        "type": "uint256" },
      { "name": "activeKeyVersion", "type": "uint32"  },
      { "name": "keyCount",         "type": "uint32"  }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isDIDActive",
    "inputs": [{ "name": "did", "type": "string" }],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDIDsByController",
    "inputs": [{ "name": "controller", "type": "address" }],
    "outputs": [{ "name": "", "type": "string[]" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "DIDRegistered",
    "inputs": [
      { "indexed": true,  "name": "did",        "type": "string"  },
      { "indexed": true,  "name": "controller", "type": "address" },
      { "indexed": false, "name": "publicKey",  "type": "string"  },
      { "indexed": false, "name": "timestamp",  "type": "uint256" }
    ]
  },
  {
    "type": "event",
    "name": "KeyRotated",
    "inputs": [
      { "indexed": true,  "name": "did",           "type": "string"  },
      { "indexed": true,  "name": "controller",    "type": "address" },
      { "indexed": false, "name": "oldKeyVersion", "type": "uint32"  },
      { "indexed": false, "name": "newKeyVersion", "type": "uint32"  },
      { "indexed": false, "name": "newPublicKey",  "type": "string"  },
      { "indexed": false, "name": "timestamp",     "type": "uint256" }
    ]
  },
  {
    "type": "event",
    "name": "DIDRevoked",
    "inputs": [
      { "indexed": true,  "name": "did",        "type": "string"  },
      { "indexed": true,  "name": "controller", "type": "address" },
      { "indexed": false, "name": "timestamp",  "type": "uint256" }
    ]
  }
]
```

---

## W3C DID Document Format

The backend constructs this JSON from on-chain data when `/api/identity/:did` is called. It is not stored on-chain — the chain stores the raw key material; the backend assembles the W3C-compliant document.

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/secp256r1-2019/v1"
  ],
  "id": "did:idkitty:polygon-amoy:0x1a2b3c4d5e",
  "controller": "did:idkitty:polygon-amoy:0x1a2b3c4d5e",
  "verificationMethod": [
    {
      "id":              "did:idkitty:polygon-amoy:0x1a2b3c4d5e#key-1",
      "type":            "EcdsaSecp256r1VerificationKey2019",
      "controller":      "did:idkitty:polygon-amoy:0x1a2b3c4d5e",
      "publicKeyHex":    "04a1b2c3d4e5f6..."
    }
  ],
  "authentication": [
    "did:idkitty:polygon-amoy:0x1a2b3c4d5e#key-1"
  ],
  "assertionMethod": [],
  "keyAgreement":    [],
  "service": [
    {
      "id":              "did:idkitty:polygon-amoy:0x1a2b3c4d5e#idkitty",
      "type":            "IDKittyAuthEndpoint",
      "serviceEndpoint": "https://api.idkitty.io/api/auth"
    }
  ],
  "proof": {
    "type":               "EcdsaSecp256r1Signature2019",
    "created":            "2025-01-01T00:00:00Z",
    "verificationMethod": "did:idkitty:polygon-amoy:0x1a2b3c4d5e#key-1",
    "proofPurpose":       "assertionMethod",
    "jws":                "..."
  }
}
```

**Backend construction logic:**
```js
// src/controllers/identity.controller.js — buildDIDDocument()
export const buildDIDDocument = (identity, onChainData) => {
  const baseId = identity.did;
  const keyIds  = onChainData.keyIds;   // from getKeyIds()

  const verificationMethods = keyIds
    .filter(id => onChainData.keys[id].revokedAt === 0n)
    .map(id => {
      const key = onChainData.keys[id];
      return {
        id:           `${baseId}#key-${id}`,
        type:         key.keyType,
        controller:   baseId,
        publicKeyHex: key.publicKey,
      };
    });

  const authKeyId = `${baseId}#key-${onChainData.activeKeyVersion}`;

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/secp256r1-2019/v1',
    ],
    id:         baseId,
    controller: baseId,
    verificationMethod: verificationMethods,
    authentication:    [authKeyId],
    assertionMethod:   verificationMethods
      .filter(vm => /* purpose == AssertionMethod */ false)
      .map(vm => vm.id),
    keyAgreement: [],
    service: [{
      id:              `${baseId}#idkitty`,
      type:            'IDKittyAuthEndpoint',
      serviceEndpoint: process.env.API_BASE_URL + '/api/auth',
    }],
  };
};
```

---

## DID Format Convention

| Chain            | DID Format |
|------------------|------------|
| Polygon Amoy     | `did:idkitty:polygon-amoy:<pubkey_prefix>` |
| Polygon Mainnet  | `did:idkitty:polygon:<pubkey_prefix>` |
| Base Mainnet     | `did:idkitty:base:<pubkey_prefix>` |
| Base Sepolia     | `did:idkitty:base-sepolia:<pubkey_prefix>` |

`<pubkey_prefix>` = first 20 characters of the hex-encoded uncompressed public key (after the `04` prefix).

Example: `did:idkitty:polygon-amoy:1a2b3c4d5e6f7a8b9c0d`

---

## Multi-chain Strategy

### Chain Registry

```js
// src/config/chains.config.js
export const SUPPORTED_CHAINS = {
  'polygon-amoy':     { ... },   // see backend-spec-v2.md
  'polygon-mainnet':  { ... },
  'base-mainnet':     { ... },
  'base-sepolia':     { ... },
};

// DID → chain extraction
export const extractChainFromDID = (did) => {
  // "did:idkitty:polygon-amoy:0x..." → "polygon-amoy"
  const parts = did.split(':');
  if (parts.length < 4) throw new Error(`Invalid DID format: ${did}`);
  return parts[2];
};
```

### Chain-Aware Blockchain Service

```js
export const resolveOnChain = async (did) => {
  const chain    = extractChainFromDID(did);
  const contract = getContract(chain);
  const [controller, registeredAt, updatedAt, revokedAt, activeKeyVersion, keyCount]
    = await contract.resolveDID(did);
  return { controller, registeredAt, updatedAt, revokedAt, activeKeyVersion, keyCount };
};

export const getKeyHistoryOnChain = async (did) => {
  const chain    = extractChainFromDID(did);
  const contract = getContract(chain);
  const keyIds   = await contract.getKeyIds(did);
  const keys     = {};
  for (const id of keyIds) {
    const [publicKey, keyType, purpose, keyVersion, addedAt, revokedAt]
      = await contract.getKey(did, id);
    keys[id] = { publicKey, keyType, purpose, keyVersion, addedAt, revokedAt };
  }
  return keys;
};
```

---

## Deployment

### Step 1 — Install Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox \
  @openzeppelin/contracts-upgradeable @openzeppelin/hardhat-upgrades \
  dotenv
```

### Step 2 — Hardhat Config

```js
// hardhat.config.js
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version:  "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    "polygon-amoy": {
      url:      process.env.POLYGON_AMOY_RPC_URL,
      accounts: [process.env.POLYGON_AMOY_PRIVATE_KEY],
      chainId:  80002,
    },
    "polygon-mainnet": {
      url:      process.env.POLYGON_MAINNET_RPC_URL,
      accounts: [process.env.POLYGON_MAINNET_PRIVATE_KEY],
      chainId:  137,
    },
    "base-mainnet": {
      url:      process.env.BASE_MAINNET_RPC_URL,
      accounts: [process.env.BASE_MAINNET_PRIVATE_KEY],
      chainId:  8453,
    },
    "base-sepolia": {
      url:      process.env.BASE_SEPOLIA_RPC_URL,
      accounts: [process.env.BASE_SEPOLIA_PRIVATE_KEY],
      chainId:  84532,
    },
  },
  etherscan: {
    apiKey: {
      polygon:       process.env.POLYGONSCAN_API_KEY,
      polygonAmoy:   process.env.POLYGONSCAN_API_KEY,
      base:          process.env.BASESCAN_API_KEY,
      baseSepolia:   process.env.BASESCAN_API_KEY,
    },
  },
};

export default config;
```

### Step 3 — Deploy Script

```js
// scripts/deploy.js
import { ethers, upgrades } from "hardhat";

async function main() {
  const network = hre.network.name;
  console.log(`Deploying DIDRegistryV2 to ${network}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const DIDRegistryV2 = await ethers.getContractFactory("DIDRegistryV2");

  // Deploy as UUPS proxy
  const proxy = await upgrades.deployProxy(
    DIDRegistryV2,
    [deployer.address],    // initialOwner
    {
      initializer: "initialize",
      kind:        "uups",
    }
  );

  await proxy.waitForDeployment();
  const proxyAddr = await proxy.getAddress();
  const implAddr  = await upgrades.erc1967.getImplementationAddress(proxyAddr);

  console.log(`Proxy address (use this in .env): ${proxyAddr}`);
  console.log(`Implementation address:           ${implAddr}`);

  // Save deployment info
  const fs = await import('fs');
  const deployment = {
    network,
    proxyAddress:          proxyAddr,
    implementationAddress: implAddr,
    deployedAt:            new Date().toISOString(),
    deployer:              deployer.address,
  };
  fs.writeFileSync(
    `contracts/chains/${network}.json`,
    JSON.stringify(deployment, null, 2)
  );

  console.log(`Deployment info saved to contracts/chains/${network}.json`);
}

main().catch(console.error);
```

**Deploy commands:**
```bash
# Testnet (start here)
npx hardhat run scripts/deploy.js --network polygon-amoy
npx hardhat run scripts/deploy.js --network base-sepolia

# Mainnet (after thorough testnet testing)
npx hardhat run scripts/deploy.js --network polygon-mainnet
npx hardhat run scripts/deploy.js --network base-mainnet
```

### Step 4 — Verify on Explorer

```bash
# Polygon Amoy
npx hardhat verify --network polygon-amoy <PROXY_ADDRESS>

# The implementation is auto-verified by hardhat-upgrades in most cases.
# If not:
npx hardhat verify --network polygon-amoy <IMPLEMENTATION_ADDRESS>
```

---

## Upgrade Procedure

### UUPS Pattern Overview

```
User → Proxy (TransparentUpgradeableProxy)
              ↕ delegatecall
         Implementation V1 (DIDRegistryV2)
              ↕ upgrade via _authorizeUpgrade
         Implementation V2 (DIDRegistryV3 — future)
```

All state lives in the Proxy's storage. The Implementation contract contains only logic. The `_authorizeUpgrade` function restricts who can trigger upgrades (only `owner`).

### Upgrade Script

```js
// scripts/upgrade.js
import { ethers, upgrades } from "hardhat";

async function main() {
  const proxyAddress = process.env.CONTRACT_ADDRESS;
  if (!proxyAddress) throw new Error("CONTRACT_ADDRESS not set");

  console.log(`Upgrading proxy at ${proxyAddress}...`);

  const DIDRegistryV3 = await ethers.getContractFactory("DIDRegistryV3");

  const upgraded = await upgrades.upgradeProxy(proxyAddress, DIDRegistryV3, {
    kind: "uups",
  });

  await upgraded.waitForDeployment();
  const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`Upgrade complete. New implementation: ${newImpl}`);
}

main().catch(console.error);
```

### Storage Layout Invariants

When writing future upgrades (`DIDRegistryV3`, etc.):
- **Never** reorder or remove existing storage variables
- **Only** append new variables at the end of the storage layout
- Use OpenZeppelin's `@openzeppelin/hardhat-upgrades` storage layout checker to validate before deploying
- Run `npx hardhat check-upgrade <PROXY_ADDRESS> DIDRegistryV3` before upgrading

---

## Network Deployment Info Template

**Save this to `contracts/chains/<network>.json` after each deploy:**

```json
{
  "network":               "polygon-amoy",
  "proxyAddress":          "0x___",
  "implementationAddress": "0x___",
  "deployedAt":            "YYYY-MM-DDTHH:mm:ssZ",
  "deployer":              "0x___",
  "polygonscanUrl":        "https://amoy.polygonscan.com/address/0x___"
}
```

---

## Gas Estimates (Polygon Amoy)

| Operation | Estimated Gas | Cost @ 30 gwei |
|---|---|---|
| `registerDID` | ~85,000 | ~0.00255 MATIC |
| `rotateKey` | ~65,000 | ~0.00195 MATIC |
| `addKey` | ~70,000 | ~0.00210 MATIC |
| `revokeKey` | ~30,000 | ~0.00090 MATIC |
| `revokeDID` | ~28,000 | ~0.00084 MATIC |
| `getActiveKey` (read) | 0 | Free |
| `getKeyHistory` (read) | 0 | Free |

0.5 test MATIC from the faucet covers ~196 full register+rotate cycles.

---

## Security Considerations

| Risk | Mitigation |
|---|---|
| Controller wallet compromise | DID can be revoked; no recovery (by design — self-sovereign) |
| Replay attacks on `rotateKey` | Each tx is unique (blockchain nonce + block hash) |
| Upgradeability abuse | `_authorizeUpgrade` restricted to `owner`; owner should be a multisig |
| Front-running `registerDID` | DID includes pubkey prefix — attacker would need the matching private key |
| Storage collision in upgrades | OpenZeppelin storage gap pattern; checked by `hardhat-upgrades` |
| Gas griefing (large key arrays) | `getKeyHistory` called off-chain only; on-chain only reads single keys |
