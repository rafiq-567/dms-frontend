export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "user" | "reviewer" | "auditor"
  createdAt: string
  status: "active" | "inactive" | "locked"
  lastLogin: string | null
  documentsCount: number
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}