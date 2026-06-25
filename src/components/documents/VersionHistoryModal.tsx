"use client"

import { X, Clock, Download, RotateCcw, User } from "lucide-react"
import { Document } from "@/types"
import { formatFileSize, getFileIcon } from "@/lib/mockData"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// MOCK VERSION DATA
// ─────────────────────────────────────────────

export interface DocumentVersion {
  version: number
  size: number
  updatedAt: string
  updatedBy: string
  changeNote: string
  status: Document["status"]
}

export const mockVersions: Record<string, DocumentVersion[]> = {
  d1: [
    { version: 1, size: 2048000, updatedAt: "2026-05-01", updatedBy: "Admin User",    changeNote: "Initial upload",              status: "approved" },
  ],
  d2: [
    { version: 1, size: 480000,  updatedAt: "2026-04-10", updatedBy: "Admin User",    changeNote: "Initial upload",              status: "draft"    },
    { version: 2, size: 512000,  updatedAt: "2026-04-15", updatedBy: "Sarah Johnson", changeNote: "Updated Q1 figures for March", status: "approved" },
  ],
  d3: [
    { version: 1, size: 102400,  updatedAt: "2026-06-01", updatedBy: "Admin User",    changeNote: "Initial draft",               status: "pending"  },
  ],
  d4: [
    { version: 1, size: 204800,  updatedAt: "2026-03-15", updatedBy: "Admin User",    changeNote: "Initial upload",              status: "draft"    },
  ],
  d5: [
    { version: 1, size: 98304,   updatedAt: "2026-05-20", updatedBy: "Admin User",    changeNote: "Initial upload",              status: "approved" },
  ],
}

// ─────────────────────────────────────────────
// STATUS STYLES
// ─────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  draft:    "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-700",
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

interface VersionHistoryModalProps {
  doc: Document
  onClose: () => void
  onRestore: (doc: Document, version: DocumentVersion) => void
}

export default function VersionHistoryModal({ doc, onClose, onRestore }: VersionHistoryModalProps) {
  const versions = (mockVersions[doc.id] ?? []).slice().reverse() // newest first

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Version History</h3>
              <p className="text-xs text-gray-400 truncate max-w-xs">{doc.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Version list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {versions.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              No version history available
            </div>
          )}

          {versions.map((v, index) => {
            const isCurrent = v.version === doc.version

            return (
              <div
                key={v.version}
                className={cn(
                  "border rounded-lg p-3 space-y-2 transition-colors",
                  isCurrent
                    ? "border-slate-300 bg-slate-50"
                    : "border-gray-200 hover:bg-gray-50"
                )}
              >
                {/* Version header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      v{v.version}
                    </span>
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 bg-slate-900 text-white rounded-full">
                        Current
                      </span>
                    )}
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                      statusStyles[v.status]
                    )}>
                      {v.status}
                    </span>
                  </div>

                  {/* Actions — only show for non-current versions */}
                  {!isCurrent && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRestore(doc, v)}
                        title="Restore this version"
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <RotateCcw size={11} />
                        Restore
                      </button>
                      <button
                        title="Download this version"
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Download size={11} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Version details */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(v.updatedAt).toLocaleDateString(undefined, {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={11} />
                    {v.updatedBy}
                  </div>
                  <div>{formatFileSize(v.size)}</div>
                </div>

                {/* Change note */}
                <p className="text-xs text-gray-600 bg-white border border-gray-100 rounded px-2 py-1">
                  {v.changeNote}
                </p>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}