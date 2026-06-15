"use client"

import {
  FileText,
  Upload,
  Users,
  HardDrive,
  TrendingUp,
  Clock,
  CheckSquare,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store"

const stats = [
  {
    title: "Total Documents",
    value: "0",
    icon: FileText,
    description: "Documents in repository",
  },
  {
    title: "Uploaded This Month",
    value: "0",
    icon: Upload,
    description: "New uploads this month",
  },
  {
    title: "Shared With Me",
    value: "0",
    icon: Users,
    description: "Documents shared with you",
  },
  {
    title: "Storage Used",
    value: "0 MB",
    icon: HardDrive,
    description: "Of allocated storage",
  },
]

const recentActivity = [
  {
    icon: Upload,
    label: "No recent uploads",
    time: "",
    color: "text-blue-500",
  },
  {
    icon: CheckSquare,
    label: "No pending approvals",
    time: "",
    color: "text-green-500",
  },
  {
    icon: AlertCircle,
    label: "No notifications",
    time: "",
    color: "text-yellow-500",
  },
]

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {user?.name}. Here is your document overview.
        </p>
      </div>

      {/* Stats grid — FR-32 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <div className="bg-slate-100 p-2 rounded-lg">
                  <Icon size={16} className="text-slate-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Activity — FR-26 */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              <CardTitle className="text-sm font-semibold text-gray-700">
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Icon size={14} className={item.color} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{item.label}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Workflow Status — FR-21/22/23 */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-gray-500" />
              <CardTitle className="text-sm font-semibold text-gray-700">
                Workflow Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Pending Review", value: 0, color: "bg-yellow-400" },
              { label: "Approved", value: 0, color: "bg-green-400" },
              { label: "Rejected", value: 0, color: "bg-red-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}