"use client"

import { useState } from "react"
import { Share2, Link, Users, Eye, Download, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getFileIcon, formatFileSize } from "@/lib/mockData"

interface SharedDocument {
  id: string
  documentName: string
  mimeType: string
  size: number
  sharedBy: string
  sharedAt: string
  expiresAt: string | null
  permission: "view" | "download" | "edit"
  type: "shared_with_me" | "shared_by_me"
  recipients?: string[]
  hasPassword: boolean
}

const mockShared: SharedDocument[] = [
  {
    id: "s1",
    documentName: "Project Proposal.pdf",
    mimeType: "application/pdf",
    size: 1024000,
    sharedBy: "Sarah Johnson",
    sharedAt: "2026-06-10",
    expiresAt: "2026-07-10",
    permission: "view",
    type: "shared_with_me",
    hasPassword: false,
  },
  {
    id: "s2",
    documentName: "Financial Summary.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 512000,
    sharedBy: "Mike Davis",
    sharedAt: "2026-06-08",
    expiresAt: null,
    permission: "download",
    type: "shared_with_me",
    hasPassword: true,
  },
  {
    id: "s3",
    documentName: "Employee Handbook.pdf",
    mimeType: "application/pdf",
    size: 2048000,
    sharedBy: "Admin User",
    sharedAt: "2026-06-12",
    expiresAt: "2026-06-30",
    permission: "view",
    type: "shared_by_me",
    recipients: ["john@company.com", "emily@company.com"],
    hasPassword: false,
  },
  {
    id: "s4",
    documentName: "Contract Draft.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 102400,
    sharedBy: "Admin User",
    sharedAt: "2026-06-11",
    expiresAt: null,
    permission: "edit",
    type: "shared_by_me",
    recipients: ["legal@company.com"],
    hasPassword: true,
  },
]

const permissionStyles: Record<string, string> = {
  view: "bg-blue-100 text-blue-700",
  download: "bg-purple-100 text-purple-700",
  edit: "bg-orange-100 text-orange-700",
}

const tabs = [
  { key: "shared_with_me", label: "Shared With Me" },
  { key: "shared_by_me", label: "Shared By Me" },
]

export default function SharedPage() {
  const [activeTab, setActiveTab] = useState("shared_with_me")
  const [search, setSearch] = useState("")
  const [shared, setShared] = useState<SharedDocument[]>(mockShared)

  const filtered = shared.filter((s) => {
    const matchesTab = s.type === activeTab
    const matchesSearch = s.documentName.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleRevoke = (id: string) => {
    setShared((prev) => prev.filter((s) => s.id !== id))
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Shared Documents</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage documents shared with you and by you.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Share2 size={15} />
          Share Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Shared With Me",
            count: shared.filter((s) => s.type === "shared_with_me").length,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            label: "Shared By Me",
            count: shared.filter((s) => s.type === "shared_by_me").length,
            icon: Share2,
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border border-gray-200 shadow-sm">
            <CardContent className="flex items-center gap-3 py-4">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.count}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg transition-colors",
                activeTab === tab.key
                  ? "bg-slate-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Search shared documents..."
          className="max-w-xs text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No shared documents found
          </div>
        )}

        {filtered.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "border shadow-sm",
              isExpired(item.expiresAt) ? "border-red-200 bg-red-50/30" : "border-gray-200"
            )}
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">

                {/* Left: file info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{getFileIcon(item.mimeType)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.documentName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatFileSize(item.size)} ·{" "}
                      {item.type === "shared_with_me"
                        ? `Shared by ${item.sharedBy}`
                        : `Shared by you`}
                      {" · "}{new Date(item.sharedAt).toLocaleDateString()}
                    </p>

                    {/* Recipients (shared by me) */}
                    {item.recipients && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users size={11} className="text-gray-400" />
                        <p className="text-xs text-gray-400 truncate">
                          {item.recipients.join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Expiry */}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={11} className={isExpired(item.expiresAt) ? "text-red-400" : "text-gray-400"} />
                      <p className={cn(
                        "text-xs",
                        isExpired(item.expiresAt) ? "text-red-500 font-medium" : "text-gray-400"
                      )}>
                        {item.expiresAt
                          ? isExpired(item.expiresAt)
                            ? "Expired"
                            : `Expires ${new Date(item.expiresAt).toLocaleDateString()}`
                          : "No expiry"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: badges + actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {item.hasPassword && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        🔒 Password
                      </span>
                    )}
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                      permissionStyles[item.permission]
                    )}>
                      {item.permission}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                      <Eye size={12} />
                      Preview
                    </Button>

                    {item.type === "shared_with_me" &&
                      item.permission === "download" && (
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                          <Download size={12} />
                          Download
                        </Button>
                      )}

                    {item.type === "shared_by_me" && (
                      <>
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                          <Link size={12} />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs h-7 text-red-500 hover:text-red-600 hover:border-red-300"
                          onClick={() => handleRevoke(item.id)}
                        >
                          <X size={12} />
                          Revoke
                        </Button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}