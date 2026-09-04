import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/lib/auth";
import ConsoleClient from "./console-client";

// Server Component: fetches the real session user (forwarding the
// stored access token to the backend, refreshing it transparently if
// expired). This is the authoritative auth check for this route —
// middleware only fast-paths the "definitely not logged in" case (no
// cookie at all); a present-but-stale/expired cookie only gets caught
// here, where we can safely redirect based on a real answer.
export default async function Page() {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/auth/login");
  }
  return <ConsoleClient user={user} />;
}
