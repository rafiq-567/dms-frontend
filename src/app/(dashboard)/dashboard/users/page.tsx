"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { mockUsers } from "@/lib/mockData"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store"
import { User } from "@/types"
import { Filter, Key, Mail, MoreVertical, Search, Shield, UserCheck, UserPlus, UserX } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [users, setUsers] = useState<User[]>(mockUsers)
  const { user } = useAuthStore()
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null)
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveMenu(null) }
    const handleScroll = () => setActiveMenu(null)

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKey)
    window.addEventListener("scroll", handleScroll, true)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKey)
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [])

  const openMenu = (userId: string) => {
    if (activeMenu === userId) {
      setActiveMenu(null)
      return
    }
    const btn = buttonRefs.current[userId]
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const menuHeight = 230 // approximate height of the user menu
      const spaceBelow = window.innerHeight - rect.bottom

      const top = spaceBelow < menuHeight
        ? rect.top + window.scrollY - menuHeight - 4  // flip above
        : rect.bottom + window.scrollY + 4             // show below

      setMenuPos({
        top,
        left: rect.right + window.scrollX - 192, // 192 = w-48
      })
    }
    setActiveMenu(userId)
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    const matchesStatus = statusFilter === "all" || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const roleConfig = {
    admin:    { label: "Admin",    color: "text-red-700",    bg: "bg-red-100"    },
    manager:  { label: "Manager",  color: "text-purple-700", bg: "bg-purple-100" },
    user:     { label: "User",     color: "text-blue-700",   bg: "bg-blue-100"   },
    reviewer: { label: "Reviewer", color: "text-orange-700", bg: "bg-orange-100" },
    auditor:  { label: "Auditor",  color: "text-teal-700",   bg: "bg-teal-100"   },
  }

  const statusConfig = {
    active:   { label: "Active",   color: "text-green-700", bg: "bg-green-100", dot: "bg-green-500" },
    inactive: { label: "Inactive", color: "text-gray-600",  bg: "bg-gray-100",  dot: "bg-gray-400"  },
    locked:   { label: "Locked",   color: "text-red-700",   bg: "bg-red-100",   dot: "bg-red-500"   },
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "Never"
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
    })
  }

  const handleStatusChange = (id: string, status: "active" | "inactive" | "locked") => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
    setActiveMenu(null)
  }

  const handleRoleChange = (id: string, role: User["role"]) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    setActiveMenu(null)
  }

  const roles    = ["all", "admin", "manager", "user", "reviewer", "auditor"]
  const statuses = ["all", "active", "inactive", "locked"]

  const activeUser = activeMenu ? users.find((u) => u.id === activeMenu) : null

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} total users · {users.filter((u) => u.status === "active").length} active
          </p>
        </div>
        {user?.role === "admin" && (
          <Button size="sm" className="gap-1.5" onClick={() => router.push("/dashboard/register")}>
            <UserPlus size={15} />
            Register User
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active",   count: users.filter((u) => u.status === "active").length,   icon: UserCheck, color: "text-green-500", bg: "bg-green-50" },
          { label: "Inactive", count: users.filter((u) => u.status === "inactive").length, icon: UserX,     color: "text-gray-500",  bg: "bg-gray-50"  },
          { label: "Locked",   count: users.filter((u) => u.status === "locked").length,   icon: Shield,    color: "text-red-500",   bg: "bg-red-50"   },
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

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <Input
            placeholder="Search by name or email..."
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
          {(roleFilter !== "all" || statusFilter !== "all") && (
            <span className="w-2 h-2 rounded-full bg-slate-900" />
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="py-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Role</p>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={cn(
                      "text-xs px-3 py-1 rounded-lg capitalize transition-colors",
                      roleFilter === r ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Status</p>
              <div className="flex gap-1.5">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "text-xs px-3 py-1 rounded-lg capitalize transition-colors",
                      statusFilter === s ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User table */}
      <Card className="border border-gray-200 shadow-sm">
        <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Last Login</div>
          <div className="col-span-1">Docs</div>
          <div className="col-span-1"></div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">No users found</div>
        )}

        <div className="divide-y divide-gray-50">
          {filtered.map((u) => {
            const role   = roleConfig[u.role]
            const status = statusConfig[u.status ?? "inactive"]

            return (
              <div
                key={u.id}
                className="grid grid-cols-12 px-4 py-3 items-center hover:bg-gray-50 transition-colors group"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {getInitials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                    <div className="flex items-center gap-1">
                      <Mail size={10} className="text-gray-400" />
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", role.bg, role.color)}>
                    {role.label}
                  </span>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                    <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500">{formatDate(u.lastLogin)}</p>
                </div>

                <div className="col-span-1">
                  <p className="text-sm text-gray-600">{u.documentsCount}</p>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">
                  <Button
                    ref={(el) => { buttonRefs.current[u.id] = el }}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      openMenu(u.id)
                    }}
                  >
                    <MoreVertical size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Portal dropdown */}
      {activeMenu && activeUser && createPortal(
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] w-48 py-1"
          style={{ top: menuPos.top, left: menuPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Change Role */}
          <div className="px-3 py-1.5 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-1">Change Role</p>
            <div className="flex flex-wrap gap-1">
              {(["admin", "manager", "user", "reviewer", "auditor"] as User["role"][]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(activeUser.id, r)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded capitalize transition-colors",
                    activeUser.role === r
                      ? "bg-slate-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          {[
            { icon: UserCheck, label: "Set Active",     action: () => handleStatusChange(activeUser.id, "active")   },
            { icon: UserX,     label: "Deactivate",     action: () => handleStatusChange(activeUser.id, "inactive") },
            { icon: Shield,    label: "Lock Account",   action: () => handleStatusChange(activeUser.id, "locked")   },
            { icon: Key,       label: "Reset Password", action: () => setActiveMenu(null)                           },
            { icon: Mail,      label: "Send Email",     action: () => setActiveMenu(null)                           },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <item.icon size={13} />
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}

    </div>
  )
}