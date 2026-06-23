import CryptoJS from "crypto-js"

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PBKDF2_ITERATIONS = 200_000  // higher = slower brute force
const PBKDF2_KEY_SIZE = 32         // 256 bits
const SALT_SIZE = 16               // 128 bits
const IV_SIZE = 12                 // 96 bits — recommended for AES-GCM
const CHUNK_SIZE = 4 * 1024 * 1024 // 4MB per chunk for streaming uploads

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface DerivedKeys {
  masterKey: string   // AES-256 key — used to encrypt/decrypt files. NEVER sent to server.
  authHash: string    // Sent to server instead of the real password for authentication.
  salt: string        // Random salt used during derivation — stored in DB, not secret.
}

export interface EncryptedChunk {
  data: ArrayBuffer   // The encrypted binary data
  iv: string          // The IV used — needed for decryption, stored alongside data
}

// ─────────────────────────────────────────────
// STEP 1 — DERIVE KEYS FROM PASSWORD (PBKDF2)
// ─────────────────────────────────────────────
// This is the zero-knowledge foundation.
// The raw password is stretched into two separate keys:
//   - masterKey: never leaves the browser, used for file encryption
//   - authHash:  sent to the server for login verification
//
// Because authHash is derived FROM the masterKey (not the password directly),
// even if the server is compromised, an attacker cannot reconstruct the masterKey.

export function deriveKeysFromPassword(password: string, salt?: string): DerivedKeys {
  // Generate a new random salt if one isn't provided (registration)
  // On login, the salt is fetched from the server and passed in
  const usedSalt = salt ?? CryptoJS.lib.WordArray.random(SALT_SIZE).toString(CryptoJS.enc.Hex)

  // PBKDF2 stretches the password into a 256-bit master key
  // 200,000 iterations makes brute force attacks extremely slow
  const derived = CryptoJS.PBKDF2(password, usedSalt, {
    keySize: PBKDF2_KEY_SIZE / 4, // CryptoJS measures in 32-bit words, so 32 bytes = 8 words
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  })

  const masterKey = derived.toString(CryptoJS.enc.Hex)

  // authHash is a second PBKDF2 pass ON the masterKey (not the password)
  // This means the server only ever sees a derivative — never the real key
  const authHashDerived = CryptoJS.PBKDF2(masterKey, usedSalt + "auth", {
    keySize: PBKDF2_KEY_SIZE / 4,
    iterations: 1, // Only 1 iteration here — the security comes from masterKey already being stretched
    hasher: CryptoJS.algo.SHA256,
  })

  const authHash = authHashDerived.toString(CryptoJS.enc.Hex)

  return { masterKey, authHash, salt: usedSalt }
}

// ─────────────────────────────────────────────
// STEP 2 — ENCRYPT A FILE CHUNK (AES-256-GCM)
// ─────────────────────────────────────────────
// Uses the browser's native Web Crypto API (window.crypto.subtle)
// AES-GCM is authenticated encryption — it detects if the data was tampered with
// Each chunk gets its own random IV — never reuse an IV with the same key

export async function encryptChunk(
  chunk: ArrayBuffer,
  masterKey: string
): Promise<EncryptedChunk> {
  // Convert the hex masterKey string into a CryptoKey object the browser can use
  const keyBuffer = hexToArrayBuffer(masterKey)
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,        // not extractable — key cannot be read back out of memory
    ["encrypt"]
  )

  // Fresh random IV for every single chunk — critical for AES-GCM security
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE))

  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    chunk
  )

  return {
    data: encryptedData,
    iv: arrayBufferToHex(iv.buffer),
  }
}

// ─────────────────────────────────────────────
// STEP 3 — DECRYPT A FILE CHUNK (AES-256-GCM)
// ─────────────────────────────────────────────

export async function decryptChunk(
  encryptedChunk: EncryptedChunk,
  masterKey: string
): Promise<ArrayBuffer> {
  const keyBuffer = hexToArrayBuffer(masterKey)
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  )

  const iv = hexToArrayBuffer(encryptedChunk.iv)

  const decryptedData = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    cryptoKey,
    encryptedChunk.data
  )

  return decryptedData
}

// ─────────────────────────────────────────────
// STEP 4 — SPLIT FILE INTO 4MB CHUNKS
// ─────────────────────────────────────────────
// Prevents the browser from running out of memory on large files
// Each chunk is encrypted independently and uploaded sequentially

export function splitFileIntoChunks(file: File): Blob[] {
  const chunks: Blob[] = []
  let offset = 0

  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size)
    chunks.push(file.slice(offset, end))
    offset = end
  }

  return chunks
}

// ─────────────────────────────────────────────
// STEP 5 — ENCRYPT A FULL FILE (all chunks)
// ─────────────────────────────────────────────
// Encrypts every chunk and returns them with their IVs
// The caller (upload function) then streams these to the server

export async function encryptFile(
  file: File,
  masterKey: string,
  onProgress?: (percent: number) => void
): Promise<EncryptedChunk[]> {
  const chunks = splitFileIntoChunks(file)
  const encryptedChunks: EncryptedChunk[] = []

  for (let i = 0; i < chunks.length; i++) {
    const buffer = await chunks[i].arrayBuffer()
    const encrypted = await encryptChunk(buffer, masterKey)
    encryptedChunks.push(encrypted)

    // Report progress after each chunk
    if (onProgress) {
      onProgress(Math.round(((i + 1) / chunks.length) * 100))
    }
  }

  return encryptedChunks
}

// ─────────────────────────────────────────────
// STEP 6 — ENCRYPT METADATA (file names, tags)
// ─────────────────────────────────────────────
// File names are sensitive too — stored encrypted in the DB
// Uses CryptoJS AES for simple string encryption (not chunked)

export function encryptMetadata(plaintext: string, masterKey: string): string {
  return CryptoJS.AES.encrypt(plaintext, masterKey).toString()
}

export function decryptMetadata(ciphertext: string, masterKey: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, masterKey)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// ─────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
  return bytes.buffer
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// ─────────────────────────────────────────────
// REGISTRATION FLOW SUMMARY
// ─────────────────────────────────────────────
//
// 1. User fills in registration form (name, email, password)
// 2. deriveKeysFromPassword(password) runs on the client:
//    → generates a random salt
//    → stretches password into masterKey (200k PBKDF2 iterations)
//    → derives authHash from masterKey
// 3. masterKey is stored in Zustand RAM store (NEVER in cookie/localStorage)
// 4. { name, email, authHash, salt } is sent to the server
// 5. Server stores authHash (hashed again with argon2) + salt in DB
// 6. Server NEVER sees the masterKey or real password
//
// LOGIN FLOW SUMMARY
//
// 1. User enters email + password
// 2. Frontend fetches the user's salt from server (public, not secret)
// 3. deriveKeysFromPassword(password, salt) re-derives the same keys
// 4. authHash is sent to server for verification
// 5. If valid, server returns accessToken
// 6. masterKey goes back into Zustand RAM — ready for file operations