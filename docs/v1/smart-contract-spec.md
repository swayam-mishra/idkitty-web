# IDKitty v1 — Smart Contract Spec

> `DIDRegistry.sol` v1 — Polygon Amoy Testnet
>
> Replaces the v0 `DIDRegistry.sol`. Adds key rotation support and proper events. Keeps the same simple non-upgradeable deployment style.

---

## What Changed from v0

| v0 | v1 |
|---|---|
| `registerDID` + `resolveDID` only | + `rotateKey` function |
| `DIDRegistered(did, timestamp)` event (no publicKey in event) | `DIDRegistered(did, publicKey, controller)` — now includes public key and registrant address |
| No events for key rotation | `KeyRotated(did, newPublicKey, oldPublicKey)` event |
| No controller tracking | `controllers` mapping — tracks who registered each DID |
| No upgradeability | No upgradeability (same as v0 — deliberate) |

---

## `DIDRegistry.sol` (v1)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DIDRegistry v1
 * @notice On-chain DID registry with key rotation support.
 *         Each DID maps to a current public key.
 *         Key rotation updates the current key and emits an event.
 *         Controller is the wallet address that registered the DID.
 *         No upgradeability, no admin keys — immutable once deployed.
 */
contract DIDRegistry {

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Identity {
        string  publicKey;
        address controller;   // wallet that called registerDID
        uint256 registeredAt;
        uint256 keyRotatedAt; // 0 if key has never been rotated
        bool    exists;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    mapping(string => Identity) private _registry;

    // ─── Events ───────────────────────────────────────────────────────────────

    event DIDRegistered(
        string  indexed did,
        string  publicKey,
        address indexed controller,
        uint256 timestamp
    );

    event KeyRotated(
        string  indexed did,
        string  newPublicKey,
        string  oldPublicKey,
        address indexed controller,
        uint256 timestamp
    );

    // ─── Write Functions ──────────────────────────────────────────────────────

    /**
     * @notice Register a new DID with an initial public key.
     * @dev Reverts if the DID is already registered.
     * @param did       The DID string, e.g. "did:idkitty:0x1a2b3c..."
     * @param publicKey Hex-encoded uncompressed ECDSA P-256 public key (04...)
     */
    function registerDID(string memory did, string memory publicKey) external {
        require(!_registry[did].exists, "DID already registered");
        require(bytes(did).length > 0, "DID cannot be empty");
        require(bytes(publicKey).length > 0, "Public key cannot be empty");

        _registry[did] = Identity({
            publicKey:    publicKey,
            controller:   msg.sender,
            registeredAt: block.timestamp,
            keyRotatedAt: 0,
            exists:       true
        });

        emit DIDRegistered(did, publicKey, msg.sender, block.timestamp);
    }

    /**
     * @notice Replace the active public key for a DID.
     * @dev Only callable by the original controller (wallet that registered the DID).
     * @param did          The DID string to update.
     * @param newPublicKey The new ECDSA P-256 public key to set as active.
     */
    function rotateKey(string memory did, string memory newPublicKey) external {
        require(_registry[did].exists, "DID not registered");
        require(_registry[did].controller == msg.sender, "Not the controller");
        require(bytes(newPublicKey).length > 0, "New public key cannot be empty");

        string memory oldPublicKey = _registry[did].publicKey;
        _registry[did].publicKey    = newPublicKey;
        _registry[did].keyRotatedAt = block.timestamp;

        emit KeyRotated(did, newPublicKey, oldPublicKey, msg.sender, block.timestamp);
    }

    // ─── Read Functions ───────────────────────────────────────────────────────

    /**
     * @notice Resolve a DID to its current public key and metadata.
     * @return publicKey    The current active public key.
     * @return controller   The wallet address that controls this DID.
     * @return registeredAt Block timestamp of initial registration.
     * @return keyRotatedAt Block timestamp of most recent key rotation (0 if never rotated).
     */
    function resolveDID(string memory did)
        external
        view
        returns (
            string  memory publicKey,
            address        controller,
            uint256        registeredAt,
            uint256        keyRotatedAt
        )
    {
        require(_registry[did].exists, "DID not found");
        Identity memory id = _registry[did];
        return (id.publicKey, id.controller, id.registeredAt, id.keyRotatedAt);
    }

    /**
     * @notice Check if a DID has been registered.
     */
    function isRegistered(string memory did) external view returns (bool) {
        return _registry[did].exists;
    }
}
```

---

## Functions

| Function | Type | Description |
|---|---|---|
| `registerDID(did, publicKey)` | write | Register a new DID. Reverts if DID already exists. Controller = `msg.sender`. |
| `rotateKey(did, newPublicKey)` | write | Replace active key. Only callable by original controller. |
| `resolveDID(did)` | view | Returns current publicKey, controller, registeredAt, keyRotatedAt. |
| `isRegistered(did)` | view | Returns true/false — cheap existence check. |

---

## Events

| Event | Emitted When | Key Fields |
|---|---|---|
| `DIDRegistered` | Successful registration | `did`, `publicKey`, `controller`, `timestamp` |
| `KeyRotated` | Successful key rotation | `did`, `newPublicKey`, `oldPublicKey`, `controller`, `timestamp` |

Note: `did` is indexed in both events, enabling efficient on-chain lookup by DID string.

---

## Design Decisions

**Controller = `msg.sender` at registration time.**
The wallet address that calls `registerDID` permanently controls this DID on-chain. Key rotation requires the same wallet. This is intentional and matches v0's implicit model, now made explicit.

**No DID revocation on-chain.**
Identity revocation in v1 is off-chain only (MongoDB `revokedAt` field). The on-chain record becomes stale if an identity is revoked — but since IDKitty's auth path checks MongoDB first, revoked identities cannot authenticate regardless. On-chain revocation is deferred to v2 (DIDRegistryV2 with UUPS).

**No key history on-chain.**
`KeyRotated` events form an implicit on-chain history — anyone can reconstruct the full key history by querying events for a given DID. The `oldPublicKey` in the event enables this. There is no explicit array stored on-chain to keep gas costs minimal.

**No upgradeability.**
Deliberate. A simple non-upgradeable contract is fully auditable and requires no proxy pattern complexity. v2 will introduce UUPS proxy (`DIDRegistryV2`) — migrating at that point is the planned path.

---

## ABI

```json
[
  {
    "inputs": [
      { "internalType": "string", "name": "did",       "type": "string" },
      { "internalType": "string", "name": "publicKey", "type": "string" }
    ],
    "name": "registerDID",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "did",          "type": "string" },
      { "internalType": "string", "name": "newPublicKey", "type": "string" }
    ],
    "name": "rotateKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "did", "type": "string" }
    ],
    "name": "resolveDID",
    "outputs": [
      { "internalType": "string",  "name": "publicKey",    "type": "string"  },
      { "internalType": "address", "name": "controller",   "type": "address" },
      { "internalType": "uint256", "name": "registeredAt", "type": "uint256" },
      { "internalType": "uint256", "name": "keyRotatedAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "did", "type": "string" }
    ],
    "name": "isRegistered",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "did",        "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "publicKey",  "type": "string"  },
      { "indexed": true,  "internalType": "address", "name": "controller", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",  "type": "uint256" }
    ],
    "name": "DIDRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "did",          "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "newPublicKey", "type": "string"  },
      { "indexed": false, "internalType": "string",  "name": "oldPublicKey", "type": "string"  },
      { "indexed": true,  "internalType": "address", "name": "controller",   "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",    "type": "uint256" }
    ],
    "name": "KeyRotated",
    "type": "event"
  }
]
```

Save as `idkitty-backend/contracts/DIDRegistryV1.json` (keep `DIDRegistry.json` as the v0 ABI for reference).

---

## Network

| Field | Value |
|---|---|
| Network Name | Polygon Amoy |
| RPC URL | `https://rpc-amoy.polygon.technology` |
| Chain ID | `80002` |
| Currency | MATIC |
| Explorer | `https://amoy.polygonscan.com` |

