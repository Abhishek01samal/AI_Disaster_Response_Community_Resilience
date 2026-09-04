"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginAction({ email, password });
      if (!result.success) {
        setError(result.error ?? "Login failed.");
      } else {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background dot-grid flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/auth/login" className="inline-flex flex-col items-center gap-3">
            <span className="grid size-8 place-items-center border border-border-strong">
              <span className="size-3 bg-foreground" />
            </span>
            <span className="display-tight text-[11vw] leading-[0.82] sm:text-[4rem]">
              R<span className="text-[0.62em]">es</span>Q
            </span>
          </Link>
          <p className="label-mono mt-4">Disaster Response Operating Layer</p>
        </div>

        {/* Card */}
        <div className="border border-border-strong bg-surface p-8">
          {/* Section label */}
          <div className="mb-6 flex items-baseline gap-3 border-b border-border pb-3">
            <span className="label-mono">01</span>
            <h1 className="display-tight text-xl">Sign in</h1>
            <span className="label-mono ml-auto">Authentication required</span>
          </div>

          {error && (
            <div className="mb-5 border border-border-strong bg-foreground px-4 py-3 font-mono text-xs text-background">
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-mono block mb-2" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@resq.app"
                className="w-full border border-border-strong bg-background px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="label-mono" htmlFor="login-password">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="label-mono !text-foreground underline underline-offset-2 hover:no-underline"
                >
                  Forgot?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-border-strong bg-background px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-foreground placeholder:text-muted-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-border-strong bg-foreground px-4 py-3 font-mono text-[11px] tracking-[0.2em] uppercase text-background transition-colors hover:bg-foreground/85 disabled:opacity-50 mt-2"
            >
              {loading ? <span className="loader-dots">Authenticating</span> : "Enter console"}
            </button>
          </form>

          <p className="mt-6 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">
            No account?{" "}
            <Link
              href="/auth/register"
              className="text-foreground underline underline-offset-2 hover:no-underline"
            >
              Register access
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center font-mono text-[10px] text-muted-foreground leading-relaxed">
          ResQ · Decision support · Not a replacement for emergency authorities
        </p>
      </div>
    </div>
  );
}
