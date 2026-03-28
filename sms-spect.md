  # IDKitty — Smart Contract Spec

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

  ## Deploy Steps (Remix IDE → Amoy Testnet)

  ### Step 1 — Setup Wallet

  1. Install MetaMask
  2. Add Polygon Amoy testnet manually:

  | Field | Value |
  |---|---|
  | Network Name | Polygon Amoy |
  | RPC URL | `https://rpc-amoy.polygon.technology` |
  | Chain ID | `80002` |
  | Symbol | `MATIC` |
  | Explorer | `https://amoy.polygonscan.com` |

  ### Step 2 — Get Test MATIC

  - Faucet: `https://faucet.polygon.technology`
  - Select "Amoy" network, paste wallet address
  - You'll get 0.5 MATIC — more than enough

  ### Step 3 — Deploy on Remix

  1. Go to `https://remix.ethereum.org`
  2. Create new file → paste `DIDRegistry.sol`
  3. **Compiler tab** → select `0.8.0` → click **Compile**
  4. **Deploy tab** → Environment: select `Injected Provider - MetaMask`
  5. Make sure MetaMask is on Amoy network
  6. Click **Deploy** → confirm transaction in MetaMask
  7. Copy the contract address from Remix console

  ### Step 4 — Verify it worked

  1. Go to `https://amoy.polygonscan.com`
  2. Paste your contract address
  3. You should see the deployment transaction

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

  ---

  ## Placeholders *(fill during hackathon)*

  ```
  CONTRACT_ADDRESS = 0x________________________________________________

  DEPLOYMENT_TX    = 0x________________________________________________

  POLYGONSCAN_URL  = https://amoy.polygonscan.com/address/[CONTRACT_ADDRESS]

  DEPLOYER_WALLET  = 0x________________________________________________

  DEPLOYED_AT      = [DATE / TIME]

  NETWORK          = Polygon Amoy Testnet (Chain ID: 80002)
  ```

  ---

  ## Notes

  - **Deploy this first** at the hackathon — Amoy can be slow, don't leave it for later
  - Save the ABI as `DIDRegistry.json` in `backend/contracts/`
  - The deployer wallet private key goes in `backend/.env` as `PRIVATE_KEY` — **never commit it**
  - Each `registerDID` call costs ~0.001 MATIC — your 0.5 MATIC covers 500+ registrations
