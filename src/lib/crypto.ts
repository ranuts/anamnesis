import sodium from "libsodium-wrappers"

let _s: any = null

export const initSodium = async () => {
  if (_s) return _s
  await sodium.ready
  _s = (sodium as any).default || sodium
  return _s
}

/**
 * 使用浏览器原生的 Web Crypto API (PBKDF2) 派生密钥
 */
export const deriveKey = async (password: string, salt: Uint8Array) => {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  )

  // 关键修复：强制创建一个全新的 Uint8Array 副本，避免使用可能存在的 SharedArrayBuffer
  // 这确保了与 libsodium WASM 内存空间的兼容性
  const cleanKey = new Uint8Array(32)
  cleanKey.set(new Uint8Array(derivedBits))
  return cleanKey
}

// Encrypt data with a key
export const encryptData = async (data: Uint8Array, key: Uint8Array) => {
  const s = await initSodium()
  try {
    const nonce = s.randombytes_buf(s.crypto_secretbox_NONCEBYTES)
    const ciphertext = s.crypto_secretbox_easy(data, nonce, key)
    return { ciphertext, nonce }
  } catch (e) {
    console.error("Encryption failed:", e)
    throw e
  }
}

// Decrypt data with a key
export const decryptData = async (
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array,
) => {
  const s = await initSodium()
  try {
    const result = s.crypto_secretbox_open_easy(ciphertext, nonce, key)
    if (!result) throw new Error("Decryption returned null (wrong key/nonce)")
    return result
  } catch (e) {
    console.error("Decryption failed:", e)
    throw new Error("Decryption failed. Wrong password?")
  }
}

// Helper: Uint8Array to Hex
export const toHex = (bytes: Uint8Array) => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Helper to convert string to Uint8Array
export const toBytes = (str: string) => new TextEncoder().encode(str)
// Helper to convert Uint8Array to string
export const fromBytes = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

// Helper for Base64 conversion
export const toBase64 = (bytes: Uint8Array) => {
  return btoa(String.fromCharCode(...bytes))
}

export const fromBase64 = (base64: string) => {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}
