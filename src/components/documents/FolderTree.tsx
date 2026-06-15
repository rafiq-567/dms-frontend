"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react"
import { Folder as FolderType } from "@/types"
import { cn } from "@/lib/utils"

interface FolderTreeProps {
  folders: FolderType[]
  selectedFolderId: string | null
  onSelectFolder: (id: string | null) => void
}

function FolderNode({
  folder,
  selectedFolderId,
  onSelectFolder,
  depth,
}: {
  folder: FolderType
  selectedFolderId: string | null
  onSelectFolder: (id: string | null) => void
  depth: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = folder.children && folder.children.length > 0
  const isSelected = selectedFolderId === folder.id

  return (
    <div>
      <button
        onClick={() => {
          onSelectFolder(folder.id)
          if (hasChildren) setIsOpen(!isOpen)
        }}
        className={cn(
          "flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors",
          isSelected
            ? "bg-slate-100 text-slate-900 font-medium"
            : "text-gray-600 hover:bg-gray-50"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren ? (
          isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : (
          <span className="w-3.5" />
        )}
        {isOpen ? (
          <FolderOpen size={15} className="text-yellow-500 shrink-0" />
        ) : (
          <Folder size={15} className="text-yellow-500 shrink-0" />
        )}
        <span className="truncate">{folder.name}</span>
      </button>

      {isOpen && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FolderTree({ folders, selectedFolderId, onSelectFolder }: FolderTreeProps) {
  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelectFolder(null)}
        className={cn(
          "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors",
          selectedFolderId === null
            ? "bg-slate-100 text-slate-900 font-medium"
            : "text-gray-600 hover:bg-gray-50"
        )}
      >
        <FolderOpen size={15} className="text-slate-500" />
        All Documents
      </button>

      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          depth={0}
        />
      ))}
    </div>
  )
}