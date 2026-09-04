"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "./ui/spinner";

const Protected = ({ children }: { children: React.ReactNode }) => {
  const { user, isInitialized } = useAuth();
  const router = useRouter();

  // react-router's <Navigate replace> was a declarative redirect during
  // render. Next.js client components redirect imperatively instead —
  // this fires once initialization has resolved and there's no user.
  useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/sign-in");
    }
  }, [isInitialized, user, router]);

  // Don't render until initialization is complete, and keep showing the
  // spinner while the redirect above is in flight so protected content
  // never flashes for an unauthenticated visitor.
  if (!isInitialized || !user) {
    return <Spinner />;
  }

  // User is authenticated, render the protected route's content
  return <>{children}</>;
};

export default Protected;
