/**
 * Crypto utilities for client-side AES-GCM encryption.
 * Key is derived from the user's login password via PBKDF2.
 * Encrypted format: base64(12-byte-IV + ciphertext)
 */

const SALT = "GeoPassword2024";
const KEY_STORAGE = "geopassword_enc_key";

/**
 * Derive an AES-GCM key from the user's password.
 * Stores the raw key bytes in sessionStorage for reuse on page navigations.
 */
export async function deriveAndStoreKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: 600000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can store it
    ["encrypt", "decrypt"]
  );

  // Export raw bytes and store in sessionStorage
  const raw = await crypto.subtle.exportKey("raw", key);
  const bytes = new Uint8Array(raw);
  sessionStorage.setItem(KEY_STORAGE, btoa(String.fromCharCode(...bytes)));

  return key;
}

/**
 * Load the stored encryption key from sessionStorage.
 * Returns null if no key is available (user not logged in).
 */
export async function loadKey() {
  const stored = sessionStorage.getItem(KEY_STORAGE);
  if (!stored) return null;

  try {
    const bytes = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
      "raw",
      bytes,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  } catch {
    sessionStorage.removeItem(KEY_STORAGE);
    return null;
  }
}

/**
 * Clear the stored key (on logout).
 */
export function clearKey() {
  sessionStorage.removeItem(KEY_STORAGE);
}

/**
 * Encrypt plaintext with AES-GCM.
 * Returns base64 string of IV + ciphertext.
 * Returns empty string for empty input.
 */
export async function encryptText(key, plaintext) {
  if (!plaintext) return "";
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );

  const encryptedBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv, 0);
  combined.set(encryptedBytes, iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt ciphertext with AES-GCM.
 * Expects base64 string of IV + ciphertext.
 * If decryption fails, returns the original string
 * (for backward compatibility with legacy unencrypted data).
 */
export async function decryptText(key, ciphertext) {
  if (!ciphertext) return "";
  try {
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    // Not encrypted or wrong key — return as-is for legacy data
    return ciphertext;
  }
}
