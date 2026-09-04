"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const PUBLIC_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

export default function AuthBootstrap() {
  const { user, getUser, isInitialized } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    if (!isInitialized && !isPublicRoute) {
      getUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, pathname]);

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    if (user && isPublicRoute) {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

  return null;
}
