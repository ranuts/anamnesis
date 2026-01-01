# Anamnesis

[English] | [中文](./README.zh.md)

---

## **1. Product Vision & Overview**

**Product Name:** Anamnesis  
**Core Concept:** A pure, user-sovereignty-first Web3 permanent storage vault. The name originates from Plato's "Theory of Reminiscence," implying this tool helps users' digital souls retrieve and permanently guard memories and data that should be eternal.  
**Product Positioning:** A pure frontend application that acts as a secure "Account & Data Vault." It allows users to manage multi-chain accounts and choose between **permanently burning** files on the Arweave blockchain or **privately sealing** them on the Irys storage network.

## **2. Detailed Features**

### **2.1 Intelligent Multi-Chain Account Management**

- **Multi-Chain Compatibility**: Support for major ecosystems including **Ethereum (EVM), Bitcoin (Taproot/SegWit), Solana, Sui, and Arweave**.
- **Smart Identification**: Automatically detects the chain type when importing private keys, seed phrases, or Arweave JWK files.
- **Master Password Protection**: All sensitive data is encrypted locally using **PBKDF2** for key derivation and **XChaCha20-Poly1305** for high-security encryption.
- **External Wallet Integration**: Seamlessly connect with browser wallets like **MetaMask, Phantom, and Sui Wallet**.
- **Real-Time Portfolio**: Integrated balance tracking for all managed accounts directly from on-chain nodes.

### **2.2 Privacy-First Permaweb Storage**

- **End-to-End Encryption (E2EE)**: Files and metadata (like filenames) are encrypted locally using your Master Password before being transmitted.
- **Flexible Storage Protocols**:
  - **Arweave (Native)**: Direct interaction with the Arweave network for true, immutable permanent storage.
  - **Irys Network**: High-performance storage with multi-token payment support (e.g., pay with ETH/MATIC for permanent storage).
- **Metadata Masking**: Complete privacy on-chain; external observers cannot see original filenames or file types of encrypted uploads.

### **2.3 Data Vault & Retrieval**

- **Unified History**: A single dashboard to manage all your uploads across different protocols and accounts.
- **On-Chain Syncing**: Retrieve your transaction history directly from blockchain gateways, ensuring zero reliance on centralized databases.
- **Local Decryption**: Decrypt and download your private files in one click. Your encryption keys never leave your browser's memory.

## **3. Security Architecture**

- **Zero-Knowledge Architecture**: No servers, no databases, no tracking. Your browser is the only environment where your data exists in an unencrypted state.
- **Local Isolation**: Data is stored in "Vaults" isolated by your Master Password. Supports creating multiple vaults for different purposes.
- **Anti-Brute Force**: High-iteration PBKDF2 ensures that even if your local storage is compromised, the data remains secure against offline attacks.
- **Secure Key Viewing**: Mandatory re-authentication required before viewing mnemonics or private keys.

## **4. Tech Stack**

- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4 + Shadcn/UI
- **Storage**: `arweave-js`, `@irys/sdk`
- **Cryptography**: `libsodium-wrappers`, Web Crypto API (PBKDF2)
- **Database**: `dexie` (IndexedDB wrapper for secure local storage)
- **Blockchain**: `ethers`, `bitcoinjs-lib`, `@solana/web3.js`, `@mysten/sui`, `bip39`, `bip32`, `viem`, `wagmi`
- **Linter & Formatter**: `oxlint`, `prettier`

## **5. Engineering & CI/CD**

- **Automated Workflows**: Powered by GitHub Actions.
  - **CI**: Every PR and push to `main` triggers automated `oxlint`, `prettier` checks, `tsc` type checking, and production build verification.
  - **CD**: Automatic deployment to **GitHub Pages** upon merging to `main`.
- **Consistency**: `.editorconfig` ensures consistent coding styles across different IDEs.

## **6. Getting Started**

### **Installation**

```bash
pnpm install
```

### **Development**

```bash
pnpm dev
```

### **Code Quality Check**

```bash
# Static analysis
pnpm run lint

# Format check
pnpm exec prettier --check .
```

### **Build**

```bash
pnpm run build
```

## **7. License**

This project is licensed under the **AGPL-3.0 License**. See the [LICENSE](./LICENSE) file for details.

---

**Anamnesis — Built with ❤️ for the Permaweb.**
