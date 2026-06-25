"use client"

import { useState } from "react"
import { Search, X, UserCheck, Trash2, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { mockUsers } from "@/lib/mockData"
import { Document, ShareRecord } from "@/types"
import { useAuthStore } from "@/store"

interface ShareModalProps {
  doc: Document
  existingShares: ShareRecord[]
  onClose: () => void
  onShare: (shares: ShareRecord[]) => void
}

const permissionConfig = {
  view:     { label: "View",              description: "Can preview the document"           },
  download: { label: "View + Download",   description: "Can preview and download"           },
  edit:     { label: "View + Edit",       description: "Can preview, download and edit"     },
}

export default function ShareModal({ doc, existingShares, onClose, onShare }: ShareModalProps) {
  const { user: currentUser } = useAuthStore()

  const [search, setSearch]         = useState("")
  const [shares, setShares]         = useState<ShareRecord[]>(existingShares)
  const [copied, setCopied]         = useState(false)

  // Filter out current user and already-shared users from the search list
  const availableUsers = mockUsers.filter((u) =>
    u.id !== currentUser?.id &&
    !shares.find((s) => s.userId === u.id) &&
    (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  )

  const handleAddUser = (userId: string) => {
    const newShare: ShareRecord = {
      id: `sh${Date.now()}`,
      documentId: doc.id,
      userId,
      permission: "view",
      sharedBy: currentUser?.id ?? "1",
      sharedAt: new Date().toISOString(),
    }
    setShares((prev) => [...prev, newShare])
    setSearch("")
  }

  const handleRemoveUser = (userId: string) => {
    setShares((prev) => prev.filter((s) => s.userId !== userId))
  }

  const handlePermissionChange = (userId: string, permission: ShareRecord["permission"]) => {
    setShares((prev) =>
      prev.map((s) => s.userId === userId ? { ...s, permission } : s)
    )
  }

  const handleCopyLink = () => {
    const mockLink = `${window.location.origin}/shared/${doc.id}`
    navigator.clipboard.writeText(mockLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    onShare(shares)
    onClose()
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const getUserById = (id: string) => mockUsers.find((u) => u.id === id)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Share Document</h3>
            <p className="text-xs text-gray-400 truncate max-w-xs">{doc.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Search users */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Add people</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>

          {/* Search results dropdown */}
          {search && availableUsers.length > 0 && (
            <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-50 max-h-40 overflow-y-auto">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleAddUser(u.id)}
                  className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {getInitials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 capitalize shrink-0">{u.role}</span>
                </button>
              ))}
            </div>
          )}

          {search && availableUsers.length === 0 && (
            <p className="text-xs text-gray-400 px-1">No users found</p>
          )}
        </div>

        {/* Current shares */}
        {shares.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Shared with ({shares.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {shares.map((share) => {
                const sharedUser = getUserById(share.userId)
                if (!sharedUser) return null

                return (
                  <div
                    key={share.userId}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                  >
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                      {getInitials(sharedUser.name)}
                    </div>

                    {/* Name + email */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{sharedUser.name}</p>
                      <p className="text-xs text-gray-400 truncate">{sharedUser.email}</p>
                    </div>

                    {/* Permission selector */}
                    <select
                      value={share.permission}
                      onChange={(e) => handlePermissionChange(share.userId, e.target.value as ShareRecord["permission"])}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
                    >
                      {(Object.keys(permissionConfig) as ShareRecord["permission"][]).map((p) => (
                        <option key={p} value={p}>{permissionConfig[p].label}</option>
                      ))}
                    </select>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveUser(share.userId)}
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {shares.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
            <UserCheck size={28} className="mb-2 text-gray-300" />
            <p className="text-sm">Not shared with anyone yet</p>
            <p className="text-xs mt-0.5">Search for people to share with</p>
          </div>
        )}

        {/* Copy link */}
        <div className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700">Copy link</p>
            <p className="text-xs text-gray-400 truncate">
              {window.location.origin}/shared/{doc.id}
            </p>
          </div>
          <button
            onClick={handleCopyLink}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0",
              copied
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-sm hover:bg-slate-700"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  )
}