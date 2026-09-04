import axios from "axios";

const apiInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
  withCredentials: true,
});

// Endpoints that are part of the public/unauthenticated auth flow.
// A 401 from any of these means "invalid credentials" (or an equivalent
// business error), NOT "access token expired" — so they must never
// trigger the refresh-token retry flow below.
const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh-token",
];

apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isPublicAuthEndpoint = PUBLIC_AUTH_ENDPOINTS.some((endpoint) =>
      originalRequest?.url?.includes(endpoint)
    );

    // Not a 401, or it's a 401 from a public auth endpoint (e.g. wrong
    // password on login) — let it bubble up as-is so the caller's
    // catch block can show a toast instead of triggering a refresh.
    if (error?.response?.status !== 401 || isPublicAuthEndpoint) {
      return Promise.reject(error);
    }

    // A session invalidated by logging in from another device is a
    // terminal error — surface it immediately instead of attempting
    // a refresh (which would fail anyway and mask the real reason).
    if (
      error?.response?.data?.message ===
      "Session expired. You logged in from another device."
    ) {
      return Promise.reject(error);
    }

    // Already retried once for this request — don't loop.
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      await apiInstance.post("/auth/refresh-token");
      return apiInstance(originalRequest);
    } catch (refreshError) {
      // Intentional hard reload, not a soft client-side navigation: the
      // refresh token is dead, so this forces a full reset of in-memory
      // app/auth state rather than leaving stale state hanging around.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/sign-in";
      return Promise.reject(refreshError);
    }
  }
);

export default apiInstance;
