"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { useSituation } from "@/lib/situation-context";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export function ChatWidget() {
  const { runPrompt, thinking: agentTrace, lastIntent } = useSituation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Ask for current data, or state a new fact (e.g. “Nadipur river is 8.9 m”). I classify the prompt first: questions do not change the console. Change/SOS prompts run Master → Risk → Route → Resource → Response → Evaluation.",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking, agentTrace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: q }]);
    setThinking(true);
    const result = await runPrompt(q);
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `[${result.intent}] ${result.reply}`,
      },
    ]);
    setThinking(false);
  };

  return (
    <div className="fixed right-4 bottom-4 z-[120] flex flex-col items-end gap-3 md:right-6 md:bottom-6">
      {open && (
        <div className="flex h-[520px] w-[min(92vw,400px)] flex-col border border-border-strong bg-background shadow-[8px_8px_0_0_var(--color-foreground)]">
          <div className="flex items-center gap-3 border-b border-border-strong bg-foreground px-4 py-3 text-background">
            <span className="grid size-6 place-items-center border border-background/60">
              <span className="size-2 bg-background" />
            </span>
            <div className="leading-tight">
              <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                R<span className="text-[0.75em]">es</span>Q · Assistant
              </p>
              <p className="font-mono text-[9px] tracking-[0.18em] uppercase opacity-60">
                {lastIntent ? `Last intent ${lastIntent}` : "Classify first · then agents"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="ml-auto grid size-7 place-items-center border border-background/40 transition-colors hover:bg-background hover:text-foreground"
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
                  className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-foreground text-background font-mono"
                      : "border border-border bg-surface text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="space-y-1 border border-border bg-surface px-3 py-2">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  Master thinking<span className="loader-dots" />
                </p>
                {agentTrace.map((s, i) => (
                  <p key={i} className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {s.agent} — {s.text}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border-strong p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask, or report a new fact…"
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
        aria-label={open ? "Close ResQ assistant" : "Open ResQ assistant"}
        className="grid size-12 place-items-center border border-border-strong bg-foreground text-background transition-transform hover:scale-105"
      >
        {open ? <X className="size-5" /> : <MessageSquare className="size-5" />}
      </button>
    </div>
  );
}
