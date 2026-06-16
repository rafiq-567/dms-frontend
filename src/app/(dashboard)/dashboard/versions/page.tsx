"use client"

import { useState } from "react"
import { Clock, RotateCcw, Eye, Download, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getFileIcon, formatFileSize } from "@/lib/mockData"

interface Version {
  versionNumber: number
  uploadedBy: string
  uploadedAt: string
  size: number
  comment: string
  isCurrent: boolean
}

interface VersionedDocument {
  id: string
  documentName: string
  mimeType: string
  versions: Version[]
}

const mockVersionedDocs: VersionedDocument[] = [
  {
    id: "vd1",
    documentName: "Contract Draft.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    versions: [
      {
        versionNumber: 3,
        uploadedBy: "Admin User",
        uploadedAt: "2026-06-13T10:30:00Z",
        size: 112640,
        comment: "Updated payment terms and signature section.",
        isCurrent: true,
      },
      {
        versionNumber: 2,
        uploadedBy: "Sarah Johnson",
        uploadedAt: "2026-06-10T14:20:00Z",
        size: 108544,
        comment: "Revised liability clauses.",
        isCurrent: false,
      },
      {
        versionNumber: 1,
        uploadedBy: "Admin User",
        uploadedAt: "2026-06-05T09:00:00Z",
        size: 102400,
        comment: "Initial draft.",
        isCurrent: false,
      },
    ],
  },
  {
    id: "vd2",
    documentName: "Q1 Report.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    versions: [
      {
        versionNumber: 2,
        uploadedBy: "Mike Davis",
        uploadedAt: "2026-06-11T11:00:00Z",
        size: 524288,
        comment: "Added March figures and updated charts.",
        isCurrent: true,
      },
      {
        versionNumber: 1,
        uploadedBy: "Mike Davis",
        uploadedAt: "2026-04-10T08:30:00Z",
        size: 512000,
        comment: "Initial Q1 report.",
        isCurrent: false,
      },
    ],
  },
  {
    id: "vd3",
    documentName: "Employee Handbook.pdf",
    mimeType: "application/pdf",
    versions: [
      {
        versionNumber: 4,
        uploadedBy: "Admin User",
        uploadedAt: "2026-05-01T09:00:00Z",
        size: 2097152,
        comment: "Added remote work policy.",
        isCurrent: true,
      },
      {
        versionNumber: 3,
        uploadedBy: "Admin User",
        uploadedAt: "2026-03-15T10:00:00Z",
        size: 2048000,
        comment: "Updated leave policy.",
        isCurrent: false,
      },
      {
        versionNumber: 2,
        uploadedBy: "HR Team",
        uploadedAt: "2026-01-20T09:30:00Z",
        size: 1966080,
        comment: "Annual review update.",
        isCurrent: false,
      },
      {
        versionNumber: 1,
        uploadedBy: "Admin User",
        uploadedAt: "2025-06-01T08:00:00Z",
        size: 1835008,
        comment: "Initial handbook.",
        isCurrent: false,
      },
    ],
  },
]

export default function VersionsPage() {
  const [search, setSearch] = useState("")
  const [expandedDocs, setExpandedDocs] = useState<string[]>(["vd1"])
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const filtered = mockVersionedDocs.filter((d) =>
    d.documentName.toLowerCase().includes(search.toLowerCase())
  )

  const toggleExpand = (id: string) => {
    setExpandedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  const handleRestore = async (docId: string, versionNumber: number) => {
    setRestoringId(`${docId}-${versionNumber}`)
    await new Promise((r) => setTimeout(r, 1000))
    setRestoringId(null)
    // pore API call hobe
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Version History</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Track changes and restore previous versions of your documents.
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search documents..."
        className="max-w-sm text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Document list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No documents found
          </div>
        )}

        {filtered.map((doc) => {
          const isExpanded = expandedDocs.includes(doc.id)
          const currentVersion = doc.versions.find((v) => v.isCurrent)

          return (
            <Card key={doc.id} className="border border-gray-200 shadow-sm overflow-hidden">

              {/* Document header row */}
              <button
                onClick={() => toggleExpand(doc.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                {isExpanded
                  ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  : <ChevronRight size={16} className="text-gray-400 shrink-0" />
                }
                <span className="text-xl shrink-0">{getFileIcon(doc.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {doc.documentName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.versions.length} version{doc.versions.length !== 1 ? "s" : ""} · Current: v{currentVersion?.versionNumber}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  Last modified {formatDate(doc.versions[0].uploadedAt)}
                </span>
              </button>

              {/* Version timeline */}
              {isExpanded && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {doc.versions.map((version, index) => (
                    <div
                      key={version.versionNumber}
                      className={cn(
                        "flex items-start gap-4 px-4 py-3",
                        version.isCurrent ? "bg-slate-50" : "bg-white"
                      )}
                    >
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full border-2",
                          version.isCurrent
                            ? "bg-slate-900 border-slate-900"
                            : "bg-white border-gray-300"
                        )} />
                        {index < doc.versions.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 min-h-[24px]" />
                        )}
                      </div>

                      {/* Version info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">
                            Version {version.versionNumber}
                          </span>
                          {version.isCurrent && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-white font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(version.uploadedAt)} · {version.uploadedBy} · {formatFileSize(version.size)}
                        </p>
                        {version.comment && (
                          <p className="text-xs text-gray-600 mt-1 bg-gray-50 px-2 py-1 rounded-md">
                            {version.comment}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                          <Eye size={12} />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                          <Download size={12} />
                          Download
                        </Button>
                        {!version.isCurrent && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs h-7 text-slate-700 border-slate-300 hover:bg-slate-100"
                            disabled={restoringId === `${doc.id}-${version.versionNumber}`}
                            onClick={() => handleRestore(doc.id, version.versionNumber)}
                          >
                            <RotateCcw size={12} className={cn(
                              restoringId === `${doc.id}-${version.versionNumber}` && "animate-spin"
                            )} />
                            {restoringId === `${doc.id}-${version.versionNumber}`
                              ? "Restoring..."
                              : "Restore"
                            }
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </Card>
          )
        })}
      </div>
    </div>
  )
}