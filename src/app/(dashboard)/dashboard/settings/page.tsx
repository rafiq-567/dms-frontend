"use client"

import { useAuthStore } from "@/store"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState({
    emailOnUpload: true,
    emailOnShare: true,
    emailOnApproval: true,
    emailOnComment: false,
  })
  const [storage] = useState({
    used: 1.2,
    total: 10,
    documents: 14,
    encrypted: 14,
  })

  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "security", label: "Security" },
    { key: "notifications", label: "Notifications" },
    { key: "storage", label: "Storage" },
  ]


  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      <p className="text-sm text-gray-500 mt-1">Configure system and account settings.</p>
      <div className="flex gap-6">

        {/* Left side — tab buttons */}
        <div className="w-44 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key
                ? "w-full text-left px-3 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white"
                : "w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right side — content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  defaultValue={user?.name}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  defaultValue={user?.role}
                  disabled
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 capitalize"
                />
                <p className="text-xs text-gray-400">Role can only be changed by admin.</p>
              </div>
              <button className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700">
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* security content */}
        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Current Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPassword"
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPassword" className="text-sm text-gray-600">
                Show passwords
              </label>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700">
              Update Password
            </button>
          </div>
        )}

        {/* notifications */}

      </div>
      {activeTab === "notifications" && (
        <div className="space-y-4">

          {[
            { key: "emailOnUpload", label: "Email on file upload" },
            { key: "emailOnShare", label: "Email on file share" },
            { key: "emailOnApproval", label: "Email on approval request" },
            { key: "emailOnComment", label: "Email on comment" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100">
              <label className="text-sm text-gray-700">{item.label}</label>
              <input
                type="checkbox"
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={() =>
                  setNotifications((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key as keyof typeof notifications],
                  }))
                }
              />
            </div>
          ))}

          <button className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700">
            Save Preferences
          </button>

        </div>
      )}

      {/* storage */}
 {activeTab === "storage" && (
  <div className="space-y-4">

    <p className="text-sm text-gray-600">1.2 GB of 10 GB used</p>

    {/* Progress bar */}
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className="bg-slate-900 h-2 rounded-full"
        style={{ width: "12%" }}
      />
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-3 mt-2">
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-2xl font-bold text-gray-800">14</p>
        <p className="text-xs text-gray-500 mt-1">Total Documents</p>
      </div>
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-2xl font-bold text-gray-800">14</p>
        <p className="text-xs text-gray-500 mt-1">Encrypted Files</p>
      </div>
    </div>

  </div>
)}
    </div>


  )
}