# Anamnesis

[English] | [中文](./README.zh.md)

---

## **1. Product Vision & Overview**

**Product Name:** Anamnesis  
**Core Concept:** A pure, user-sovereignty-first Web3 permanent storage vault. The name originates from Plato's "Theory of Reminiscence," implying this tool helps users' digital souls retrieve and permanently guard memories and data that should be eternal.  
**Product Positioning:** A pure frontend application that acts as a secure "Account & Data Vault." It allows users to manage multi-chain accounts and choose between **permanently burning** files on the Arweave blockchain or **privately sealing** them on the Irys storage network.

## **2. Core Features**

### **2.1 Multi-Chain Account Management**

- **Broad Support**: Manage accounts for **Ethereum, Bitcoin (Taproot), Solana, Sui, and Arweave**.
- **Secure Vault**: All accounts are encrypted locally with a **Master Password** using PBKDF2 for key derivation and XChaCha20-Poly1305 for encryption.
- **Automatic Detection**: Import private keys, seed phrases, or Arweave JWKs; the system automatically identifies the chain.
- **BIP39 Support**: Generate new accounts with standard 12-word mnemonics for supported chains.

### **2.2 Privacy-First Storage**

- **End-to-End Encryption (E2EE)**: Files are encrypted locally using the Master Password's derived key before ever leaving your browser.
- **Dual Storage Protocols**:
  - **Arweave Native**: True permanent storage with native AR transactions.
  - **Irys Network**: Fast, scalable storage with multi-token payment support (ETH, MATIC, etc.).
- **Metadata Protection**: Filenames and other metadata are encrypted to ensure complete privacy on-chain.

### **2.3 Secure Data Retrieval**

- **Unified Dashboard**: View all your permanent and private uploads in one place.
- **On-Chain Sync**: Sync transaction history directly from the blockchain gateways.
- **Local Decryption**: One-click decryption and download. Private keys never touch the network.

## **3. Security Architecture**

- **Zero-Knowledge Backend**: No servers, no databases. Your data is your own.
- **Master Password System**: A local "Privacy Layer" protects your saved keys and encrypted files.
- **PBKDF2 Derivation**: High-iteration key derivation to protect against brute-force attacks.
- **Isolation**: Data is compartmentalized into "Vaults" based on the Master Password, allowing for hidden partitions.
- **Secure Key Viewing**: Re-authentication is required to view sensitive private keys or mnemonics.

## **4. Tech Stack**

- **Frontend**: React + Vite + Tailwind CSS + Shadcn/UI
- **Storage**: `arweave-js`, `@irys/sdk`
- **Cryptography**: `libsodium-wrappers`, Web Crypto API (PBKDF2)
- **Database**: `dexie` (IndexedDB wrapper)
- **Blockchain**: `ethers`, `bitcoinjs-lib`, `@solana/web3.js`, `@mysten/sui`, `bip39`, `bip32`
- **Internationalization**: `i18next`

## **5. Getting Started**

### **Installation**

```bash
pnpm install
```

### **Development**

```bash
pnpm dev
```

### **Build**

```bash
pnpm build
```

## **6. License**

This project is licensed under the **AGPL-3.0 License**. See the [LICENSE](./LICENSE) file for details.

---

**Anamnesis — Built with ❤️ for the Permaweb.**
