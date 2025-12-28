import { useState, useCallback, useEffect } from "react";
import { db, WalletRecord } from "@/lib/db";
import { deriveKey, encryptData, decryptData, toBase64, fromBase64, toBytes, fromBytes } from "@/lib/crypto";
import { arweave } from "@/lib/storage";
import { toast } from "sonner";

export function useWalletManager() {
  const [activeWallet, setActiveWallet] = useState<any>(null);
  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [masterKey, setMasterKey] = useState<Uint8Array | null>(null);

  const loadWallets = useCallback(async () => {
    const allWallets = await db.wallets.toArray();
    setWallets(allWallets);
  }, []);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const unlock = useCallback(async (password: string) => {
    try {
      // In a real app, you'd store a salt in DB. For simplicity, we use a fixed salt or derive it.
      const salt = toBytes("anamnesis-default-salt"); 
      const key = await deriveKey(password, salt);
      setMasterKey(key);
      toast.success("Identity Layer unlocked");
      return true;
    } catch (e) {
      toast.error("Failed to unlock");
      return false;
    }
  }, []);

  const addWallet = useCallback(async (jwk: any, alias: string) => {
    if (!masterKey) {
      toast.error("Unlock with Master Password first");
      return;
    }

    try {
      const address = await arweave.wallets.jwkToAddress(jwk);
      const jwkString = JSON.stringify(jwk);
      const { ciphertext, nonce } = await encryptData(toBytes(jwkString), masterKey);
      
      const encryptedData = JSON.stringify({
        ciphertext: toBase64(ciphertext),
        nonce: toBase64(nonce)
      });

      await db.wallets.add({
        address,
        encryptedKey: encryptedData,
        alias,
        type: "jwk",
        createdAt: Date.now(),
      });

      await loadWallets();
      toast.success(`Wallet ${alias} added`);
    } catch (e) {
      toast.error("Failed to add wallet");
    }
  }, [masterKey, loadWallets]);

  const selectWallet = useCallback(async (wallet: WalletRecord) => {
    if (!masterKey) {
      toast.error("Unlock first");
      return;
    }

    try {
      const { ciphertext, nonce } = JSON.parse(wallet.encryptedKey);
      const decryptedBytes = await decryptData(
        fromBase64(ciphertext),
        fromBase64(nonce),
        masterKey
      );
      const jwk = JSON.parse(fromBytes(decryptedBytes));
      setActiveWallet(jwk);
      setActiveAddress(wallet.address);
      toast.success(`Active wallet: ${wallet.alias}`);
    } catch (e) {
      toast.error("Failed to decrypt wallet key");
    }
  }, [masterKey]);

  return {
    activeWallet,
    activeAddress,
    wallets,
    unlock,
    isUnlocked: !!masterKey,
    addWallet,
    selectWallet,
    masterKey
  };
}