Same network as v0. New deployment — new contract address.

---

## Deploy Steps (Remix IDE)

Same wallet setup and test MATIC sourcing as v0.

1. Go to `https://remix.ethereum.org`
2. Create new file `DIDRegistryV1.sol` → paste the contract source above
3. **Compiler tab** → select `0.8.20` → enable **Optimization** (200 runs) → click **Compile**
4. **Deploy tab** → Environment: `Injected Provider - MetaMask`
5. Confirm MetaMask is on Amoy (Chain ID 80002)
6. Click **Deploy** → confirm transaction in MetaMask
7. Copy the new contract address from Remix console
8. Update `CONTRACT_ADDRESS` in `idkitty-backend/.env`
9. Update the ABI import in `blockchain.service.js` to use `DIDRegistryV1.json`

### Verify on Polygonscan

1. Go to `https://amoy.polygonscan.com/address/<NEW_CONTRACT_ADDRESS>`
2. Select **Contract** tab → **Verify and Publish**
3. Compiler type: **Solidity (Single file)**, Version: `0.8.20`, License: MIT
4. Paste contract source → verify

Verification makes the contract readable on Polygonscan and lets users inspect it without needing the ABI.

---

## Deploy Script (Node.js)

Update `scripts/deploy.js` to use the v1 contract source:

