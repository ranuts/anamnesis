import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import { db, type WalletRecord } from "@/lib/db"
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
import { ethers } from "ethers"

interface WalletContextType {
  wallets: WalletRecord[]
  isUnlocked: boolean
  activeAddress: string | null
  activeWallet: any | null // 解密后的活跃钱包对象
  vaultId: string | null
  masterKey: Uint8Array | null
  unlock: (password: string) => Promise<boolean>
  logout: () => void
  addWallet: (input: any, alias: string) => Promise<void>
  selectWallet: (address: string) => Promise<void>
  getDecryptedKey: (wallet: WalletRecord, passwordConfirm: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const VAULT_SALT = new Uint8Array([
  0x61, 0x6e, 0x61, 0x6d, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x2d, 0x76, 0x61, 0x75,
  0x6c, 0x74, 0x31,
])

export function WalletProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [masterKey, setMasterKey] = useState<Uint8Array | null>(null)
  const [vaultId, setVaultId] = useState<string | null>(null)
  const [activeAddress, setActiveAddress] = useState<string | null>(null)
  const [activeWallet, setActiveWallet] = useState<any | null>(null)

  const getVaultId = async (key: Uint8Array) => {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", key)
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16)
  }

  const loadWallets = useCallback(async () => {
    if (!vaultId) {
      setWallets([])
      return
    }
    const filteredWallets = await db.wallets
      .where("vaultId")
      .equals(vaultId)
      .toArray()
    setWallets(filteredWallets)
  }, [vaultId])

  useEffect(() => {
    loadWallets()
  }, [loadWallets])

  const unlock = async (password: string) => {
    try {
      const key = await deriveKey(password, VAULT_SALT)
      const vid = await getVaultId(key)
      setMasterKey(key)
      setVaultId(vid)
      toast.success(t("unlock.success"))
      return true
    } catch (e) {
      toast.error(t("unlock.failed"))
      return false
    }
  }

  const logout = () => {
    setMasterKey(null)
    setVaultId(null)
    setActiveAddress(null)
    setActiveWallet(null)
    setWallets([])
  }

  const detectChainAndAddress = async (input: string | any) => {
    if (typeof input === "object" && input.kty === "RSA") {
      const address = await arweave.wallets.jwkToAddress(input)
      return { chain: "arweave" as const, address, key: JSON.stringify(input) }
    }
    const str = String(input).trim()
    if (/^(0x)?[0-9a-fA-F]{64}$/.test(str)) {
      const wallet = new ethers.Wallet(str.startsWith("0x") ? str : "0x" + str)
      return { chain: "ethereum" as const, address: wallet.address, key: str }
    }
    // TODO: 完善 Solana/Sui 等地址识别逻辑
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str)) {
        return { chain: "solana" as const, address: str.slice(0, 10) + "...", key: str }
    }
    throw new Error("Unsupported or invalid key format")
  }

  const addWallet = async (input: any, alias: string) => {
    if (!masterKey || !vaultId) return
    try {
      const { chain, address, key } = await detectChainAndAddress(input)
      const { ciphertext, nonce } = await encryptData(toBytes(key), masterKey)
      await db.wallets.add({
        address,
        encryptedKey: JSON.stringify({
          ciphertext: toBase64(ciphertext),
          nonce: toBase64(nonce),
        }),
        alias,
        chain,
        vaultId,
        createdAt: Date.now(),
      })
      await loadWallets()
      toast.success(t("identities.successAdded", { alias }))
    } catch (e: any) {
      toast.error(e.message || "Failed to add wallet")
    }
  }

  const selectWallet = async (address: string) => {
    const walletRecord = wallets.find(w => w.address === address)
    if (!walletRecord || !masterKey) return
    
    try {
        const { ciphertext, nonce } = JSON.parse(walletRecord.encryptedKey)
        const decrypted = await decryptData(fromBase64(ciphertext), fromBase64(nonce), masterKey)
        const keyData = fromBytes(decrypted)
        
        setActiveAddress(address)
        setActiveWallet(walletRecord.chain === 'arweave' ? JSON.parse(keyData) : keyData)
        toast.success(t("identities.successActive", { alias: walletRecord.alias }))
    } catch (e) {
        toast.error("Failed to activate wallet")
    }
  }

  const getDecryptedKey = async (wallet: WalletRecord, passwordConfirm: string) => {
    const key = await deriveKey(passwordConfirm, VAULT_SALT)
    const vid = await getVaultId(key)
    if (vid !== vaultId) throw new Error("Incorrect password")
    const { ciphertext, nonce } = JSON.parse(wallet.encryptedKey)
    const decrypted = await decryptData(fromBase64(ciphertext), fromBase64(nonce), key)
    return fromBytes(decrypted)
  }

  return (
    <WalletContext.Provider
      value={{
        wallets,
        isUnlocked: !!masterKey,
        activeAddress,
        activeWallet,
        vaultId,
        masterKey,
        unlock,
        logout,
        addWallet,
        selectWallet,
        getDecryptedKey,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

