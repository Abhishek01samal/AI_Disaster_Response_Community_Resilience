"use client";

import React, { useState } from "react";
import { Check, Copy, Menu, X } from "lucide-react";
import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  badgeColors,
  DEGIT_CMD,
  features,
  flows,
  GITHUB_URL,
  stack,
  steps,
} from "@/lib/constants";
import CodeSnippet from "@/components/CodeSnippet";
import { FaGithub } from "react-icons/fa";
import Divider from "@/components/Divider";
import Footer from "@/components/Footer";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Auth-Simplified
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#flows"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Auth Flows
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <AnimatedThemeToggler className="p-2 rounded-full hover:bg-muted/40" />
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
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border bg-muted/30 p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        <div
          className={`md:hidden border-t border-border bg-background/95 px-6 py-4 transition-all duration-150 ${
            mobileNavOpen ? "block" : "hidden"
          }`}
        >
          <div className="flex flex-col gap-3">
            <a
              href="#features"
              onClick={() => setMobileNavOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#flows"
              onClick={() => setMobileNavOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Auth Flows
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileNavOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open source · MIT License
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-5">
            Authentication boilerplate
            <br className="hidden sm:block" />
            <span className="text-muted-foreground"> for modern apps.</span>
          </h1>

          <p className="mx-auto max-w-xl text-base text-muted-foreground leading-relaxed mb-8">
            Full-stack auth boilerplate with JWT, Redis sessions, Google &
            GitHub OAuth, password reset, email verification, and role-based
            access. Clone and ship.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center px-5 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-85 transition-opacity"
            >
              Use Template
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 px-5 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <FaGithub />
              View on GitHub
            </a>
          </div>

          {/* ── degit command ── */}
          <div className="mx-auto max-w-lg mb-14">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-muted/40 font-mono text-sm">
              <span className="text-muted-foreground select-none">$</span>
              <span className="flex-1 text-left text-foreground truncate">
                {DEGIT_CMD}
              </span>
              <CopyButton text={DEGIT_CMD} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              No git history. Just the code.
            </p>
          </div>

          {/* Stack badges */}
          <div className="flex flex-wrap justify-center gap-2">
            {stack.map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-border text-muted-foreground bg-muted/40"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <Divider />

        {/* ── Features ── */}
        <section id="features" className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              What&apos;s included
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
            {features.map(({ icon, title, description, badge }) => (
              <div key={title} className="flex gap-4">
                <div className="mt-0.5 shrink-0 size-8 rounded-md border border-border flex items-center justify-center text-muted-foreground bg-muted/30">
                  {React.createElement(icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {title}
                    </h3>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${badgeColors[badge]}`}
                    >
                      {badge}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <Divider />

        {/* ── Auth Flows ── */}
        <section id="flows" className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Auth flows
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              Every path a user can take.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {flows.map(({ title, steps }) => (
              <div
                key={title}
                className="rounded-lg border border-border bg-muted/20 p-5"
              >
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {title}
                </h3>
                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 size-5 rounded-full border border-border bg-background flex items-center justify-center text-[10px] font-semibold text-muted-foreground tabular-nums mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <Divider />

        {/* ── How it works ── */}
        <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              How it works
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              Up and running in 3 steps.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num}>
                <span className="text-3xl font-black text-muted-foreground/25 tabular-nums">
                  {num}
                </span>
                <h3 className="text-sm font-semibold text-foreground mt-3 mb-1">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* Code snippet */}
          <CodeSnippet />
        </section>

        {/* ── Divider ── */}
        <Divider />

        {/* ── CTA ── */}
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Stop building auth from scratch.
          </h2>
          <p className="text-sm text-muted-foreground mb-7 max-w-md mx-auto">
            Build features, not login systems.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center px-6 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-85 transition-opacity"
            >
              Start Using Auth-Simplified
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center px-6 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Read the Docs
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60">
        <Footer />
      </footer>
    </div>
  );
}
