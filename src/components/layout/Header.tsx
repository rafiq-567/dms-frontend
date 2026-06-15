"use client"

import { useAuthStore } from "@/store"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const { user } = useAuthStore()

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">
          Welcome back, {user?.name}
        </h1>
        <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}