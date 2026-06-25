"use client"

import { useState, useMemo } from "react"
import { Search, Filter, FolderPlus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import FolderTree from "@/components/documents/FolderTree"
import DocumentList from "@/components/documents/DocumentList"

import { useCryptoStore } from "@/store"
import { downloadDocument } from "@/lib/download"

import { mockDocuments, mockFolders, buildFolderTree, getFileIcon, formatFileSize } from "@/lib/mockData"

const statusFilters = ["all", "approved", "pending", "draft", "rejected"]

export default function DocumentsPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [documents, setDocuments] = useState(mockDocuments)


  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState("")
  const [editStatus, setEditStatus] = useState<Document["status"]>("draft")
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  const { masterKey } = useCryptoStore()
 

  const handleDownload = (doc: Document) => {
    downloadDocument(doc, masterKey, (status) => {
      if (status === "no-key") alert("Encryption key not found. Please log out and log back in.")
      if (status === "error") alert("Download failed. Please try again.")
    })
  }

  // Folder states 
  const [folders, setFolders] = useState(mockFolders)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState("")

  const handlePreview = (doc: Document) => {
    setPreviewDoc(doc)
  }

  const folderTree = useMemo(() => buildFolderTree(folders), [folders])

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesFolder = selectedFolderId === null || doc.folderId === selectedFolderId
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags?.some((t) => t.includes(search.toLowerCase()))
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter
      return matchesFolder && matchesSearch && matchesStatus
    })
  }, [documents, selectedFolderId, search, statusFilter])

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleEditMetadata = (doc: Document) => {
    setEditingDoc(doc)
    setEditTags(doc.tags || [])
    setEditStatus(doc.status)
  }

  const handleAddTag = () => {
    const tag = editTagInput.trim().toLowerCase()
    if (!tag || editTags.includes(tag)) return
    setEditTags((prev) => [...prev, tag])
    setEditTagInput("")
  }

  const handleRemoveTag = (tag: string) => {
    setEditTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSaveMetadata = () => {
    if (!editingDoc) return
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === editingDoc.id
          ? { ...doc, tags: editTags, status: editStatus, updatedAt: new Date().toISOString() }
          : doc
      )
    )
    setEditingDoc(null)
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    const newFolder = {
      id: `f${folders.length + 1}`,
      name: newFolderName.trim(),
      parentId: selectedFolderId,
      ownerId: "1",
      createdAt: new Date().toISOString(),
    }
    setFolders((prev) => [...prev, newFolder])
    setNewFolderName("")
    setShowNewFolder(false)
  }

  const handleRenameFolder = () => {
    if (!renamingName.trim()) return
    setFolders((prev) =>
      prev.map((f) => f.id === renamingFolderId ? { ...f, name: renamingName.trim() } : f)
    )
    setRenamingFolderId(null)
    setRenamingName("")
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowNewFolder(true)}>
            <FolderPlus size={15} />
            New Folder
          </Button>
          <Button size="sm" className="gap-1.5">
            <Upload size={15} />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex gap-4">

        {/* Sidebar — Folder Tree */}
        <Card className="w-56 shrink-0 p-3 border border-gray-200 shadow-sm h-fit">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">
            Folders
          </p>
          <FolderTree
            folders={folderTree}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onRenameFolder={(id, name) => {
              setRenamingFolderId(id)
              setRenamingName(name)
            }}
          />
        </Card>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Search + Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <Input
                placeholder="Search documents..."
                className="pl-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 items-center">
              <Filter size={14} className="text-gray-400" />
              {statusFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${statusFilter === s
                    ? "bg-slate-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Document list */}
          <Card className="border border-gray-200 shadow-sm">
            <DocumentList documents={filteredDocuments} onDelete={handleDelete} onEditMetadata={handleEditMetadata} onPreview={handlePreview} />
          </Card>

        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">New Folder</h3>
            <input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewFolder(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-sm hover:bg-slate-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renamingFolderId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Rename Folder</h3>
            <input
              type="text"
              placeholder="New folder name..."
              value={renamingName}
              onChange={(e) => setRenamingName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRenamingFolderId(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameFolder}
                className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-sm hover:bg-slate-700"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata + Tags Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Tags & Metadata</h3>
              <button onClick={() => setEditingDoc(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {/* File info */}
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-gray-800">{editingDoc.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">v{editingDoc.version} · {editingDoc.owner}</p>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Document["status"])}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tags</label>

              {/* Existing tags */}
              <div className="flex flex-wrap gap-1.5">
                {editTags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {editTags.length === 0 && (
                  <p className="text-xs text-gray-400">No tags yet</p>
                )}
              </div>

              {/* Add tag input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingDoc(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMetadata}
                className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-sm hover:bg-slate-700"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(previewDoc.mimeType)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{previewDoc.name}</h3>
                  <p className="text-xs text-gray-400">v{previewDoc.version} · {previewDoc.owner}</p>
                </div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center min-h-48 text-center">
              <span className="text-6xl mb-4">{getFileIcon(previewDoc.mimeType)}</span>
              <p className="text-sm font-medium text-gray-700">{previewDoc.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                Server-side preview will be available when backend is connected.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Size", value: formatFileSize(previewDoc.size) },
                { label: "Type", value: previewDoc.mimeType.split("/")[1].toUpperCase() },
                { label: "Version", value: `v${previewDoc.version}` },
                { label: "Status", value: previewDoc.status },
                { label: "Created", value: new Date(previewDoc.createdAt).toLocaleDateString() },
                { label: "Modified", value: new Date(previewDoc.updatedAt).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{item.value}</p>
                </div>
              ))}
            </div>

            {previewDoc.tags && previewDoc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {previewDoc.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (previewDoc) {
                    handleDownload(previewDoc)
                  }
                }}
                className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-sm hover:bg-slate-700"
              >
                Download
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}