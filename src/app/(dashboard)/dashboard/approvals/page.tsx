"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Clock, Eye, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getFileIcon } from "@/lib/mockData"

interface ApprovalItem {
  id: string
  documentName: string
  mimeType: string
  submittedBy: string
  submittedAt: string
  dueDate: string
  status: "pending" | "approved" | "rejected"
  priority: "low" | "medium" | "high"
  comment?: string
}

const mockApprovals: ApprovalItem[] = [
  {
    id: "a1",
    documentName: "Contract Draft v2.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    submittedBy: "John Smith",
    submittedAt: "2026-06-13",
    dueDate: "2026-06-17",
    status: "pending",
    priority: "high",
  },
  {
    id: "a2",
    documentName: "Q2 Budget Report.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    submittedBy: "Sarah Johnson",
    submittedAt: "2026-06-12",
    dueDate: "2026-06-18",
    status: "pending",
    priority: "medium",
  },
  {
    id: "a3",
    documentName: "HR Policy Update.pdf",
    mimeType: "application/pdf",
    submittedBy: "Mike Davis",
    submittedAt: "2026-06-10",
    dueDate: "2026-06-15",
    status: "approved",
    priority: "low",
    comment: "Looks good. Approved.",
  },
  {
    id: "a4",
    documentName: "Vendor Agreement.pdf",
    mimeType: "application/pdf",
    submittedBy: "Emily Clark",
    submittedAt: "2026-06-09",
    dueDate: "2026-06-14",
    status: "rejected",
    priority: "high",
    comment: "Needs legal review before approval.",
  },
]

const priorityStyles: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

const tabs = ["all", "pending", "approved", "rejected"]

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [approvals, setApprovals] = useState<ApprovalItem[]>(mockApprovals)
  const [commentInput, setCommentInput] = useState<Record<string, string>>({})
  const [showComment, setShowComment] = useState<string | null>(null)

  const filtered = approvals.filter((a) =>
    activeTab === "all" ? true : a.status === activeTab
  )

  const pendingCount = approvals.filter((a) => a.status === "pending").length

  const handleDecision = (id: string, decision: "approved" | "rejected") => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: decision, comment: commentInput[id] || a.comment }
          : a
      )
    )
    setShowComment(null)
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Approvals</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {pendingCount} document{pendingCount !== 1 ? "s" : ""} awaiting your review
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", count: approvals.filter((a) => a.status === "pending").length, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50" },
          { label: "Approved", count: approvals.filter((a) => a.status === "approved").length, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
          { label: "Rejected", count: approvals.filter((a) => a.status === "rejected").length, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
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

      {/* Tabs */}
      <div className="flex gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg capitalize transition-colors",
              activeTab === tab
                ? "bg-slate-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No documents found
          </div>
        )}

        {filtered.map((item) => (
          <Card key={item.id} className="border border-gray-200 shadow-sm">
            <CardContent className="py-4 space-y-3">

              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{getFileIcon(item.mimeType)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.documentName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submitted by {item.submittedBy} · {new Date(item.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                    priorityStyles[item.priority]
                  )}>
                    {item.priority}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                    statusStyles[item.status]
                  )}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Due date */}
              <p className="text-xs text-gray-400">
                Due: {new Date(item.dueDate).toLocaleDateString()}
              </p>

              {/* Existing comment */}
              {item.comment && (
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                  <span className="font-medium">Comment: </span>{item.comment}
                </div>
              )}

              {/* Comment input */}
              {showComment === item.id && item.status === "pending" && (
                <textarea
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-slate-300"
                  rows={2}
                  placeholder="Add a comment (optional)..."
                  value={commentInput[item.id] || ""}
                  onChange={(e) =>
                    setCommentInput((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                />
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                  <Eye size={13} />
                  Preview
                </Button>

                {item.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8"
                      onClick={() =>
                        setShowComment(showComment === item.id ? null : item.id)
                      }
                    >
                      <MessageSquare size={13} />
                      Comment
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs h-8 bg-green-600 hover:bg-green-700"
                      onClick={() => handleDecision(item.id, "approved")}
                    >
                      <CheckCircle size={13} />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs h-8 bg-red-500 hover:bg-red-600"
                      onClick={() => handleDecision(item.id, "rejected")}
                    >
                      <XCircle size={13} />
                      Reject
                    </Button>
                  </>
                )}
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}