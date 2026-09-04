"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await registerAction({ name, email, password });
      if (!result.success) {
        setError(result.error ?? "Registration failed.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/auth/login"), 2500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background dot-grid flex items-center justify-center px-4 py-12">
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
            <h1 className="display-tight text-xl">Register access</h1>
            <span className="label-mono ml-auto">New operator</span>
          </div>

          {success ? (
            <div className="border border-border-strong bg-foreground px-4 py-6 text-center font-mono text-xs text-background">
              <p className="text-lg font-bold tracking-[0.1em] mb-2">ACCESS GRANTED</p>
              <p className="opacity-80">Registration successful. Redirecting to sign in…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 border border-border-strong bg-foreground px-4 py-3 font-mono text-xs text-background">
                  ✕ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label-mono block mb-2" htmlFor="reg-name">
                    Full name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Field Operator Name"
                    className="w-full border border-border-strong bg-background px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="label-mono block mb-2" htmlFor="reg-email">
                    Email address
                  </label>
                  <input
                    id="reg-email"
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
                  <label className="label-mono block mb-2" htmlFor="reg-password">
                    Password
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full border border-border-strong bg-background px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="label-mono block mb-2" htmlFor="reg-confirm">
                    Confirm password
                  </label>
                  <input
                    id="reg-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-border-strong bg-background px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full border border-border-strong bg-foreground px-4 py-3 font-mono text-[11px] tracking-[0.2em] uppercase text-background transition-colors hover:bg-foreground/85 disabled:opacity-50 mt-2"
                >
                  {loading ? <span className="loader-dots">Creating account</span> : "Register operator"}
                </button>
              </form>

              <p className="mt-6 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">
                Already registered?{" "}
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
