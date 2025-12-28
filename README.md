# Anamnesis

[English] | [中文](./README.zh.md)

---

## **1. Product Vision & Overview**

**Product Name:** Anamnesis  
**Core Concept:** A pure, user-sovereignty-first Web3 static file storer. The name originates from Plato's "Theory of Reminiscence," implying this tool helps users' digital souls retrieve and permanently guard memories and data that should be eternal.  
**Product Positioning:** A pure frontend application. It allows users to use Arweave wallet identities to choose between **permanently burning** files on the Arweave blockchain or **privately sealing** them on the Irys storage network, forming a complete "Identity - Storage - Retrieval" closed loop.  
**Target Users:**
1.  **Web3 Native Users**: Arweave wallet holders seeking a unified interface for cross-protocol storage.
2.  **Web3 Curious**: Those willing to create their first self-custodial Arweave wallet for true data sovereignty.
3.  **Creators & Archivists**: People needing permanent archiving for digital assets (NFT metadata, source files) or private storage for sensitive documents.

## **2. Core User Flow & Closed Loop**

The entire product experience is built around three core closed loops: **Account & Wallet Management -> Storage & Resource Management -> Resource Search & Download**.

## **3. Detailed Functional Requirements (FRD)**

### **3.1 Module 1: Account & Wallet Management**
This module is the foundation for establishing and managing the user's unique identity.

| Feature | Description | Acceptance Criteria |
| :--- | :--- | :--- |
| **FR1.1 Create Wallet** | Generate new Arweave JWK in the **browser frontend**. | 1. Securely generated via `arweave-js`.<br>2. **Mandatory** backup process for mnemonic/keystore.<br>3. Clear warnings about total data loss if private keys are lost. |
| **FR1.2 Import Wallet** | Allow importing existing wallets via Keystore file or mnemonic. | 1. Support standard JSON key files.<br>2. Mnemonic validation mechanism.<br>3. Display address and balance after import. |
| **FR1.3 Connect Wallet** | Support connection with browser extensions like ArConnect. | 1. Invoke extension authorization.<br>2. Display wallet address and network info. |
| **FR1.4 Wallet Management** | Switch between multiple wallets and manage local wallet list. | 1. Clear wallet switcher in UI.<br>2. Support for aliases and deletion (local only).<br>3. Active address displayed prominently. |
| **FR1.5 Balance Check** | Display native token balances for Arweave and Irys. | 1. Show AR and Irys credit balances.<br>2. Auto-refreshing balance info. |

### **3.2 Module 2: Storage & Resource Management**
The core value module handling the "Storage" and "Management" of data.

| Feature | Description | Acceptance Criteria |
| :--- | :--- | :--- |
| **FR2.1 File Selection** | Select files and calculate hash for unique identification. | Support drag-and-drop and file picker. |
| **FR2.2 Mandatory Encryption** | Files **must** be encrypted locally using the active wallet's key before upload. | 1. Plaintext never leaves the device.<br>2. Use reliable crypto libraries (e.g., libsodium).<br>3. Metadata saves algo and params. |
| **FR2.3 Storage Options** | Choose between Arweave or Irys for encrypted uploads. | 1. Clear distinction: **Arweave (Permanent)** vs **Irys (Private/Scalable)**.<br>2. Comparison of features provided. |
| **FR2.4 Payment & Upload** | Integrate Bundlr/Irys for payment and upload processing. | 1. Call corresponding nodes based on choice.<br>2. Support multi-token payment (AR, ETH, etc.).<br>3. Real-time progress and confirmation status. |
| **FR2.5 Record Management** | Create local record (IndexedDB) and display in UI after success. | Records include: txid, filename, hash, storage type, timestamp, crypto info, owner address. |
| **FR2.6 Unified Dashboard** | Unified view of all files uploaded by the active wallet. | 1. Filtering and sorting support.<br>2. Source marking for each file.<br>3. Sync based on chain queries and local records. |

### **3.3 Module 3: Resource Search & Download**
The value closed loop handling the "Retrieval" of data.

| Feature | Description | Acceptance Criteria |
| :--- | :--- | :--- |
| **FR3.1 Chain Query** | Scan networks on startup or wallet switch to sync transactions. | 1. Sync and verify local records.<br>2. Provide query status feedback. |
| **FR3.2 Permission Check** | Verify active wallet ownership before triggering download. | 1. Compare `ownerAddress` with active wallet.<br>2. Block and prompt switch if unauthorized. |
| **FR3.3 Fetch & Decrypt** | Fetch encrypted data and decrypt in-browser using active private key. | 1. Fetch from correct gateway via `txid`.<br>2. Decrypt with matching algo and key.<br>3. In-memory decryption, keys never transmitted. |
| **FR3.4 File Delivery** | Convert decrypted data to file and trigger browser download. | 1. Restore original filename and format.<br>2. Handle memory/progress for large files. |

## **4. Security Architecture & Performance**

### **4.1 Wallet & Account Security**
- **Zero-Touch Principle**: Private keys never leave the browser memory/local filesystem. No servers involved.
- **Secure Local Storage**: Keystores in IndexedDB are secondary-encrypted with a user-provided **Master Password**.
- **Stateless Session**: Closing the page "logs out" the user.
- **Clear Education**: Strong prompts for backup and responsibility.

### **4.2 Upload Security**
- **End-to-End Encryption (E2EE)**: Mandatory local encryption using industry standards (XChaCha20-Poly1305).
- **Metadata Protection**: Sensitive metadata (like filenames) is encrypted before upload. Public tags remain non-sensitive.
- **Payment Security**: Signatures handled in isolated environments or via trusted extensions.

### **4.3 Download & Decryption Security**
- **Ownership Verification**: Strict check before fetching.
- **In-Memory Decryption**: Plaintext exists briefly in memory and is immediately garbage collected.
- **Key Isolation**: Decryption keys derived from the current session's active wallet only.

## **5. Tech Stack & Deployment**

- **Architecture**: Static React SPA.
- **Core Dependencies**: `arweave-js`, `@irys/sdk`, `libsodium-wrappers`, `dexie`.
