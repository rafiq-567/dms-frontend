"use client"

import { useState, useCallback } from "react"
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/mockData"

interface FileItem {
  id: string
  file: File
  status: "waiting" | "encrypting" | "uploading" | "done" | "error"
  progress: number
  error?: string
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/zip",
]

const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB

export default function UploadPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return "File type not supported"
    if (file.size > MAX_FILE_SIZE) return "File exceeds 1GB limit"
    return null
  }

  const addFiles = (newFiles: FileList | File[]) => {
    const items: FileItem[] = Array.from(newFiles).map((file) => {
      const error = validateFile(file) ?? undefined
      return {
        id: crypto.randomUUID(),
        file,
        status: error ? "error" : "waiting",
        progress: 0,
        error,
      }
    })
    setFiles((prev) => [...prev, ...items])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // Mock upload — encryption logic পরে এখানে add হবে
  const handleUpload = async () => {
    const waitingFiles = files.filter((f) => f.status === "waiting")
    if (waitingFiles.length === 0) return

    setIsUploading(true)

    for (const fileItem of waitingFiles) {
      // Step 1: Encrypting (mock)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "encrypting", progress: 0 } : f
        )
      )
      await new Promise((r) => setTimeout(r, 800))

      // Step 2: Uploading with progress (mock)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "uploading", progress: 0 } : f
        )
      )

      for (let progress = 10; progress <= 100; progress += 10) {
        await new Promise((r) => setTimeout(r, 150))
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, progress } : f
          )
        )
      }

      // Step 3: Done
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "done", progress: 100 } : f
        )
      )
    }

    setIsUploading(false)
  }

  const waitingCount = files.filter((f) => f.status === "waiting").length
  const doneCount = files.filter((f) => f.status === "done").length

  const getStatusIcon = (item: FileItem) => {
    if (item.status === "done") return <CheckCircle size={16} className="text-green-500" />
    if (item.status === "error") return <AlertCircle size={16} className="text-red-500" />
    return <FileText size={16} className="text-gray-400" />
  }

  const getStatusLabel = (item: FileItem) => {
    if (item.status === "waiting") return "Ready to upload"
    if (item.status === "encrypting") return "Encrypting..."
    if (item.status === "uploading") return `Uploading ${item.progress}%`
    if (item.status === "done") return "Upload complete"
    if (item.status === "error") return item.error ?? "Error"
    return ""
  }

  return (
    <div className="space-y-4 max-w-3xl">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Upload Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Files are encrypted in your browser before upload.
        </p>
      </div>

      {/* Drop zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragging ? "border-slate-900 bg-slate-50" : "border-gray-200 hover:border-gray-300"
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className={cn(
            "rounded-full p-4 mb-4 transition-colors",
            isDragging ? "bg-slate-200" : "bg-gray-100"
          )}>
            <Upload size={28} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, DOCX, XLSX, PPTX, JPG, PNG, TXT, ZIP — Max 1GB per file
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={onFileInput}
          />
        </CardContent>
      </Card>

      {/* File list */}
      {files.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
              {doneCount > 0 && ` · ${doneCount} uploaded`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {files.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {getStatusIcon(item)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.file.name}
                    </p>
                    <p className={cn(
                      "text-xs",
                      item.status === "error" ? "text-red-500" :
                      item.status === "done" ? "text-green-600" : "text-gray-400"
                    )}>
                      {formatFileSize(item.file.size)} · {getStatusLabel(item)}
                    </p>
                  </div>
                  {item.status === "waiting" && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {(item.status === "uploading" || item.status === "encrypting") && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-7">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        item.status === "encrypting" ? "bg-yellow-400 w-full animate-pulse" : "bg-slate-900"
                      )}
                      style={item.status === "uploading" ? { width: `${item.progress}%` } : {}}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upload button */}
      {waitingCount > 0 && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading
            ? "Uploading..."
            : `Upload ${waitingCount} file${waitingCount !== 1 ? "s" : ""}`}
        </Button>
      )}

      {/* Encryption notice */}
      <p className="text-xs text-gray-400 text-center">
        🔒 Files are encrypted using AES-GCM 256-bit before leaving your browser.
        The server never sees your original files.
      </p>

    </div>
  )
}