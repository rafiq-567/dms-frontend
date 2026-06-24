"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore, useCryptoStore } from "@/store"
import { deriveKeysFromPassword } from "@/lib/crypto"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginForm = z.infer<typeof loginSchema>

// In production, the salt is fetched from the server per user.
// Here each mock user has a fixed salt so the same password always
// derives the same masterKey — simulating real behavior.
const MOCK_USERS = [
  {
    email: "admin@dms.com",
    password: "123456",
    role: "admin" as const,
    name: "Admin User",
    salt: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
  },
  {
    email: "manager@dms.com",
    password: "123456",
    role: "manager" as const,
    name: "Sarah Johnson",
    salt: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
  },
  {
    email: "user@dms.com",
    password: "123456",
    role: "user" as const,
    name: "Mike Davis",
    salt: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const { setMasterKey } = useCryptoStore()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [phase, setPhase]               = useState<"idle" | "verifying" | "deriving">("idle")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)

    try {
      // ── Phase 1: Verify credentials ──
      // In production: const { salt } = await api.post("/auth/preflight", { email })
      // The preflight endpoint returns the user's salt without revealing
      // whether the account exists (prevents user enumeration attacks).
      setPhase("verifying")
      await new Promise((r) => setTimeout(r, 600)) // simulate network

      const found = MOCK_USERS.find(
        (u) => u.email === data.email && u.password === data.password
      )

      if (!found) {
        setError("Invalid email or password.")
        setIsLoading(false)
        setPhase("idle")
        return
      }

      // ── Phase 2: Derive masterKey from password + salt ──
      // This runs PBKDF2 with 200,000 iterations — takes ~300ms on purpose.
      // The masterKey never leaves this function.
      // Only the authHash would be sent to the server in production.
      setPhase("deriving")
      const { masterKey, authHash } = deriveKeysFromPassword(data.password, found.salt)

      // In production, send authHash to server for verification:
      // await api.post("/auth/login", { email: data.email, authHash })
      // The server hashes authHash again with argon2 and compares to DB.
      // Here we just log it to show it's being generated correctly.
      console.log("[ZK] authHash derived:", authHash.slice(0, 16) + "...")

      // ── Phase 3: Store masterKey in RAM only ──
      // useCryptoStore has NO persist middleware — this lives in RAM only.
      // Closing the tab destroys it permanently.
      setMasterKey(masterKey)

      // ── Phase 4: Save user session to cookie ──
      // accessToken goes to cookie (via authStore persist).
      // masterKey does NOT — it stays in RAM only.
      setAuth(
        {
          id: "1",
          name: found.name,
          email: found.email,
          role: found.role,
          createdAt: new Date().toISOString(),
          status: "active",
          lastLogin: new Date().toISOString(),
          documentsCount: 0,
        },
        "mock-token"
      )

      router.push("/dashboard")

    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
      setPhase("idle")
    }
  }

  // Dynamic button label based on which phase is running
  const buttonLabel = () => {
    if (phase === "verifying") return "Verifying..."
    if (phase === "deriving")  return "Deriving encryption key..."
    return "Sign In"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-2">
            <div className="bg-slate-900 text-white rounded-xl p-3">
              <Lock size={28} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">DMS Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@dms.com"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>

            {/* Zero-knowledge notice */}
            {phase === "deriving" && (
              <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-4 py-3">
                🔐 Deriving your encryption key locally. Your password never leaves this device.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {buttonLabel()}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}