import { Document, Folder } from "@/types"

export const mockFolders: Folder[] = [
  { id: "f1", name: "HR Documents", parentId: null, ownerId: "1", createdAt: "2026-01-01" },
  { id: "f2", name: "Finance", parentId: null, ownerId: "1", createdAt: "2026-01-01" },
  { id: "f3", name: "Legal", parentId: null, ownerId: "1", createdAt: "2026-01-01" },
  { id: "f4", name: "Recruitment", parentId: "f1", ownerId: "1", createdAt: "2026-01-01" },
  { id: "f5", name: "Payroll", parentId: "f1", ownerId: "1", createdAt: "2026-01-01" },
  { id: "f6", name: "Invoices", parentId: "f2", ownerId: "1", createdAt: "2026-01-01" },
]

export const mockDocuments: Document[] = [
  {
    id: "d1", name: "Employee Handbook.pdf", size: 2048000,
    mimeType: "application/pdf", folderId: "f1", ownerId: "1",
    encryptedKey: "mock-key", version: 1, status: "approved",
    createdAt: "2026-05-01", updatedAt: "2026-05-01",
    owner: "Admin User", tags: ["hr", "policy"],
  },
  {
    id: "d2", name: "Q1 Report.xlsx", size: 512000,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    folderId: "f2", ownerId: "1", encryptedKey: "mock-key",
    version: 2, status: "approved", createdAt: "2026-04-10",
    updatedAt: "2026-04-15", owner: "Admin User", tags: ["finance", "report"],
  },
  {
    id: "d3", name: "Contract Draft.docx", size: 102400,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    folderId: "f3", ownerId: "1", encryptedKey: "mock-key",
    version: 1, status: "pending", createdAt: "2026-06-01",
    updatedAt: "2026-06-01", owner: "Admin User", tags: ["legal", "contract"],
  },
  {
    id: "d4", name: "Recruitment Policy.pdf", size: 204800,
    mimeType: "application/pdf", folderId: "f4", ownerId: "1",
    encryptedKey: "mock-key", version: 1, status: "draft",
    createdAt: "2026-03-15", updatedAt: "2026-03-15",
    owner: "Admin User", tags: ["hr", "recruitment"],
  },
  {
    id: "d5", name: "Invoice #1042.pdf", size: 98304,
    mimeType: "application/pdf", folderId: "f6", ownerId: "1",
    encryptedKey: "mock-key", version: 1, status: "approved",
    createdAt: "2026-05-20", updatedAt: "2026-05-20",
    owner: "Admin User", tags: ["finance", "invoice"],
  },
]

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "📄"
  if (mimeType.includes("word")) return "📝"
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊"
  if (mimeType.includes("presentation")) return "📋"
  if (mimeType.includes("image")) return "🖼️"
  return "📁"
}

export function buildFolderTree(folders: Folder[]): Folder[] {
  const map: Record<string, Folder> = {}
  folders.forEach((f) => { map[f.id] = { ...f, children: [] } })
  const roots: Folder[] = []
  folders.forEach((f) => {
    if (f.parentId && map[f.parentId]) {
      map[f.parentId].children!.push(map[f.id])
    } else {
      roots.push(map[f.id])
    }
  })
  return roots
}