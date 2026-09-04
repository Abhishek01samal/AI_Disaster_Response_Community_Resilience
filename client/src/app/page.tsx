import { getCurrentUserAction } from "@/lib/auth";
import ConsoleClient from "./console-client";

// Show the operating console after login. If the session is missing
// (backend down, expired cookie), still render the console so the
// main surface is visible locally.
export default async function Page() {
  const user = await getCurrentUserAction();
  return <ConsoleClient user={user} />;
}
