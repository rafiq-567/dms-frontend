"use client"

import { useState } from "react"
import {
  Download, Share2, Trash2, Clock, MoreVertical, Eye
} from "lucide-react"
import { Document } from "@/types"
import { formatFileSize, getFileIcon } from "@/lib/mockData"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DocumentListProps {
  documents: Document[]
}

const statusStyles: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-700",
}

export default function DocumentList({ documents }: DocumentListProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-3">📂</span>
        <p className="text-sm">No documents found</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Header */}
      <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-1"></div>
      </div>

      {documents.map((doc) => (
        <div
          key={doc.id}
          className="grid grid-cols-12 px-4 py-3 items-center hover:bg-gray-50 transition-colors group"
        >
          {/* Name */}
          <div className="col-span-5 flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0">{getFileIcon(doc.mimeType)}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
              <p className="text-xs text-gray-400 truncate">
                v{doc.version} · {doc.owner}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="col-span-2">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
              statusStyles[doc.status]
            )}>
              {doc.status}
            </span>
          </div>

          {/* Size */}
          <div className="col-span-2 text-sm text-gray-500">
            {formatFileSize(doc.size)}
          </div>

          {/* Date */}
          <div className="col-span-2 text-sm text-gray-500">
            {new Date(doc.updatedAt).toLocaleDateString()}
          </div>

          {/* Actions */}
          <div className="col-span-1 flex justify-end">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
              >
                <MoreVertical size={14} />
              </Button>

              {activeMenu === doc.id && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-40 py-1">
                  {[
                    { icon: Eye, label: "Preview" },
                    { icon: Download, label: "Download" },
                    { icon: Share2, label: "Share" },
                    { icon: Clock, label: "Version History" },
                    { icon: Trash2, label: "Delete", danger: true },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-50",
                        action.danger ? "text-red-500" : "text-gray-700"
                      )}
                      onClick={() => setActiveMenu(null)}
                    >
                      <action.icon size={13} />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}