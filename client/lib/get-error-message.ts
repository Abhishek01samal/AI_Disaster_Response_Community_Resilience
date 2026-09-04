import axios from "axios";

// Small typed helper so call sites don't need `catch (error: any)` just
// to read the backend's error message off an Axios error.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}
