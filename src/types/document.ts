export interface Document {
  id: string
  name: string
  size: number
  mimeType: string
  folderId: string | null
  ownerId: string
  encryptedKey: string
  version: number
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  updatedAt: string
  owner?: string
  tags?: string[]
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  ownerId: string
  createdAt: string
  children?: Folder[]
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: "encrypting" | "uploading" | "done" | "error"
}