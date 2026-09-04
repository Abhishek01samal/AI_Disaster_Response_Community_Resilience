import { cookies } from "next/headers";

// Next.js runs these Server Actions on its own server, not in the
// browser — so the Express backend's Set-Cookie response headers never
// reach the user's actual browser. Instead we pull the tokens out of
// the JSON body Express already returns, and hold them ourselves in
// Next's own httpOnly cookies, forwarding them as `Authorization: Bearer`
// on every subsequent backend call. Express's authMiddleware already
// accepts a Bearer header as a fallback to its own cookies, so nothing
// on the backend needs to change for this to work.

const ACCESS_COOKIE = "resq-auth-token";
const REFRESH_COOKIE = "resq-refresh-token";
const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000/api/v1";

// Mirrors the backend's own token lifetimes (15m access / 7d refresh)
// so a stale cookie doesn't linger in the browser past its real expiry.
const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
) {
  const cookieStore = await cookies();
  const shared = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  cookieStore.set(ACCESS_COOKIE, accessToken, {
    ...shared,
    maxAge: ACCESS_MAX_AGE,
  });
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    ...shared,
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}

type FetchJsonResult<T> =
  | { ok: true; status: number; json: { message: string; data?: T } }
  | { ok: false; status: number; json: { message: string } };

async function rawFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<FetchJsonResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });
    const json = await res
      .json()
      .catch(() => ({ message: "Unexpected response from server" }));
    return { ok: res.ok, status: res.status, json } as FetchJsonResult<T>;
  } catch {
    // Network error (backend unreachable, DNS failure, etc.) — treat it
    // like any other failed request rather than throwing and crashing
    // whatever Server Component/Action called us. status 0 marks it as
    // "not a real HTTP response" for callers that care to distinguish it.
    return {
      ok: false,
      status: 0,
      json: { message: "Network error. Check the server is running." },
    };
  }
}

/**
 * Attempts to mint a fresh access token using the stored refresh token.
 * On success, updates both cookies (the backend rotates neither token on
 * refresh, but we re-set the access cookie's expiry either way) and
 * returns the new access token. On failure, clears both cookies.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const result = await rawFetch<{ accessToken: string }>(
    "/auth/refresh-token",
    { method: "POST" },
    refreshToken
  );

  if (!result.ok || !result.json.data?.accessToken) {
    await clearAuthCookies();
    return null;
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, result.json.data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });

  return result.json.data.accessToken;
}

/**
 * Authenticated fetch to the backend. Attaches the stored access token,
 * and — mirroring the axios interceptor pattern from the CSR version —
 * on a 401 it transparently refreshes and retries once before giving up.
 */
export async function authFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<FetchJsonResult<T>> {
  const accessToken = await getAccessToken();
  const first = await rawFetch<T>(path, options, accessToken);

  if (first.status !== 401) return first;

  const newAccessToken = await refreshAccessToken();
  if (!newAccessToken) return first;

  return rawFetch<T>(path, options, newAccessToken);
}
