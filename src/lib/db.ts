import Dexie, { type EntityTable } from "dexie"

export interface WalletRecord {
  id?: number
  address: string
  encryptedKey: string // Encrypted with Master Password
  alias: string
  chain: "ethereum" | "arweave" | "solana" | "sui" | "bitcoin" | "other"
  vaultId: string // Hash of the derived key to separate "compartments"
  createdAt: number
}

export interface UploadRecord {
  id?: number
  txId: string
  fileName: string
  fileHash: string
  storageType: "arweave" | "irys"
  ownerAddress: string
  encryptionAlgo: string
  encryptionParams: string // JSON string of nonce etc.
  createdAt: number
}

export interface VaultMetadata {
  key: string
  value: string // JSON string of encrypted canary
}

const db = new Dexie("AnamnesisDB") as Dexie & {
  wallets: EntityTable<WalletRecord, "id">
  uploads: EntityTable<UploadRecord, "id">
  vault: EntityTable<VaultMetadata, "key">
}

// 增加多链支持和金库标识
db.version(4).stores({
  wallets: "++id, address, alias, chain, vaultId",
  uploads: "++id, txId, fileHash, ownerAddress, storageType, createdAt",
  vault: "key",
})

export { db }
