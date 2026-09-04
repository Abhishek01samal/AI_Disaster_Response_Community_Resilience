"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Reveal } from "./motion";
import { ChatWidget } from "./chat";
import { logoutAction, type AuthUser } from "@/lib/auth";
import { useSituation } from "@/lib/situation-context";

const NAV = [
  { to: "#console", label: "Console" },
  { to: "#map", label: "Incident Map" },
  { to: "#relief", label: "Relief" },
  { to: "#situation", label: "Situation" },
] as const;

function Clock() {
  const [t, setT] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () =>
      setT(
        new Date().toLocaleTimeString("en-GB", {
          hour12: false,
          timeZone: "UTC",
        }),
      );
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return <span className="font-mono text-xs tabular-nums">{t} UTC</span>;
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <a
      href={to}
      className="label-mono px-2 py-1 text-foreground/60 transition-colors hover:text-foreground"
    >
      {label}
    </a>
  );
}

function UserMenu({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="hidden border border-border-strong px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors hover:bg-foreground hover:text-background sm:inline-flex"
      >
        Sign in
      </Link>
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutAction();
    } finally {
      router.push("/auth/login");
      router.refresh();
    }
  }

  return (
    <div className="hidden items-center gap-3 border-l border-border pl-4 sm:flex">
      <span className="label-mono !text-foreground truncate max-w-[160px]" title={user.email}>
        {user.name}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="border border-border-strong px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
      >
        {loggingOut ? "…" : "Sign out"}
      </button>
    </div>
  );
}

export function Header({ user }: { user?: AuthUser | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-strong bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center gap-6 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-5 place-items-center border border-border-strong">
            <span className="size-2 bg-foreground" />
          </span>
          <span className="font-display text-sm font-extrabold tracking-[-0.03em] uppercase">
            R<span className="text-[0.72em]">es</span>Q
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} label={n.label} />
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => toast.message("Live channel", { description: "Alert feed and map cache are connected. Ambulance remains a simulator." })}
            className="hidden items-center gap-2 sm:flex"
          >
            <span className="relative grid size-2 place-items-center">
              <span className="pulse-ring absolute size-2 rounded-full bg-foreground/40" />
              <span className="size-1.5 rounded-full bg-foreground" />
            </span>
            <span className="label-mono !text-foreground">Live</span>
          </button>
          <Clock />
          <UserMenu user={user ?? null} />
        </div>
      </div>
    </header>
  );
}

export function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-border bg-foreground text-background">
      <div className="ticker-track flex w-max gap-10 py-1.5">
        {row.map((t, i) => (
          <span key={i} className="font-mono text-[10px] tracking-[0.18em] whitespace-nowrap uppercase">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border-strong bg-foreground text-background">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-60">
            Decision support · not a replacement for emergency authorities
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed opacity-80">
            ResQ connects warning, local risk intelligence, verified information, emergency
            response and community relief into one continuously updated operational surface.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-60">Surfaces</p>
          <ul className="mt-4 space-y-1 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <a href={n.to} className="opacity-80 transition-opacity hover:opacity-100">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-60">Status</p>
          <ul className="mt-4 space-y-1 font-mono text-xs opacity-80">
            <li>MAP TILES — OK</li>
            <li>ALERT FEED — OK</li>
            <li>AMBULANCE — SIMULATOR</li>
            <li>AGENTS — READY</li>
          </ul>
        </div>
      </div>
      <div className="overflow-hidden border-t border-background/20">
        <p className="display-tight px-4 pt-6 text-[18vw] leading-[0.78] md:px-8">
          R<span className="text-[0.62em]">es</span>Q
        </p>
      </div>
    </footer>
  );
}

export function Page({ children, user }: { children: ReactNode; user?: AuthUser | null }) {
  const { snapshot } = useSituation();
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <Ticker items={snapshot.ticker} />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

export function Section({
  id,
  index,
  title,
  note,
  children,
}: {
  id?: string;
  index: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-border scroll-mt-12">
      <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-8">
        <div className="mb-6 flex flex-wrap items-baseline gap-4 border-b border-border pb-3">
          <span className="label-mono">{index}</span>
          <h2 className="display-tight text-2xl md:text-3xl">{title}</h2>
          {note ? <span className="label-mono ml-auto">{note}</span> : null}
        </div>
        <Reveal>{children}</Reveal>
      </div>
    </section>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-border-strong px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase">
      {children}
    </span>
  );
}
