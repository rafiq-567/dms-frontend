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

interface Comment {
  id: string
  author: string
  text: string
  createdAt: string
  replies: Comment[]
}

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


  const [showShareModal, setShowShareModal] = useState(false)
  const [shareTab, setShareTab] = useState<"internal" | "external">("internal")

  // Internal sharing
  const [shareEmail, setShareEmail] = useState("")
  const [sharePermission, setSharePermission] = useState<"view" | "edit" | "download">("view")
  const [shareRecipients, setShareRecipients] = useState<string[]>([])

  // External sharing
  const [expiryDate, setExpiryDate] = useState("")
  const [linkPassword, setLinkPassword] = useState("")
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  const [commentDoc, setCommentDoc] = useState<SharedDocument | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commentText, setCommentText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

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


  const handleAddRecipient = () => {
    if (!shareEmail.trim() || shareRecipients.includes(shareEmail.trim())) return
    setShareRecipients((prev) => [...prev, shareEmail.trim()])
    setShareEmail("")
  }

  const handleRemoveRecipient = (email: string) => {
    setShareRecipients((prev) => prev.filter((r) => r !== email))
  }

  const handleInternalShare = () => {
    if (shareRecipients.length === 0) return
    const newShared: SharedDocument = {
      id: `s${shared.length + 1}`,
      documentName: "Selected Document",
      mimeType: "application/pdf",
      size: 102400,
      sharedBy: "Admin User",
      sharedAt: new Date().toISOString(),
      expiresAt: null,
      permission: sharePermission,
      type: "shared_by_me",
      recipients: shareRecipients,
      hasPassword: false,
    }
    setShared((prev) => [...prev, newShared])
    setShowShareModal(false)
    setShareRecipients([])
  }

  const handleGenerateLink = () => {
    const link = `https://dms.company.com/share/${Math.random().toString(36).slice(2, 10)}`
    setGeneratedLink(link)
  }

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    alert("Link copied!")
  }


  const handleAddComment = () => {
    if (!commentText.trim() || !commentDoc) return
    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: "Admin User",
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
    }
    setComments((prev) => ({
      ...prev,
      [commentDoc.id]: [...(prev[commentDoc.id] || []), newComment],
    }))
    setCommentText("")
  }

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim() || !commentDoc) return
    const reply: Comment = {
      id: `r${Date.now()}`,
      author: "Admin User",
      text: replyText.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
    }
    setComments((prev) => ({
      ...prev,
      [commentDoc.id]: (prev[commentDoc.id] || []).map((c) =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, reply] }
          : c
      ),
    }))
    setReplyText("")
    setReplyingTo(null)
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
        <Button size="sm" className="gap-1.5" onClick={() => setShowShareModal(true)}>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => setCommentDoc(item)}
                        >
                          💬 Comments
                          {comments[item.id]?.length > 0 && (
                            <span className="bg-slate-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                              {comments[item.id].length}
                            </span>
                          )}
                        </Button>
                      )}

                    {item.type === "shared_by_me" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => handleCopyLink(`https://dms.company.com/share/${item.id}`)}
                        >
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

      {/* Share Document Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Share Document</h3>
              <button
                onClick={() => {
                  setShowShareModal(false)
                  setGeneratedLink(null)
                  setShareRecipients([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Internal / External tabs */}
            <div className="flex gap-1.5">
              {(["internal", "external"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setShareTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors",
                    shareTab === tab
                      ? "bg-slate-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {tab} Sharing
                </button>
              ))}
            </div>

            {/* Internal Sharing — FR-18 */}
            {shareTab === "internal" && (
              <div className="space-y-3">

                {/* Permission */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Permission</label>
                  <div className="flex gap-2">
                    {(["view", "edit", "download"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setSharePermission(p)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                          sharePermission === p
                            ? "bg-slate-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add recipients */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Add Recipients</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="user@company.com"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddRecipient()}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                    <button
                      onClick={handleAddRecipient}
                      className="px-3 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Recipients list */}
                {shareRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {shareRecipients.map((email) => (
                      <span
                        key={email}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full"
                      >
                        {email}
                        <button
                          onClick={() => handleRemoveRecipient(email)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {shareRecipients.length === 0 && (
                  <p className="text-xs text-gray-400">No recipients added yet.</p>
                )}

                {/* Share button */}
                <button
                  onClick={handleInternalShare}
                  disabled={shareRecipients.length === 0}
                  className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share with {shareRecipients.length} recipient{shareRecipients.length !== 1 ? "s" : ""}
                </button>

              </div>
            )}

            {/* External Sharing — FR-19 */}
            {shareTab === "external" && (
              <div className="space-y-3">

                {/* Expiry date */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Password Protection <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>

                {/* Generate link */}
                <button
                  onClick={handleGenerateLink}
                  className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm hover:bg-slate-700"
                >
                  Generate Secure Link
                </button>

                {/* Generated link */}
                {generatedLink && (
                  <div className="space-y-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 break-all">{generatedLink}</p>
                    </div>
                    <button
                      onClick={() => handleCopyLink(generatedLink)}
                      className="w-full border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Copy Link
                    </button>
                    {expiryDate && (
                      <p className="text-xs text-gray-400 text-center">
                        Expires: {new Date(expiryDate).toLocaleDateString()}
                      </p>
                    )}
                    {linkPassword && (
                      <p className="text-xs text-gray-400 text-center">
                        🔒 Password protected
                      </p>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}


      {/* Comment Modal — FR-20 */}
      {commentDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[80vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Comments</h3>
                <p className="text-xs text-gray-400 truncate">{commentDoc.documentName}</p>
              </div>
              <button
                onClick={() => {
                  setCommentDoc(null)
                  setReplyingTo(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(comments[commentDoc.id] || []).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No comments yet. Be the first to comment.
                </div>
              )}

              {(comments[commentDoc.id] || []).map((comment) => (
                <div key={comment.id} className="space-y-2">

                  {/* Comment */}
                  <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-800">{comment.author}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-xs text-slate-500 hover:text-slate-700 mt-1"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Replies */}
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="ml-4 bg-blue-50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-800">{reply.author}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700">{reply.text}</p>
                    </div>
                  ))}

                  {/* Reply input */}
                  {replyingTo === comment.id && (
                    <div className="ml-4 flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddReply(comment.id)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-700"
                      >
                        Reply
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="flex gap-2 shrink-0 pt-2 border-t border-gray-100">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
              <button
                onClick={handleAddComment}
                className="px-3 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700"
              >
                Post
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}