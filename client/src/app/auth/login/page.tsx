import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/lib/auth";
import LoginForm from "./login-form";

// Authoritative check for "is this visitor actually already logged in".
// Middleware deliberately does NOT redirect away from this page based
// on cookie presence alone (see middleware.ts) — a stale/expired
// cookie needs a real backend round-trip to tell apart from a valid
// session, and that only happens here.
export default async function LoginPage() {
  const user = await getCurrentUserAction();
  if (user) {
    redirect("/");
  }
  return <LoginForm />;
}
