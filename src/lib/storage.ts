import Arweave from "arweave";
import { WebIrys } from "@irys/sdk";
import { BrowserProvider } from "ethers";
import { db } from "./db";
import { encryptData, toBase64 } from "./crypto";

// Initialize Arweave
export const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

export const generateArweaveWallet = async () => {
  const key = await arweave.wallets.generate();
  const address = await arweave.wallets.jwkToAddress(key);
  return { key, address };
};

export const getIrys = async (provider: any) => {
  const ethersProvider = new BrowserProvider(provider);
  const wallet = { name: "ethersv6", provider: ethersProvider };
  const irys = new WebIrys({
    url: "https://gateway.irys.xyz", // Irys Datachain Mainnet
    token: "ethereum",
    wallet,
  });
  await irys.ready();
  return irys;
};

export const uploadToArweave = async (
  file: File,
  key: any,
  encryptionKey?: Uint8Array
) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        let data = new Uint8Array(reader.result as ArrayBuffer);
        let encryptionInfo = null;

        if (encryptionKey) {
          const { ciphertext, nonce } = await encryptData(data, encryptionKey);
          data = ciphertext;
          encryptionInfo = {
            algo: "XChaCha20-Poly1305",
            params: JSON.stringify({ nonce: toBase64(nonce) }),
          };
        }

        const transaction = await arweave.createTransaction({ data }, key);
        transaction.addTag("Content-Type", encryptionKey ? "application/octet-stream" : file.type);
        transaction.addTag("App-Name", "Anamnesis");
        transaction.addTag("File-Name", file.name);
        if (encryptionInfo) {
          transaction.addTag("Encryption-Algo", encryptionInfo.algo);
          transaction.addTag("Encryption-Params", encryptionInfo.params);
        }

        await arweave.transactions.sign(transaction, key);
        const response = await arweave.transactions.post(transaction);

        if (response.status === 200) {
          const address = await arweave.wallets.jwkToAddress(key);
          await db.uploads.add({
            txId: transaction.id,
            fileName: file.name,
            fileHash: "", // TODO: Add real hashing
            storageType: "arweave",
            ownerAddress: address,
            encryptionAlgo: encryptionInfo?.algo || "none",
            encryptionParams: encryptionInfo?.params || "{}",
            createdAt: Date.now(),
          });
          resolve(transaction.id);
        } else {
          reject(new Error(`Arweave upload failed: ${response.status}`));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const uploadToIrys = async (
  file: File,
  irys: WebIrys,
  encryptionKey?: Uint8Array
) => {
  try {
    let data = new Uint8Array(await file.arrayBuffer());
    let encryptionInfo = null;

    if (encryptionKey) {
      const { ciphertext, nonce } = await encryptData(data, encryptionKey);
      data = ciphertext;
      encryptionInfo = {
        algo: "XChaCha20-Poly1305",
        params: JSON.stringify({ nonce: toBase64(nonce) }),
      };
    }

    const tags = [
      { name: "Content-Type", value: encryptionKey ? "application/octet-stream" : file.type },
      { name: "App-Name", value: "Anamnesis" },
      { name: "File-Name", value: file.name },
    ];
    if (encryptionInfo) {
      tags.push({ name: "Encryption-Algo", value: encryptionInfo.algo });
      tags.push({ name: "Encryption-Params", value: encryptionInfo.params });
    }

    const receipt = await irys.upload(data, { tags });
    
    await db.uploads.add({
      txId: receipt.id,
      fileName: file.name,
      fileHash: "", // TODO: Add real hashing
      storageType: "irys",
      ownerAddress: irys.address,
      encryptionAlgo: encryptionInfo?.algo || "none",
      encryptionParams: encryptionInfo?.params || "{}",
      createdAt: Date.now(),
    });

    return receipt.id;
  } catch (error) {
    console.error("Irys upload error:", error);
    throw error;
  }
};
