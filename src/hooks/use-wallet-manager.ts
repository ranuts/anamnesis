import { useState, useCallback, useEffect } from "react"
import { db } from "@/lib/db"
import type { WalletRecord } from "@/lib/db"
import {
  deriveKey,
  encryptData,
  decryptData,
  toBase64,
  fromBase64,
  toBytes,
  fromBytes,
} from "@/lib/crypto"
import { arweave } from "@/lib/storage"
import { toast } from "sonner"
import { useTranslation } from "@/i18n/config"

// Libsodium 要求盐值必须是 16 字节
const VAULT_SALT = new Uint8Array([
  0x61, 0x6e, 0x61, 0x6d, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x2d, 0x76, 0x61, 0x75,
  0x6c, 0x74, 0x31,
]) // 代表 "anamnesis-vault1"

export function useWalletManager() {
  const { t } = useTranslation()
  const [activeWallet, setActiveWallet] = useState<any>(null)
  const [activeAddress, setActiveAddress] = useState<string | null>(null)
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [masterKey, setMasterKey] = useState<Uint8Array | null>(null)
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null)

  const loadWallets = useCallback(async () => {
    const allWallets = await db.wallets.toArray()
    setWallets(allWallets)
  }, [])

  const checkInitialization = useCallback(async () => {
    try {
      const canary = await db.vault.get("canary")
      setIsInitialized(!!canary)
    } catch (e) {
      console.error("Failed to check vault initialization:", e)
      setIsInitialized(false)
    }
  }, [])

  useEffect(() => {
    loadWallets()
    checkInitialization()
  }, [loadWallets, checkInitialization])

  const unlock = useCallback(
    async (password: string) => {
      console.log("Starting unlock process...")
      try {
        const key = await deriveKey(password, VAULT_SALT)
        console.log("Key derived successfully")

        const canaryRecord = await db.vault.get("canary")
        console.log("Canary record found:", !!canaryRecord)

        if (!canaryRecord) {
          console.log("Initializing new vault...")
          const { ciphertext, nonce } = await encryptData(
            toBytes("canary-ok"),
            key,
          )
          await db.vault.put({
            key: "canary",
            value: JSON.stringify({
              ciphertext: toBase64(ciphertext),
              nonce: toBase64(nonce),
            }),
          })
          setMasterKey(key)
          setIsInitialized(true)
          toast.success(t("unlock.successInit"))
          return true
        } else {
          console.log("Verifying existing vault...")
          try {
            const { ciphertext, nonce } = JSON.parse(canaryRecord.value)
            const decrypted = await decryptData(
              fromBase64(ciphertext),
              fromBase64(nonce),
              key,
            )
            const decryptedStr = fromBytes(decrypted)
            console.log("Decryption result:", decryptedStr)

            if (decryptedStr === "canary-ok") {
              setMasterKey(key)
              toast.success(t("unlock.success"))
              return true
            } else {
              console.error("Canary mismatch:", decryptedStr)
              toast.error(t("unlock.incorrect"))
              return false
            }
          } catch (e) {
            console.error("Decryption during verification failed:", e)
            toast.error(t("unlock.incorrect"))
            return false
          }
        }
      } catch (e: any) {
        console.error("Outer unlock error:", e)
        toast.error(`${t("unlock.failed")}: ${e.message || "Unknown error"}`)
        return false
      }
    },
    [checkInitialization, t],
  )

  // 辅助函数：重置保险箱（仅用于调试）
  const resetVault = useCallback(async () => {
    if (
      confirm(
        "Warning: This will clear your master password and identities. Continue?",
      )
    ) {
      await db.vault.clear()
      await db.wallets.clear()
      setMasterKey(null)
      setIsInitialized(false)
      toast.success("Vault has been reset")
      window.location.reload()
    }
  }, [])

  const addWallet = useCallback(
    async (jwk: any, alias: string) => {
      if (!masterKey) {
        toast.error(t("history.errorLocked"))
        return
      }

      try {
        const address = await arweave.wallets.jwkToAddress(jwk)
        const jwkString = JSON.stringify(jwk)
        const { ciphertext, nonce } = await encryptData(
          toBytes(jwkString),
          masterKey,
        )

        const encryptedData = JSON.stringify({
          ciphertext: toBase64(ciphertext),
          nonce: toBase64(nonce),
        })

        await db.wallets.add({
          address,
          encryptedKey: encryptedData,
          alias,
          type: "jwk",
          createdAt: Date.now(),
        })

        await loadWallets()
        toast.success(t("identities.successAdded", { alias }))
      } catch (e) {
        toast.error("Failed to add wallet")
      }
    },
    [masterKey, loadWallets, t],
  )

  const selectWallet = useCallback(
    async (wallet: WalletRecord) => {
      if (!masterKey) {
        toast.error(t("history.errorLocked"))
        return
      }

      try {
        const { ciphertext, nonce } = JSON.parse(wallet.encryptedKey)
        const decryptedBytes = await decryptData(
          fromBase64(ciphertext),
          fromBase64(nonce),
          masterKey,
        )
        const jwk = JSON.parse(fromBytes(decryptedBytes))
        setActiveWallet(jwk)
        setActiveAddress(wallet.address)
        toast.success(t("identities.successActive", { alias: wallet.alias }))
      } catch (e) {
        toast.error("Failed to decrypt wallet key")
      }
    },
    [masterKey, t],
  )

  return {
    activeWallet,
    activeAddress,
    wallets,
    isUnlocked: !!masterKey,
    isInitialized,
    addWallet,
    selectWallet,
    unlock,
    resetVault,
    masterKey,
  }
}
