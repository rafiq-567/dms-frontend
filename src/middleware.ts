import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // auth-storage থেকে login check করবে
  const authStorage = request.cookies.get("auth-storage")
  const isAuthenticated = authStorage
    ? JSON.parse(decodeURIComponent(authStorage.value))?.state?.isAuthenticated
    : false

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")

  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}