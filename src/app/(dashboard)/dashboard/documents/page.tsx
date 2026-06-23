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

  const folderTree = useMemo(() => buildFolderTree(mockFolders), [])

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesFolder = selectedFolderId === null || doc.folderId === selectedFolderId
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags?.some((t) => t.includes(search.toLowerCase()))
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter
      return matchesFolder && matchesSearch && matchesStatus
    })
  }, [documents, selectedFolderId, search, statusFilter])

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
          <Button variant="outline" size="sm" className="gap-1.5">
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
            <DocumentList documents={filteredDocuments} />
          </Card>

        </div>
      </div>
    </div>
  )
}