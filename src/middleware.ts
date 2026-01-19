/**
 * Next.js Middleware
 * Protects routes by checking for authentication token in cookies
 * Runs on the server before page rendering - no flash of unauthenticated content
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/console", "/upload"];

// Routes that should redirect to console if already authenticated
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get("access_token")?.value;

  // Check if current path matches protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Check if current path is an auth route (login/register)
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // 1. If accessing protected route without token -> redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    // Save the intended destination for redirect after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If accessing auth routes (login/register) with token -> redirect to console
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/console", request.url));
  }

  // 3. Allow all other requests to proceed
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match only specific routes, not everything
     */
    "/console/:path*",
    "/upload/:path*",
    "/login",
    "/register",
  ],
};
