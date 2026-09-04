import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if we're on a public route
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Get auth token from cookies
  const token = request.cookies.get("resq-auth-token")?.value;

  // If on protected route and NOT authenticated → redirect to login.
  // This direction is always safe to decide here: no cookie at all
  // definitively means "not logged in", no false positive possible.
  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // NOTE: we deliberately do NOT redirect an already-"authenticated"
  // visitor away from the public auth pages here, even if a token
  // cookie is present — middleware can only cheaply check that the
  // cookie *exists*, not that it's still valid. A stale/expired cookie
  // combined with that redirect would bounce the user from /auth/login
  // straight back to / and back again in a loop, with no way to
  // actually sign back in. The authoritative "is this session still
  // valid" check (which calls the backend) lives in app/page.tsx and
  // app/auth/login/page.tsx instead, where it's safe to redirect based
  // on a real answer.

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files, images, and API routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
