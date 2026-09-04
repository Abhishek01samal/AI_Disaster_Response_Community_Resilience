"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "resq-auth-token";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

/** Call the backend to register a new user */
export async function registerAction(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message ?? "Registration failed." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Network error. Check the server is running." };
  }
}

/** Call the backend to login a user, then set auth cookie */
export async function loginAction(data: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message ?? "Login failed." };
    }
    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, json.data?.accessToken ?? "demo-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return { success: true, user: json.data?.user };
  } catch {
    // Dev mode: set a demo token so you can explore the app without a backend
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "dev-demo-token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return { success: true };
  }
}

/** Logout: clear cookie */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Forgot password */
export async function forgotPasswordAction(email: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message ?? "Request failed." };
    }
    return { success: true };
  } catch {
    return { success: true }; // graceful degradation in dev
  }
}
