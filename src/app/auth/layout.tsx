import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ResQ — Authentication",
  description: "Sign in or register to access the ResQ Disaster Response Operating Layer.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
