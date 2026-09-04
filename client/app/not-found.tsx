"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Navbar (mirrors Home page) ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            AuthSystem
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-8 items-center px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-85 transition-opacity"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── 404 Content ── */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
            HTTP 404 · Page Not Found
          </div>

          {/* Large 404 Number */}
          <div className="relative select-none">
            <span
              className="block text-[10rem] leading-none font-black tabular-nums text-foreground/[0.06] pointer-events-none"
              aria-hidden="true"
            >
              404
            </span>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              {/* Icon */}
              <div className="size-12 rounded-xl border border-border bg-muted/40 flex items-center justify-center text-muted-foreground">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <path d="M11 8v3M11 14h.01" />
                </svg>
              </div>
            </div>
          </div>

          {/* Heading + description */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Page not found
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              The route{" "}
              <code className="px-1.5 py-0.5 rounded-md bg-muted border border-border text-xs font-mono text-foreground/80">
                {pathname}
              </code>{" "}
              doesn&apos;t exist or may have been moved.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Error details block */}
          <div className="rounded-lg border border-border bg-muted/40 overflow-hidden text-left">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-muted/60">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-yellow-400/70" />
              <span className="size-2.5 rounded-full bg-green-400/70" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                error.log
              </span>
            </div>
            <pre className="px-5 py-4 text-xs font-mono leading-relaxed overflow-x-auto">
              <code>
                <span className="text-muted-foreground">Status </span>
                <span className="text-foreground">404 Not Found{"\n"}</span>
                <span className="text-muted-foreground">Path </span>
                <span className="text-foreground">
                  {pathname}
                  {"\n"}
                </span>
                <span className="text-muted-foreground">Message </span>
                <span className="text-foreground">
                  The requested resource could not be located{"\n"}
                </span>
                <span className="text-muted-foreground">Hint </span>
                <span className="text-foreground">
                  Check the URL or navigate back to safety
                </span>
              </code>
            </pre>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 px-5 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-85 transition-opacity"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 px-5 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer (mirrors Home page) ── */}
      <footer className="border-t border-border/60">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AuthSystem. Built for developers.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy Policy", "Terms", "GitHub"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
