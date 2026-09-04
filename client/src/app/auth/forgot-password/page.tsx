"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPasswordAction } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await forgotPasswordAction(email);
      if (!result.success) {
        setError(result.error ?? "Request failed.");
      } else {
        setSent(true);
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
          <div className="mb-6 flex items-baseline gap-3 border-b border-border pb-3">
            <span className="label-mono">01</span>
            <h1 className="display-tight text-xl">Reset password</h1>
            <span className="label-mono ml-auto">Account recovery</span>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="mb-4 grid size-12 mx-auto place-items-center border border-border-strong bg-foreground text-background font-mono text-lg">
                ✓
              </div>
              <p className="font-mono text-sm leading-relaxed">
                If an account with that address exists, a reset link has been sent.
              </p>
              <p className="mt-4 font-mono text-[10px] text-muted-foreground">
                Check your inbox including spam folders.
              </p>
              <Link
                href="/auth/login"
                className="mt-6 block border border-border-strong px-4 py-3 font-mono text-[11px] tracking-[0.2em] uppercase text-center transition-colors hover:bg-muted"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                Enter your registered email address. We&apos;ll send a secure reset link.
              </p>

              {error && (
                <div className="mb-5 border border-border-strong bg-foreground px-4 py-3 font-mono text-xs text-background">
                  ✕ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label-mono block mb-2" htmlFor="fp-email">
                    Email address
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@resq.app"
                    className="w-full border border-border-strong bg-background px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full border border-border-strong bg-foreground px-4 py-3 font-mono text-[11px] tracking-[0.2em] uppercase text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
                >
                  {loading ? <span className="loader-dots">Sending link</span> : "Send reset link"}
                </button>
              </form>

              <p className="mt-6 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">
                Remembered?{" "}
                <Link
                  href="/auth/login"
                  className="text-foreground underline underline-offset-2 hover:no-underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center font-mono text-[10px] text-muted-foreground leading-relaxed">
          ResQ · Decision support · Not a replacement for emergency authorities
        </p>
      </div>
    </div>
  );
}
