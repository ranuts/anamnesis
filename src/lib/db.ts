import Dexie, { type EntityTable } from "dexie";

export interface WalletRecord {
  id?: number;
  address: string;
  encryptedKey: string; // JWK encrypted with Master Password
  alias: string;
  type: "jwk" | "mnemonic";
  createdAt: number;
}

export interface UploadRecord {
  id?: number;
  txId: string;
  fileName: string;
  fileHash: string;
  storageType: "arweave" | "irys";
  ownerAddress: string;
  encryptionAlgo: string;
  encryptionParams: string; // JSON string of nonce etc.
  createdAt: number;
}

const db = new Dexie("AnamnesisDB") as Dexie & {
  wallets: EntityTable<WalletRecord, "id">;
  uploads: EntityTable<UploadRecord, "id">;
};

db.version(1).stores({
  wallets: "++id, address, alias",
  uploads: "++id, txId, fileHash, ownerAddress, storageType",
});

export { db };

