import _sodium from "libsodium-wrappers";

let sodium: typeof _sodium;

export const initSodium = async () => {
  if (!sodium) {
    await _sodium.ready;
    sodium = _sodium;
  }
  return sodium;
};

// Derive a secret key from a master password using Argon2
export const deriveKey = async (password: string, salt: Uint8Array) => {
  const s = await initSodium();
  return s.crypto_pwhash(
    s.crypto_secretbox_KEYBYTES,
    password,
    salt,
    s.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    s.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    s.crypto_pwhash_ALG_ARGON2ID13
  );
};

// Encrypt data with a key
export const encryptData = async (data: Uint8Array, key: Uint8Array) => {
  const s = await initSodium();
  const nonce = s.randombytes_buf(s.crypto_secretbox_NONCEBYTES);
  const ciphertext = s.crypto_secretbox_easy(data, nonce, key);
  return { ciphertext, nonce };
};

// Decrypt data with a key
export const decryptData = async (
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
) => {
  const s = await initSodium();
  try {
    return s.crypto_secretbox_open_easy(ciphertext, nonce, key);
  } catch (e) {
    throw new Error("Decryption failed. Wrong password?");
  }
};

// Helper to convert string to Uint8Array
export const toBytes = (str: string) => new TextEncoder().encode(str);
// Helper to convert Uint8Array to string
export const fromBytes = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

// Helper for Base64 conversion
export const toBase64 = (bytes: Uint8Array) => {
  return btoa(String.fromCharCode(...bytes));
};

export const fromBase64 = (base64: string) => {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

