"use client"

import { useState, useMemo } from "react"
import {
  Upload, Download, Share2, Trash2, Eye,
  LogIn, LogOut, Settings, Key, FileText,
  Filter, Search
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AuditLog {
  id: string
  user: string
  action: AuditAction
  resource: string
  ipAddress: string
  timestamp: string
  status: "success" | "failed"
  details?: string
}

type AuditAction =
  | "FILE_UPLOAD"
  | "FILE_DOWNLOAD"
  | "FILE_PREVIEW"
  | "FILE_DELETE"
  | "FILE_SHARE"
  | "FILE_RESTORE"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "PERMISSION_CHANGE"
  | "SETTINGS_UPDATE"
  | "KEY_GENERATED"

const actionConfig: Record<AuditAction, { label: string; icon: any; color: string; bg: string }> = {
  FILE_UPLOAD: { label: "File Upload", icon: Upload, color: "text-blue-600", bg: "bg-blue-50" },
  FILE_DOWNLOAD: { label: "File Download", icon: Download, color: "text-purple-600", bg: "bg-purple-50" },
  FILE_PREVIEW: { label: "File Preview", icon: Eye, color: "text-gray-600", bg: "bg-gray-50" },
  FILE_DELETE: { label: "File Delete", icon: Trash2, color: "text-red-600", bg: "bg-red-50" },
  FILE_SHARE: { label: "File Share", icon: Share2, color: "text-green-600", bg: "bg-green-50" },
  FILE_RESTORE: { label: "Version Restore", icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
  USER_LOGIN: { label: "User Login", icon: LogIn, color: "text-green-600", bg: "bg-green-50" },
  USER_LOGOUT: { label: "User Logout", icon: LogOut, color: "text-gray-600", bg: "bg-gray-50" },
  PERMISSION_CHANGE: { label: "Permission Change", icon: Key, color: "text-yellow-600", bg: "bg-yellow-50" },
  SETTINGS_UPDATE: { label: "Settings Update", icon: Settings, color: "text-indigo-600", bg: "bg-indigo-50" },
  KEY_GENERATED: { label: "Key Generated", icon: Key, color: "text-teal-600", bg: "bg-teal-50" },
}

const mockLogs: AuditLog[] = [
  { id: "l1", user: "Admin User", action: "USER_LOGIN", resource: "System", ipAddress: "192.168.1.10", timestamp: "2026-06-15T09:00:00Z", status: "success" },
  { id: "l2", user: "Admin User", action: "FILE_UPLOAD", resource: "Contract Draft.docx", ipAddress: "192.168.1.10", timestamp: "2026-06-15T09:05:00Z", status: "success", details: "v3 uploaded, AES-GCM encrypted" },
  { id: "l3", user: "Sarah Johnson", action: "USER_LOGIN", resource: "System", ipAddress: "192.168.1.22", timestamp: "2026-06-15T09:10:00Z", status: "success" },
  { id: "l4", user: "Sarah Johnson", action: "FILE_PREVIEW", resource: "Employee Handbook.pdf", ipAddress: "192.168.1.22", timestamp: "2026-06-15T09:12:00Z", status: "success" },
  { id: "l5", user: "Mike Davis", action: "USER_LOGIN", resource: "System", ipAddress: "10.0.0.5", timestamp: "2026-06-15T09:15:00Z", status: "failed", details: "Invalid password — attempt 1/5" },
  { id: "l6", user: "Admin User", action: "FILE_SHARE", resource: "Q1 Report.xlsx", ipAddress: "192.168.1.10", timestamp: "2026-06-15T09:20:00Z", status: "success", details: "Shared with emily@company.com (view)" },
  { id: "l7", user: "Emily Clark", action: "FILE_DOWNLOAD", resource: "Q1 Report.xlsx", ipAddress: "192.168.1.33", timestamp: "2026-06-15T09:30:00Z", status: "success" },
  { id: "l8", user: "Admin User", action: "PERMISSION_CHANGE", resource: "Mike Davis", ipAddress: "192.168.1.10", timestamp: "2026-06-15T09:45:00Z", status: "success", details: "Role changed: user → reviewer" },
  { id: "l9", user: "Sarah Johnson", action: "FILE_DELETE", resource: "Old Report.pdf", ipAddress: "192.168.1.22", timestamp: "2026-06-15T10:00:00Z", status: "success", details: "Moved to recycle bin" },
  { id: "l10", user: "Admin User", action: "FILE_RESTORE", resource: "Contract Draft.docx", ipAddress: "192.168.1.10", timestamp: "2026-06-15T10:15:00Z", status: "success", details: "Restored to v1" },
  { id: "l11", user: "Mike Davis", action: "USER_LOGIN", resource: "System", ipAddress: "10.0.0.5", timestamp: "2026-06-15T10:20:00Z", status: "success" },
  { id: "l12", user: "Admin User", action: "KEY_GENERATED", resource: "System", ipAddress: "192.168.1.10", timestamp: "2026-06-15T10:30:00Z", status: "success", details: "RSA-4096 key pair generated" },
  { id: "l13", user: "Admin User", action: "SETTINGS_UPDATE", resource: "System", ipAddress: "192.168.1.10", timestamp: "2026-06-15T10:45:00Z", status: "success", details: "Max file size updated to 1GB" },
  { id: "l14", user: "Emily Clark", action: "USER_LOGOUT", resource: "System", ipAddress: "192.168.1.33", timestamp: "2026-06-15T11:00:00Z", status: "success" },
]

const actionFilters = ["all", ...Object.keys(actionConfig)] as const
const statusFilters = ["all", "success", "failed"]

export default function AuditPage() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.resource.toLowerCase().includes(search.toLowerCase()) ||
        log.ipAddress.includes(search)
      const matchesAction = actionFilter === "all" || log.action === actionFilter
      const matchesStatus = statusFilter === "all" || log.status === statusFilter
      return matchesSearch && matchesAction && matchesStatus
    })
  }, [search, actionFilter, statusFilter])

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Audit Logs</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download size={15} />
          Export
        </Button>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <Input
            placeholder="Search user, file, IP..."
            className="pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={15} />
          Filters
          {(actionFilter !== "all" || statusFilter !== "all") && (
            <span className="w-2 h-2 rounded-full bg-slate-900" />
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="py-3 space-y-3">

            {/* Status filter */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Status</p>
              <div className="flex gap-1.5">
                {statusFilters.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "text-xs px-3 py-1 rounded-lg capitalize transition-colors",
                      statusFilter === s
                        ? "bg-slate-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Action filter */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Action</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActionFilter("all")}
                  className={cn(
                    "text-xs px-3 py-1 rounded-lg transition-colors",
                    actionFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  All
                </button>
                {Object.entries(actionConfig).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setActionFilter(key)}
                    className={cn(
                      "text-xs px-3 py-1 rounded-lg transition-colors",
                      actionFilter === key
                        ? "bg-slate-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>
      )}

      {/* Log list */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
          <div className="col-span-3">User</div>
          <div className="col-span-3">Action</div>
          <div className="col-span-3">Resource</div>
          <div className="col-span-2">IP Address</div>
          <div className="col-span-1">Status</div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No logs found
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {filtered.map((log) => {
            const config = actionConfig[log.action]
            const Icon = config.icon

            return (
              <div
                key={log.id}
                className="grid grid-cols-12 px-4 py-3 items-start hover:bg-gray-50 transition-colors"
              >
                {/* User */}
                <div className="col-span-3">
                  <p className="text-sm font-medium text-gray-800">{log.user}</p>
                  <p className="text-xs text-gray-400">{formatDate(log.timestamp)}</p>
                </div>

                {/* Action */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1 rounded-md shrink-0", config.bg)}>
                      <Icon size={12} className={config.color} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {config.label}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-gray-400 mt-0.5 ml-6 truncate">
                      {log.details}
                    </p>
                  )}
                </div>

                {/* Resource */}
                <div className="col-span-3">
                  <p className="text-sm text-gray-600 truncate">{log.resource}</p>
                </div>

                {/* IP */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 font-mono">{log.ipAddress}</p>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                    log.status === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}>
                    {log.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}