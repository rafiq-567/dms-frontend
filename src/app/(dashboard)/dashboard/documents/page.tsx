"use client"

import { useState, useMemo } from "react"
import { Search, Filter, FolderPlus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import FolderTree from "@/components/documents/FolderTree"
import DocumentList from "@/components/documents/DocumentList"
import { mockDocuments, mockFolders, buildFolderTree } from "@/lib/mockData"

const statusFilters = ["all", "approved", "pending", "draft", "rejected"]

export default function DocumentsPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [documents, setDocuments] = useState(mockDocuments)

  // Folder states
  const [folders, setFolders] = useState(mockFolders)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState("")

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
                  className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    statusFilter === s
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
            <DocumentList documents={filteredDocuments} onDelete={handleDelete} />
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

    </div>
  )
}