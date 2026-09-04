"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, AlertTriangle, MapPin, Siren } from "lucide-react";
import { useSituation } from "@/lib/situation-context";
import type { ChatCard, QuickOption } from "@/lib/chat/types";
import { DISCLAIMER } from "@/lib/chat/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  intent?: string;
  options?: QuickOption[];
  card?: ChatCard;
  showDisclaimer?: boolean;
};

function CardView({ card }: { card: ChatCard }) {
  if (card.kind === "shelter_list") {
    return (
      <div className="mt-2 space-y-1 border border-border bg-background/60 p-2">
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-muted-foreground">
          Ranked safe locations
        </p>
        {card.shelters.map((s) => (
          <div key={s.name} className="flex items-start gap-2 text-[11px] leading-snug">
            <MapPin className="mt-0.5 size-3 shrink-0 opacity-60" />
            <span>
              <span className="font-medium">{s.name}</span>
              <span className="text-muted-foreground">
                {" "}
                · score {s.score} · {s.dist} · {s.cap}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (card.kind === "sos_draft") {
    const d = card.draft;
    return (
      <div className="mt-2 border border-border-strong bg-background p-2 font-mono text-[10px] leading-relaxed">
        <p className="mb-1 flex items-center gap-1 tracking-[0.16em] uppercase">
          <Siren className="size-3" /> SOS draft · not sent
        </p>
        <p>Type: {d.emergencyLabel}</p>
        <p>
          People: {d.peopleAffected}
          {d.medicalHelpRequired ? " · medical" : ""}
          {d.trapped ? " · trapped" : ""}
        </p>
        <p>
          Location:{" "}
          {d.locationConsent ? "live (shared)" : d.locationText ?? "manual"}
        </p>
      </div>
    );
  }
  if (card.kind === "sos_status") {
    return (
      <div className="mt-2 border border-border-strong bg-foreground px-2 py-2 font-mono text-[10px] text-background">
        <p className="tracking-[0.16em] uppercase opacity-70">SOS status</p>
        <p className="text-xs font-bold">{card.sosId}</p>
        <p>
          {card.status} · {card.priority}
          {card.position != null ? ` · queue #${card.position}` : ""}
        </p>
      </div>
    );
  }
  return null;
}

export function ChatWidget() {
  const {
    runPrompt,
    thinking: agentTrace,
    lastIntent,
    session,
    disclaimer,
    live,
  } = useSituation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [activeOptions, setActiveOptions] = useState<QuickOption[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    setMessages([
      {
        id: "intro",
        role: "assistant",
        text: "I load the operating layer. Name a place (for example Nepal) and I replace dummy panels on Console, Incident Map, Relief, and Situation. I will not print those numbers here.",
        showDisclaimer: true,
      },
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking, agentTrace]);

  const send = async (q: string) => {
    const text = q.trim();
    if (!text || thinking) return;
    setInput("");
    setActiveOptions([]);
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);
    setThinking(true);
    const result = await runPrompt(text);
    const opts = result.options ?? [];
    setActiveOptions(opts);
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: result.reply,
        intent: result.intent,
        options: opts,
        card: result.card,
        showDisclaimer: result.showDisclaimer,
      },
    ]);
    setThinking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await send(input);
  };

  const flowLabel =
    session.flow === "SOS"
      ? `SOS · ${session.sosState}`
      : session.flow === "REPORT"
        ? "Report draft"
        : lastIntent
          ? lastIntent
          : live
            ? "LIVE"
            : "Ready";

  return (
    <div className="fixed right-4 bottom-4 z-[120] flex flex-col items-end gap-3 md:right-6 md:bottom-6">
      {open && (
        <div className="flex h-[min(72vh,560px)] w-[min(94vw,420px)] flex-col border border-border-strong bg-background shadow-[8px_8px_0_0_var(--color-foreground)]">
          <div className="flex items-center gap-3 border-b border-border-strong bg-foreground px-4 py-3 text-background">
            <span className="grid size-6 place-items-center border border-background/60">
              <span className="size-2 bg-background" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                R<span className="text-[0.75em]">es</span>Q · Chatbot
              </p>
              <p className="truncate font-mono text-[9px] tracking-[0.14em] uppercase opacity-60">
                {flowLabel} · updates the console
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="ml-auto grid size-7 shrink-0 place-items-center border border-background/40 transition-colors hover:bg-background hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-foreground text-background font-mono"
                      : "border border-border bg-surface text-foreground"
                  }`}
                >
                  {m.intent && m.role === "assistant" && (
                    <p className="mb-1.5 font-mono text-[9px] tracking-[0.16em] uppercase text-muted-foreground">
                      {m.intent}
                    </p>
                  )}
                  {m.text}
                  {m.card && <CardView card={m.card} />}
                  {m.showDisclaimer && (
                    <p className="mt-2 flex gap-1.5 border-t border-border pt-2 font-mono text-[9px] leading-snug text-muted-foreground">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      {disclaimer || DISCLAIMER}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="space-y-1 border border-border bg-surface px-3 py-2">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  Agents running<span className="loader-dots" />
                </p>
                {agentTrace.map((s, i) => (
                  <p key={i} className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {s.agent} — {s.text}
                  </p>
                ))}
              </div>
            )}
          </div>

          {activeOptions.length > 0 && !thinking && (
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
              {activeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => void send(opt.value)}
                  className="border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-[10px] tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-border-strong p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  session.flow === "SOS"
                    ? "Answer the SOS question…"
                    : "Name a place — I load the app, not this chat…"
                }
                disabled={thinking}
                className="flex-1 border border-border-strong bg-background px-3 py-2 font-mono text-xs outline-none focus:border-foreground disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={thinking || !input.trim()}
                className="border border-border-strong bg-foreground px-3 py-2 font-mono text-[10px] tracking-[0.16em] uppercase text-background transition-colors hover:bg-foreground/85 disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close ResQ chatbot" : "Open ResQ chatbot"}
        className="grid size-12 place-items-center border border-border-strong bg-foreground text-background transition-transform hover:scale-105"
      >
        {open ? <X className="size-5" /> : <MessageSquare className="size-5" />}
      </button>
    </div>
  );
}
