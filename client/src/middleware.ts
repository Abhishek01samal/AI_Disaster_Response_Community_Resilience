import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/auth/login", "/auth/register", "/auth/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if we're on a public route
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Get auth token from cookies
  const token = request.cookies.get("resq-auth-token")?.value;

  // If on public route and authenticated → redirect to console
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If on protected route and NOT authenticated → redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files, images, and API routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
