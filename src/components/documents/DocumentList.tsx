"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Download, Share2, Trash2, Clock, MoreVertical, Eye } from "lucide-react"
import { Document } from "@/types"
import { formatFileSize, getFileIcon } from "@/lib/mockData"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DocumentListProps {
  documents: Document[]
  onDelete: (id: string) => void
}

const statusStyles: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-700",
}

const menuActions = [
  { icon: Eye, label: "Preview" },
  { icon: Download, label: "Download" },
  { icon: Share2, label: "Share" },
  { icon: Clock, label: "Version History" },
  { icon: Trash2, label: "Delete", danger: true },
]

export default function DocumentList({ documents, onDelete }: DocumentListProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMenu(null)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKey)
    }
  }, [])

  const openMenu = (docId: string) => {
    if (activeMenu === docId) {
      setActiveMenu(null)
      return
    }
    const btn = buttonRefs.current[docId]
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 160,
      })
    }
    setActiveMenu(docId)
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-3">📂</span>
        <p className="text-sm">No documents found</p>
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
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
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              <span className="text-xl shrink-0">{getFileIcon(doc.mimeType)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  v{doc.version} · {doc.owner}
                </p>
              </div>
            </div>

            <div className="col-span-2">
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                statusStyles[doc.status]
              )}>
                {doc.status}
              </span>
            </div>

            <div className="col-span-2 text-sm text-gray-500">
              {formatFileSize(doc.size)}
            </div>

            <div className="col-span-2 text-sm text-gray-500">
              {new Date(doc.updatedAt).toLocaleDateString()}
            </div>

            <div className="col-span-1 flex justify-end">
              <Button
                ref={(el) => { buttonRefs.current[doc.id] = el }}
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  openMenu(doc.id)
                }}
              >
                <MoreVertical size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {activeMenu && createPortal(
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] w-40 py-1"
          style={{ top: menuPos.top, left: menuPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {menuActions.map((action) => (
            <button
              key={action.label}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-50",
                action.danger ? "text-red-500" : "text-gray-700"
              )}
              onClick={() => {
                if (action.label === "Delete") {
                  onDelete(activeMenu)
                }
                setActiveMenu(null)
              }}
            >
              <action.icon size={13} />
              {action.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}