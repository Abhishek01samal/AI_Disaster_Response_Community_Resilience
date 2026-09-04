"use server";

import {
  authFetch,
  clearAuthCookies,
  setAuthCookies,
} from "./api-client";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000/api/v1";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
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
    return {
      success: false,
      error: "Network error. Check the server is running.",
    };
  }
}

/** Call the backend to login a user, then store both tokens as httpOnly cookies */
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
    const { accessToken, refreshToken, user } = json.data ?? {};
    if (!accessToken || !refreshToken) {
      return { success: false, error: "Malformed response from server." };
    }
    await setAuthCookies(accessToken, refreshToken);
    return { success: true, user };
  } catch {
    // A real network/server error — surface it rather than silently
    // granting access with a fake token.
    return {
      success: false,
      error: "Network error. Check the server is running.",
    };
  }
}

/** Forgot password — sends a one-time code to the given email if it exists */
export async function forgotPasswordAction(
  email: string
): Promise<AuthResult> {
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
    return {
      success: false,
      error: "Network error. Check the server is running.",
    };
  }
}

/** Reset password using the one-time code emailed by forgotPasswordAction */
export async function resetPasswordAction(data: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message ?? "Reset failed." };
    }
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Network error. Check the server is running.",
    };
  }
}

/** Logout: invalidate the session server-side, then clear local cookies */
export async function logoutAction(): Promise<void> {
  try {
    await authFetch("/auth/logout", { method: "POST" });
  } finally {
    // Always clear local cookies, even if the backend call failed (e.g.
    // the access token was already expired and the refresh also failed)
    // — the user should never be stuck "logged in" locally in that case.
    await clearAuthCookies();
  }
}

/** Fetch the current session's user profile, or null if not authenticated */
export async function getCurrentUserAction(): Promise<AuthUser | null> {
  const result = await authFetch<AuthUser>("/users/profile");
  if (!result.ok || !result.json.data) return null;
  return result.json.data;
}

/** Re-send the email verification link for the current session's user */
export async function verifyEmailAction(): Promise<AuthResult> {
  const result = await authFetch("/users/verify-email", { method: "POST" });
  if (!result.ok) {
    return { success: false, error: result.json.message ?? "Failed to send verification email." };
  }
  return { success: true };
}
