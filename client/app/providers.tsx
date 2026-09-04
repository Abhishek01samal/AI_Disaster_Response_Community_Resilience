"use client";

import { Toaster } from "react-hot-toast";
import AuthContextProvider from "@/context/AuthContext";
import ThemeProvider from "@/context/ThemeContext";
import AuthBootstrap from "./auth-bootstrap";

// main.tsx's <BrowserRouter> is gone (Next.js's App Router replaces it
// entirely), but the context providers + Toaster still need to wrap the
// whole client tree the same way they did in the Vite entrypoint.
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthContextProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <AuthBootstrap />
        {children}
      </AuthContextProvider>
    </ThemeProvider>
  );
}
