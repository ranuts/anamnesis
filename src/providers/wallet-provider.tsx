import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
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
import * as solana from "@solana/web3.js"
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519"
import * as bitcoin from "bitcoinjs-lib"
import * as ecc from "tiny-secp256k1"
import ECPairFactory from "ecpair"
import bs58 from "bs58"
import * as bip39 from "bip39"
import { derivePath } from "ed25519-hd-key"
import { BIP32Factory } from "bip32"

// Initialize Bitcoin ecc
bitcoin.initEccLib(ecc)
const ECPair = ECPairFactory(ecc)
const bip32 = BIP32Factory(ecc)

interface DecryptedData {
  key: string
  mnemonic?: string
}

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
  createWallet: (chain: WalletRecord["chain"], alias: string) => Promise<void>
  selectWallet: (address: string) => Promise<void>
  getDecryptedInfo: (
    wallet: WalletRecord,
    passwordConfirm: string,
  ) => Promise<DecryptedData>
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
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", key as any)
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

  const unlock = useCallback(
    async (password: string) => {
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
    },
    [t],
  )

  const logout = useCallback(() => {
    setMasterKey(null)
    setVaultId(null)
    setActiveAddress(null)
    setActiveWallet(null)
    setWallets([])
  }, [])

  const detectChainAndAddress = async (input: string | any) => {
    // 1. Arweave JWK
    if (typeof input === "object" && input.kty === "RSA") {
      const address = await arweave.wallets.jwkToAddress(input)
      return {
        chain: "arweave" as const,
        address,
        key: JSON.stringify(input),
      }
    }

    const str = String(input).trim()

    // 2. Mnemonic Detection (12 or 24 words)
    if (bip39.validateMnemonic(str)) {
      // For mnemonic, we default to Ethereum for detection, but it could be others.
      // We'll return it as a special case.
      const wallet = ethers.Wallet.fromPhrase(str)
      return {
        chain: "ethereum" as const,
        address: wallet.address,
        key: wallet.privateKey,
        mnemonic: str,
      }
    }

    // 3. Ethereum Private Key (Hex, 64 chars)
    if (/^(0x)?[0-9a-fA-F]{64}$/.test(str)) {
      const wallet = new ethers.Wallet(str.startsWith("0x") ? str : "0x" + str)
      return { chain: "ethereum" as const, address: wallet.address, key: str }
    }

    // 4. Solana Secret Key (Base58)
    if (/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(str)) {
      try {
        const keypair = solana.Keypair.fromSecretKey(bs58.decode(str))
        return {
          chain: "solana" as const,
          address: keypair.publicKey.toBase58(),
          key: str,
        }
      } catch (e) {}
    }

    // 5. Sui Private Key
    if (str.startsWith("suiprivkey")) {
      try {
        const keypair = Ed25519Keypair.fromSecretKey(str)
        return {
          chain: "sui" as const,
          address: keypair.getPublicKey().toSuiAddress(),
          key: str,
        }
      } catch (e) {}
    }

    // 6. Bitcoin WIF (Primary: Taproot bc1p, Fallback: SegWit bc1q)
    try {
      const keyPair = ECPair.fromWIF(str)
      // Taproot (bc1p)
      const { address: taprootAddress } = bitcoin.payments.p2tr({
        internalPubkey: Buffer.from(keyPair.publicKey.slice(1, 33)),
      })
      if (taprootAddress)
        return { chain: "bitcoin" as const, address: taprootAddress, key: str }
    } catch (e) {}

    // Fallback for Arweave JWK or Solana Uint8Array in string format
    try {
      const parsed = JSON.parse(str)
      if (parsed.kty === "RSA") {
        const address = await arweave.wallets.jwkToAddress(parsed)
        return { chain: "arweave" as const, address, key: str }
      }
      if (Array.isArray(parsed) && parsed.length === 64) {
        const keypair = solana.Keypair.fromSecretKey(new Uint8Array(parsed))
        return {
          chain: "solana" as const,
          address: keypair.publicKey.toBase58(),
          key: bs58.encode(new Uint8Array(parsed)),
        }
      }
    } catch (e) {}

    throw new Error("Unsupported or invalid key format")
  }

  const createWallet = useCallback(
    async (chain: WalletRecord["chain"], alias: string) => {
      if (!masterKey || !vaultId) return
      try {
        let key: string
        let address: string
        let mnemonic: string | undefined

        if (chain === "arweave") {
          // Arweave typically doesn't use BIP39 mnemonics in the same way, generating JWK
          const jwk = await arweave.wallets.generate()
          key = JSON.stringify(jwk)
          address = await arweave.wallets.jwkToAddress(jwk)
        } else {
          // Generate a standard BIP39 mnemonic for others
          mnemonic = bip39.generateMnemonic()
          const seed = await bip39.mnemonicToSeed(mnemonic)

          if (chain === "ethereum") {
            const wallet = ethers.Wallet.fromPhrase(mnemonic)
            key = wallet.privateKey
            address = wallet.address
          } else if (chain === "solana") {
            const derived = derivePath("m/44'/501'/0'/0'", seed.toString("hex"))
            const keypair = solana.Keypair.fromSeed(derived.key)
            key = bs58.encode(keypair.secretKey)
            address = keypair.publicKey.toBase58()
          } else if (chain === "sui") {
            const keypair = Ed25519Keypair.deriveKeypair(mnemonic)
            key = keypair.getSecretKey()
            address = keypair.getPublicKey().toSuiAddress()
          } else if (chain === "bitcoin") {
            const root = bip32.fromSeed(seed)
            const child = root.derivePath("m/86'/0'/0'/0/0")
            const { address: btcAddress } = bitcoin.payments.p2tr({
              internalPubkey: Buffer.from(child.publicKey.slice(1, 33)),
            })
            key = ECPair.fromPrivateKey(child.privateKey!).toWIF()
            address = btcAddress || "unknown"
          } else {
            throw new Error("Unsupported chain for creation")
          }
        }

        const storageData: DecryptedData = { key, mnemonic }
        const { ciphertext, nonce } = await encryptData(
          toBytes(JSON.stringify(storageData)),
          masterKey,
        )
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
        console.error("Wallet creation error:", e)
        toast.error(e.message || "Failed to create wallet")
      }
    },
    [masterKey, vaultId, loadWallets, t],
  )

  const addWallet = useCallback(
    async (input: any, alias: string) => {
      if (!masterKey || !vaultId) return
      try {
        const { chain, address, key, mnemonic } =
          await detectChainAndAddress(input)
        const storageData: DecryptedData = { key, mnemonic }
        const { ciphertext, nonce } = await encryptData(
          toBytes(JSON.stringify(storageData)),
          masterKey,
        )
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
    },
    [masterKey, vaultId, loadWallets, t],
  )

  const selectWallet = useCallback(
    async (address: string) => {
      const walletRecord = wallets.find((w) => w.address === address)
      if (!walletRecord || !masterKey) return

      try {
        const { ciphertext, nonce } = JSON.parse(walletRecord.encryptedKey)
        const decrypted = await decryptData(
          fromBase64(ciphertext),
          fromBase64(nonce),
          masterKey,
        )
        const data: DecryptedData = JSON.parse(fromBytes(decrypted))

        setActiveAddress(address)
        setActiveWallet(
          walletRecord.chain === "arweave" ? JSON.parse(data.key) : data.key,
        )
        toast.success(
          t("identities.successActive", { alias: walletRecord.alias }),
        )
      } catch (e) {
        toast.error("Failed to activate wallet")
      }
    },
    [wallets, masterKey, t],
  )

  const getDecryptedInfo = useCallback(
    async (wallet: WalletRecord, passwordConfirm: string) => {
      try {
        const key = await deriveKey(passwordConfirm, VAULT_SALT)
        const vid = await getVaultId(key)

        // 如果当前 session 有 vaultId，先进行快速比对
        if (vaultId && vid !== vaultId) {
          throw new Error("Incorrect password")
        }

        const { ciphertext, nonce } = JSON.parse(wallet.encryptedKey)
        const decrypted = await decryptData(
          fromBase64(ciphertext),
          fromBase64(nonce),
          key,
        )
        return JSON.parse(fromBytes(decrypted))
      } catch (e: any) {
        console.error("Decryption info error:", e)
        throw new Error(e.message || "Incorrect password or decryption failed")
      }
    },
    [vaultId],
  )

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
        createWallet,
        selectWallet,
        getDecryptedInfo,
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
