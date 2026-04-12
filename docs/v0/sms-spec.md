# IDKitty — Smart Contract Spec

> `DIDRegistry.sol` — Polygon Amoy Testnet

---

## Overview

Minimal on-chain DID registry. Stores a mapping from DID string → public key + timestamp. No owner, no upgradability, no admin keys. Immutable once deployed.

---

## `DIDRegistry.sol`

```solidity
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

---

## Functions

| Function | Type | Description |
|---|---|---|
| `registerDID(did, publicKey)` | write | Registers a new DID. Reverts if DID already exists. |
| `resolveDID(did)` | view | Returns `(publicKey, timestamp)`. Reverts if not found. |

### Events

| Event | Emitted when |
|---|---|
| `DIDRegistered(did, timestamp)` | A new DID is successfully registered |

---

## ABI

```json
[
  {
    "inputs": [
      { "internalType": "string", "name": "did", "type": "string" },
      { "internalType": "string", "name": "publicKey", "type": "string" }
    ],
    "name": "registerDID",
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
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "did", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "DIDRegistered",
    "type": "event"
  }
]
```

The ABI is saved as `idkitty-backend/contracts/DIDRegistry.json` and loaded at runtime by `blockchain.service.js`.

---

## Network

| Field        | Value |
|---|---|
| Network Name | Polygon Amoy |
| RPC URL      | `https://rpc-amoy.polygon.technology` |
| Chain ID     | `80002` |
| Currency     | MATIC |
| Explorer     | `https://amoy.polygonscan.com` |

---

## Deploy Steps (Remix IDE)

### Step 1 — Setup Wallet

1. Install MetaMask
2. Add Polygon Amoy testnet:

| Field        | Value |
|---|---|
| Network Name | Polygon Amoy |
| RPC URL      | `https://rpc-amoy.polygon.technology` |
| Chain ID     | `80002` |
| Symbol       | `MATIC` |
| Explorer     | `https://amoy.polygonscan.com` |

### Step 2 — Get Test MATIC

- Faucet: `https://faucet.polygon.technology`
- Select "Amoy" network, paste wallet address
- 0.5 MATIC is enough for hundreds of registrations

### Step 3 — Deploy on Remix

1. Go to `https://remix.ethereum.org`
2. Create new file → paste `DIDRegistry.sol`
3. **Compiler tab** → select `0.8.0` → click **Compile**
4. **Deploy tab** → Environment: `Injected Provider - MetaMask`
5. Confirm MetaMask is on Amoy network
6. Click **Deploy** → confirm transaction in MetaMask
7. Copy the contract address from the Remix console

### Step 4 — Verify Deployment

1. Go to `https://amoy.polygonscan.com`
2. Paste the contract address
3. Confirm the deployment transaction appears

---

## Deploy Script (Node.js)

The backend includes `idkitty-backend/scripts/deploy.js` for programmatic deployment via ethers.js.

Requirements:
- `POLYGON_RPC_URL` and `PRIVATE_KEY` set in `.env`
- Compiled bytecode available

```bash
node scripts/deploy.js
```

Prints the `CONTRACT_ADDRESS` to stdout on success. Copy this value into `.env` as `CONTRACT_ADDRESS`.

---

## Deployment Info

| Field            | Value |
|---|---|
| Contract Address | *(set in backend `.env` as `CONTRACT_ADDRESS`)* |
| Network          | Polygon Amoy (Chain ID: 80002) |
| Polygonscan URL  | `https://amoy.polygonscan.com/address/<CONTRACT_ADDRESS>` |

---

## Notes

- Each `registerDID` call costs ~0.001 MATIC — 0.5 MATIC covers 500+ registrations
- The deployer wallet private key belongs in `idkitty-backend/.env` as `PRIVATE_KEY` — never commit it
- If the blockchain call fails at runtime, `identity.controller.js` falls back to a mock `txHash` and still saves the identity to MongoDB (graceful degradation)