```js
// scripts/deploy.js
import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Compile the contract first (hardhat or solcjs), then provide bytecode + ABI here
// Or: load from a pre-compiled artifacts file

const abi      = JSON.parse(readFileSync('./contracts/DIDRegistryV1.json', 'utf8'));
const bytecode = process.env.CONTRACT_BYTECODE;  // or read from compiled artifact

const factory  = new ethers.ContractFactory(abi, bytecode, signer);
const contract = await factory.deploy();
await contract.waitForDeployment();

console.log('DIDRegistryV1 deployed to:', await contract.getAddress());
```

---

## Blockchain Service Changes

```js
// src/services/blockchain.service.js

import DIDRegistryV1ABI from '../../contracts/DIDRegistryV1.json' assert { type: 'json' };

// Change: load DIDRegistryV1.json instead of DIDRegistry.json
const contract = new ethers.Contract(CONTRACT_ADDRESS, DIDRegistryV1ABI, signer);

// Unchanged:
async function registerDID(did, publicKey) {
  const tx = await contract.registerDID(did, publicKey);
  return tx.hash;
}

// New:
async function rotateKey(did, newPublicKey) {
  const tx = await contract.rotateKey(did, newPublicKey);
  return tx.hash;
}
```

---

## Gas Estimates (Polygon Amoy)

| Operation | Estimated Gas | Cost at 30 gwei |
|---|---|---|
| `registerDID` | ~80,000 gas | ~0.0024 MATIC |
| `rotateKey` | ~40,000 gas | ~0.0012 MATIC |
| `resolveDID` | 0 (view) | free |

0.5 MATIC covers ~200 registrations + 200 rotations.

---

## What This Scaffolds for v2

The v2 `DIDRegistryV2.sol` will introduce:
- UUPS upgradeable proxy (OpenZeppelin)
- Multi-key support: `addKey(did, deviceKey)`, `revokeKey(did, keyId)`
- On-chain DID revocation: `revokeDID(did)`
- W3C DID Core compliance: key purpose flags (auth, assertion, key agreement)
- Key history stored on-chain in a `KeyRecord[]` array

The v1 `rotateKey` and `controllers` mapping pattern is a direct precursor to v2's controller-gated key management. Migrating from v1 to v2 requires deploying the proxy and re-registering existing DIDs (or accepting that historical v1 records remain on the old contract).
