import { decryptChunk, encryptChunk, EncryptedChunk } from "@/lib/crypto"
import { Document } from "@/types"

// ─────────────────────────────────────────────
// MOCK: Simulate encrypted file chunks from server
// ─────────────────────────────────────────────
// In production, this would be:
// const response = await api.get(`/documents/${doc.id}/chunks`)
// which returns an array of { data: ArrayBuffer, iv: string }
//
// For now we generate fake plaintext, encrypt it with the masterKey,
// and immediately decrypt it — proving the full crypto pipeline works
// even without a real backend.

async function fetchMockEncryptedChunks(
  doc: Document,
  masterKey: string
): Promise<EncryptedChunk[]> {
  // Create realistic fake content based on file type
  const fakeContent = generateFakeContent(doc)
  const encoder = new TextEncoder()
  const buffer = encoder.encode(fakeContent).buffer

  // Actually encrypt it so decryption is real, not simulated
  const encrypted = await encryptChunk(buffer, masterKey)
  return [encrypted]
}

function generateFakeContent(doc: Document): string {
  if (doc.mimeType.includes("pdf")) {
    return `%PDF-1.4 Mock PDF content for: ${doc.name}\nVersion: ${doc.version}\nOwner: ${doc.owner}\nCreated: ${doc.createdAt}`
  }
  if (doc.mimeType.includes("word")) {
    return `Mock Word Document\n\nFile: ${doc.name}\nVersion: v${doc.version}\nOwner: ${doc.owner}\n\nThis is simulated content. Real content will be decrypted from the server when backend is connected.`
  }
  if (doc.mimeType.includes("sheet") || doc.mimeType.includes("excel")) {
    return `Mock Spreadsheet\nFile,${doc.name}\nVersion,${doc.version}\nOwner,${doc.owner}\nStatus,${doc.status}`
  }
  return `Mock file content for: ${doc.name}`
}

// ─────────────────────────────────────────────
// MIME TYPE → FILE EXTENSION
// ─────────────────────────────────────────────

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "image/png": "png",
    "image/jpeg": "jpg",
    "text/plain": "txt",
  }
  return map[mimeType] ?? "bin"
}

// ─────────────────────────────────────────────
// TRIGGER BROWSER DOWNLOAD
// ─────────────────────────────────────────────

function triggerDownload(buffer: ArrayBuffer, fileName: string, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")

  a.href     = url
  a.download = fileName
  a.click()

  // Clean up the object URL after download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─────────────────────────────────────────────
// MAIN DOWNLOAD FUNCTION
// ─────────────────────────────────────────────

export type DownloadStatus = "idle" | "fetching" | "decrypting" | "done" | "error" | "no-key"

export async function downloadDocument(
  doc: Document,
  masterKey: string | null,
  onStatus: (status: DownloadStatus) => void
): Promise<void> {

  // Guard: masterKey must exist in RAM
  // If user refreshed the page, the key is gone and they must log in again
  if (!masterKey) {
    onStatus("no-key")
    return
  }

  try {
    // Step 1 — Fetch encrypted chunks from server (mocked)
    onStatus("fetching")
    const encryptedChunks = await fetchMockEncryptedChunks(doc, masterKey)

    // Step 2 — Decrypt each chunk in the browser
    onStatus("decrypting")
    const decryptedParts: ArrayBuffer[] = []

    for (const chunk of encryptedChunks) {
      const decrypted = await decryptChunk(chunk, masterKey)
      decryptedParts.push(decrypted)
    }

    // Step 3 — Reassemble chunks into a single buffer
    const totalSize    = decryptedParts.reduce((sum, part) => sum + part.byteLength, 0)
    const combined     = new Uint8Array(totalSize)
    let offset         = 0

    for (const part of decryptedParts) {
      combined.set(new Uint8Array(part), offset)
      offset += part.byteLength
    }

    // Step 4 — Trigger browser download
    const fileName = doc.name.includes(".")
      ? doc.name
      : `${doc.name}.${getExtension(doc.mimeType)}`

    triggerDownload(combined.buffer, fileName, doc.mimeType)
    onStatus("done")

  } catch (err) {
    console.error("Download failed:", err)
    onStatus("error")
  }
}