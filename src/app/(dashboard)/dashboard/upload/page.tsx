"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Upload, X, FileText, CheckCircle2, AlertCircle,
  FolderOpen, Tag, ChevronDown, File
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCryptoStore } from "@/store"
import { encryptFile } from "@/lib/crypto"
import { mockDocuments, mockFolders, formatFileSize } from "@/lib/mockData"
import { Document } from "@/types"

// ─────────────────────────────────────────────
// CONSTANTS — FR-04
// ─────────────────────────────────────────────

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf":                                                                    "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":           "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":                 "XLSX",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":         "PPTX",
  "image/jpeg":                                                                         "JPG",
  "image/png":                                                                          "PNG",
  "text/plain":                                                                         "TXT",
  "application/msword":                                                                 "DOC",
  "application/vnd.ms-excel":                                                           "XLS",
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type UploadStatus = "idle" | "encrypting" | "uploading" | "done" | "error"

interface FileEntry {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error: string | null
  // Metadata
  name: string
  tags: string[]
  tagInput: string
  folderId: string | null
  docStatus: Document["status"]
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getFileIcon(mimeType: string): string {
  if (mimeType.includes("pdf"))          return "📄"
  if (mimeType.includes("word"))         return "📝"
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊"
  if (mimeType.includes("presentation")) return "📋"
  if (mimeType.includes("image"))        return "🖼️"
  return "📁"
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES[file.type]) {
    return `File type not supported. Allowed: ${Object.values(ALLOWED_TYPES).join(", ")}`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is 50MB (this file is ${formatFileSize(file.size)})`
  }
  return null
}

function createFileEntry(file: File): FileEntry {
  return {
    id:        `fe_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    file,
    status:    "idle",
    progress:  0,
    error:     validateFile(file),
    name:      file.name.replace(/\.[^/.]+$/, ""), // strip extension for display
    tags:      [],
    tagInput:  "",
    folderId:  null,
    docStatus: "draft",
  }
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function UploadPage() {
  const router                        = useRouter()
  const { masterKey }                 = useCryptoStore()
  const [files, setFiles]             = useState<FileEntry[]>([])
  const [isDragging, setIsDragging]   = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [allDone, setAllDone]         = useState(false)
  const fileInputRef                  = useRef<HTMLInputElement>(null)

  // ── Add files ──
  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr    = Array.from(incoming)
    const entries = arr.map(createFileEntry)
    setFiles((prev) => {
      // Prevent exact duplicate filenames
      const existingNames = new Set(prev.map((f) => f.file.name))
      return [...prev, ...entries.filter((e) => !existingNames.has(e.file.name))]
    })
  }, [])

  // ── Drag handlers ──
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true)  }
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  // ── Remove file ──
  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))

  // ── Update metadata field ──
  const updateEntry = (id: string, patch: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f))
  }

  // ── Tag helpers ──
  const addTag = (id: string, entry: FileEntry) => {
    const tag = entry.tagInput.trim().toLowerCase()
    if (!tag || entry.tags.includes(tag)) return
    updateEntry(id, { tags: [...entry.tags, tag], tagInput: "" })
  }

  const removeTag = (id: string, tag: string) => {
    setFiles((prev) => prev.map((f) =>
      f.id === id ? { ...f, tags: f.tags.filter((t) => t !== tag) } : f
    ))
  }

  // ── Update progress for one file ──
  const setProgress = (id: string, status: UploadStatus, progress: number, error?: string) => {
    setFiles((prev) => prev.map((f) =>
      f.id === id ? { ...f, status, progress, error: error ?? f.error } : f
    ))
  }

  // ── Upload all valid files ──
  const handleUpload = async () => {
    const valid = files.filter((f) => !f.error && f.status === "idle")
    if (valid.length === 0) return

    if (!masterKey) {
      alert("Encryption key not found. Please log out and log back in.")
      return
    }

    setIsUploading(true)

    for (const entry of valid) {
      try {
        // Phase 1 — Encrypt
        setProgress(entry.id, "encrypting", 0)
        const encryptedChunks = await encryptFile(
          entry.file,
          masterKey,
          (percent) => setProgress(entry.id, "encrypting", Math.round(percent * 0.6)) // 0–60%
        )

        // Phase 2 — Simulate upload (in production: stream chunks to backend)
        setProgress(entry.id, "uploading", 60)
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))
        setProgress(entry.id, "uploading", 90)
        await new Promise((r) => setTimeout(r, 300))

        // Phase 3 — Add to mock documents
        const newDoc: Document = {
          id:           `d${mockDocuments.length + 1}_${Date.now()}`,
          name:         `${entry.name}.${entry.file.name.split(".").pop()}`,
          size:         entry.file.size,
          mimeType:     entry.file.type,
          folderId:     entry.folderId,
          ownerId:      "1",
          encryptedKey: "mock-encrypted-key",
          version:      1,
          status:       entry.docStatus,
          createdAt:    new Date().toISOString(),
          updatedAt:    new Date().toISOString(),
          owner:        "Admin User",
          tags:         entry.tags,
        }
        mockDocuments.push(newDoc)

        setProgress(entry.id, "done", 100)

      } catch (err) {
        setProgress(entry.id, "error", 0, "Encryption or upload failed. Please try again.")
      }
    }

    setIsUploading(false)
    setAllDone(true)
  }

  const validCount   = files.filter((f) => !f.error).length
  const doneCount    = files.filter((f) => f.status === "done").length
  const hasFiles     = files.length > 0
  const hasValid     = validCount > 0
  const allCompleted = hasFiles && files.every((f) => f.status === "done" || !!f.error)

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Upload Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Files are encrypted on your device before upload. Supported: PDF, DOCX, XLSX, PPTX, JPG, PNG, TXT
        </p>
      </div>

      {/* Success banner */}
      {allDone && allCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                {doneCount} file{doneCount !== 1 ? "s" : ""} uploaded successfully
              </p>
              <p className="text-xs text-green-600 mt-0.5">All files were encrypted before upload</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="text-sm font-medium text-green-700 hover:text-green-900 underline"
          >
            View Documents
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!allCompleted && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
            isDragging
              ? "border-slate-500 bg-slate-50"
              : "border-gray-300 hover:border-slate-400 hover:bg-gray-50"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Upload size={22} className="text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "Drop files here" : "Drag files here or click to browse"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Multiple files supported · Max 50MB each</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={Object.keys(ALLOWED_TYPES).join(",")}
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files) }}
          />
        </div>
      )}

      {/* File list */}
      {hasFiles && (
        <div className="space-y-3">
          {files.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "bg-white border rounded-xl p-4 space-y-3 transition-colors",
                entry.error   ? "border-red-200 bg-red-50"    :
                entry.status === "done" ? "border-green-200 bg-green-50/30" :
                "border-gray-200"
              )}
            >
              {/* File header */}
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5 shrink-0">{getFileIcon(entry.file.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{entry.file.name}</p>
                    <span className="text-xs text-gray-400 shrink-0">{formatFileSize(entry.file.size)}</span>
                  </div>

                  {/* Error */}
                  {entry.error && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AlertCircle size={12} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-600">{entry.error}</p>
                    </div>
                  )}

                  {/* Progress bar */}
                  {!entry.error && entry.status !== "idle" && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 capitalize">
                          {entry.status === "encrypting" ? "🔐 Encrypting..." :
                           entry.status === "uploading"  ? "☁️ Uploading..."  :
                           entry.status === "done"       ? "✅ Done"          :
                           "❌ Failed"}
                        </p>
                        <p className="text-xs text-gray-400">{entry.progress}%</p>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            entry.status === "done"  ? "bg-green-500" :
                            entry.status === "error" ? "bg-red-500"   :
                            "bg-slate-700"
                          )}
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Remove button */}
                {entry.status === "idle" || entry.error ? (
                  <button
                    onClick={() => removeFile(entry.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                ) : entry.status === "done" ? (
                  <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                ) : null}
              </div>

              {/* Metadata — only show for valid idle files */}
              {!entry.error && entry.status === "idle" && (
                <div className="border-t border-gray-100 pt-3 space-y-3">

                  {/* File display name */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Display Name
                    </label>
                    <input
                      value={entry.name}
                      onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Folder */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <FolderOpen size={11} /> Folder
                      </label>
                      <select
                        value={entry.folderId ?? ""}
                        onChange={(e) => updateEntry(entry.id, { folderId: e.target.value || null })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white"
                      >
                        <option value="">Root (no folder)</option>
                        {mockFolders.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <ChevronDown size={11} /> Status
                      </label>
                      <select
                        value={entry.docStatus}
                        onChange={(e) => updateEntry(entry.id, { docStatus: e.target.value as Document["status"] })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Tag size={11} /> Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                          #{tag}
                          <button onClick={() => removeTag(entry.id, tag)} className="text-slate-400 hover:text-slate-600">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add tag..."
                        value={entry.tagInput}
                        onChange={(e) => updateEntry(entry.id, { tagInput: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addTag(entry.id, entry)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                      />
                      <button
                        onClick={() => addTag(entry.id, entry)}
                        className="px-3 py-1.5 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary + actions */}
      {hasFiles && !allCompleted && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{validCount}</span> valid file{validCount !== 1 ? "s" : ""} ready
            {files.length - validCount > 0 && (
              <span className="text-red-500 ml-2">· {files.length - validCount} invalid</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiles([])}
              disabled={isUploading}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Clear all
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || !hasValid}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isUploading || !hasValid
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-700"
              )}
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload {validCount} file{validCount !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasFiles && (
        <div className="text-center py-6 text-gray-400 text-sm">
          No files selected yet. Drag and drop or click the area above.
        </div>
      )}

      {/* Zero-knowledge notice */}
      <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <span className="text-base mt-0.5">🔐</span>
        <p className="text-xs text-slate-600">
          Files are encrypted on the device using AES-256-GCM before being uploaded.
          The server never receives unencrypted content.  encryption key never leaves the browser tab.
        </p>
      </div>

    </div>
  )
}