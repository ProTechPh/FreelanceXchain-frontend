# Web3 & Smart Contract Integration

FreelanceXchain Frontend integrates directly with Ethereum and EVM-compatible blockchains using **Ethers.js v6**.

---

## 1. Wallet Connection (`src/lib/wallet.ts`)

The wallet utility manages provider discovery, wallet connection, and network verification:

- **Supported Providers:** Browser extension wallets (MetaMask, Coinbase Wallet, Brave Wallet) through `window.ethereum`.
- **Target Networks:**
  - **Polygon Amoy Testnet:** Chain ID `80002` (Production Staging)
  - **Local Ganache RPC:** Chain ID `1337` / `5777` (Local Development)
- **Network Enforcement:** Automatically detects network mismatch and prompts users to switch chains via `wallet_switchEthereumChain` / `wallet_addEthereumChain`.
- **Account Binding:** Connects the active wallet address to the backend user account via `PATCH /auth/wallet`, ensuring signature ownership matches the authenticated user ID.

---

## 2. Escrow & Contract Interaction (`src/lib/escrow-abi.ts`)

Financial transactions interact with the deployed `FreelanceEscrow.sol` smart contracts:

- **Escrow Funding:** Employers fund contract escrows by executing contract deposit transactions directly or triggering backend-orchestrated funding transactions.
- **Milestone Release Verification:** Milestone release confirmations and transaction receipts (`txHash`) link directly to the Polygon Amoy block explorer (`amoy.polygonscan.com`).
- **Dispute Evidence:** On-chain dispute resolution and arbitration records are verified against smart contract event logs.
