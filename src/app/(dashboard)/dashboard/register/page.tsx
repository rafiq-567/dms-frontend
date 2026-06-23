"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, UserPlus, Mail, User, Briefcase, Shield, Lock, CheckCircle2 } from "lucide-react"
import { useAuthStore, useCryptoStore } from "@/store"
import { deriveKeysFromPassword } from "@/lib/crypto"
import { mockUsers } from "@/lib/mockData"
import { User as UserType } from "@/types"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// VALIDATION SCHEMA
// ─────────────────────────────────────────────

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    employeeId: z.string().optional(),
    role: z.enum(["admin", "manager", "user", "reviewer", "auditor"]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterForm = z.infer<typeof registerSchema>

// ─────────────────────────────────────────────
// ROLE CONFIG
// ─────────────────────────────────────────────

const roleConfig = {
  admin:    { label: "Admin",    color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"    },
  manager:  { label: "Manager",  color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  user:     { label: "User",     color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"   },
  reviewer: { label: "Reviewer", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  auditor:  { label: "Auditor",  color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-200"   },
}

// ─────────────────────────────────────────────
// PASSWORD STRENGTH METER
// ─────────────────────────────────────────────

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8)           score++
  if (password.length >= 12)          score++
  if (/[A-Z]/.test(password))         score++
  if (/[0-9]/.test(password))         score++
  if (/[^A-Za-z0-9]/.test(password))  score++

  if (score <= 1) return { score, label: "Very weak",  color: "bg-red-500"    }
  if (score === 2) return { score, label: "Weak",       color: "bg-orange-500" }
  if (score === 3) return { score, label: "Fair",       color: "bg-yellow-500" }
  if (score === 4) return { score, label: "Strong",     color: "bg-blue-500"   }
  return              { score,     label: "Very strong", color: "bg-green-500" }
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const { user: adminUser } = useAuthStore()
  const { masterKey } = useCryptoStore()

  const [showPassword, setShowPassword]         = useState(false)
  const [showConfirm, setShowConfirm]           = useState(false)
  const [isLoading, setIsLoading]               = useState(false)
  const [error, setError]                       = useState<string | null>(null)
  const [success, setSuccess]                   = useState<string | null>(null)
  const [passwordValue, setPasswordValue]       = useState("")
  const [selectedRole, setSelectedRole]         = useState<RegisterForm["role"]>("user")

  // ── Guard: only admins can access this page ──
  if (adminUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Shield size={40} className="mb-3 text-red-400" />
        <p className="text-lg font-semibold text-gray-700">Access Denied</p>
        <p className="text-sm mt-1">Only administrators can register new users.</p>
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "user" },
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // ── FR-01: Prevent duplicate accounts ──
      const emailExists = mockUsers.some(
        (u) => u.email.toLowerCase() === data.email.toLowerCase()
      )
      if (emailExists) {
        setError("An account with this email already exists.")
        setIsLoading(false)
        return
      }

      // Duplicate employee ID check
      if (data.employeeId) {
        const empIdExists = mockUsers.some(
          (u) => u.employeeId === data.employeeId
        )
        if (empIdExists) {
          setError("An account with this Employee ID already exists.")
          setIsLoading(false)
          return
        }
      }

      // ── Zero-knowledge: derive keys from password ──
      // The raw password never leaves this function.
      // Only authHash is stored — server never sees the real password.
      const { authHash, salt } = deriveKeysFromPassword(data.password)

      // ── Build the new user object ──
      const newUser: UserType = {
        id: `u${mockUsers.length + 1}`,
        name: data.name,
        email: data.email,
        employeeId: data.employeeId || undefined,
        role: data.role,
        status: "active",
        lastLogin: null,
        createdAt: new Date().toISOString(),
        documentsCount: 0,
      }

      // In production this would be:
      // await api.post("/auth/register", {
      //   ...newUser,
      //   authHash,   ← hashed password substitute
      //   salt,       ← needed to re-derive keys on login
      // })
      //
      // For now: simulate API delay + push to mock array
      await new Promise((resolve) => setTimeout(resolve, 1000))
      mockUsers.push(newUser)

      // ── FR-01: Mock activation notification ──
      setSuccess(
        `Account created for ${data.name}. An activation email has been sent to ${data.email}.`
      )

      reset()
      setPasswordValue("")
      setSelectedRole("user")

      // Redirect to dashboard after short delay so admin sees the success message
      setTimeout(() => router.push("/dashboard"), 2000)

    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const strength = passwordValue ? getPasswordStrength(passwordValue) : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Register New User</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Create a new account. The user will receive an activation email.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Row 1: Name + Email ── */}
          <div className="grid grid-cols-2 gap-4">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  {...register("name")}
                  placeholder="John Doe"
                  className={cn(
                    "w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-colors",
                    "focus:border-slate-400 focus:ring-1 focus:ring-slate-200",
                    errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                  )}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="john@company.com"
                  className={cn(
                    "w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-colors",
                    "focus:border-slate-400 focus:ring-1 focus:ring-slate-200",
                    errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                  )}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
          </div>

          {/* ── Row 2: Employee ID ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Employee ID <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative max-w-xs">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                {...register("employeeId")}
                placeholder="EMP-001"
                className={cn(
                  "w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-colors",
                  "focus:border-slate-400 focus:ring-1 focus:ring-slate-200",
                  errors.employeeId ? "border-red-300 bg-red-50" : "border-gray-200"
                )}
              />
            </div>
            {errors.employeeId && <p className="text-red-500 text-xs">{errors.employeeId.message}</p>}
          </div>

          {/* ── Row 3: Role selector ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(roleConfig) as RegisterForm["role"][]).map((role) => {
                const config = roleConfig[role]
                const isSelected = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role)
                      setValue("role", role)
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize",
                      isSelected
                        ? cn(config.bg, config.color, config.border)
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
            {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-gray-100 pt-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Security</p>
          </div>

          {/* ── Row 4: Password ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                onChange={(e) => setPasswordValue(e.target.value)}
                className={cn(
                  "w-full border rounded-lg pl-9 pr-9 py-2 text-sm outline-none transition-colors",
                  "focus:border-slate-400 focus:ring-1 focus:ring-slate-200",
                  errors.password ? "border-red-300 bg-red-50" : "border-gray-200"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Password strength meter */}
            {passwordValue && strength && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i <= strength.score ? strength.color : "bg-gray-200"
                      )}
                    />
                  ))}
                </div>
                <p className={cn("text-xs", strength.score >= 4 ? "text-green-600" : "text-gray-500")}>
                  {strength.label}
                </p>
              </div>
            )}

            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>

          {/* ── Row 5: Confirm Password ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                {...register("confirmPassword")}
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className={cn(
                  "w-full border rounded-lg pl-9 pr-9 py-2 text-sm outline-none transition-colors",
                  "focus:border-slate-400 focus:ring-1 focus:ring-slate-200",
                  errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* ── Zero-knowledge notice ── */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex gap-2.5">
            <Shield size={15} className="text-slate-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600">
              Password is never sent to the server. A cryptographic key is derived locally
              and only an authentication hash is stored — even administrators cannot recover passwords.
            </p>
          </div>

          {/* ── Error / Success messages ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          {/* ── Submit + Cancel ── */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!success}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors",
                isLoading || success
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-700"
              )}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={15} />
                  Account created
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  Create Account
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}