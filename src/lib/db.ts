import Dexie, { type EntityTable } from "dexie"

export interface WalletRecord {
  id?: number
  address: string
  encryptedKey: string // JWK encrypted with Master Password
  alias: string
  type: "jwk" | "mnemonic"
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

db.version(1).stores({
  wallets: "++id, address, alias",
  uploads: "++id, txId, fileHash, ownerAddress, storageType",
})

db.version(2)
  .stores({
    wallets: "++id, address, alias",
    uploads: "++id, txId, fileHash, ownerAddress, storageType, createdAt",
  })
  .upgrade((tx) => {
    return tx
      .table("uploads")
      .toCollection()
      .modify((upload) => {
        if (!upload.createdAt) {
          upload.createdAt = Date.now()
        }
      })
  })

// 增加 Vault 配置表用于验证密码
db.version(3).stores({
  wallets: "++id, address, alias",
  uploads: "++id, txId, fileHash, ownerAddress, storageType, createdAt",
  vault: "key",
})

export { db }
