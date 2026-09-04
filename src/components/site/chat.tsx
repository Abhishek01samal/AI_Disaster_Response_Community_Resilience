"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const REPLIES: [RegExp, string][] = [
  [
    /sos|emergency|help|trapped/i,
    "Open the **Incident Map**, select the nearest marker and press **Send SOS**. Your live location is shared only while the SOS is active and you can revoke it at any time. P0 cases are triaged first in the responder queue.",
  ],
  [
    /shelter|camp|safe|relief/i,
    "Check **Relief** for the camp register — capacity, needs and offers per site. The console also ranks safe locations by elevation, capacity and route risk under the safe-action engine. Municipal High School is currently the highest-ranked option.",
  ],
  [
    /alert|warning|flood|river|rain/i,
    "A **red warning** is active: the Nadipur river is at 8.42 m against an 8.00 m danger mark. Move to the highest accessible floor, avoid the embankment road, and follow the official feed on the **Situation** page.",
  ],
  [
    /map|incident|report/i,
    "The **Incident Map** layers hazards, routes, shelters, SOS markers and reports. Toggle layers with the switches above the map; public layers use coarse location for privacy.",
  ],
  [
    /verify|source|trust|rumou?r/i,
    "Every record carries a source state: **OFFICIAL**, **VERIFIED**, **COMMUNITY**, **AI SIGNAL** or **STALE**. Treat community items as signals until a moderator confirms them.",
  ],
];

const FALLBACK =
  "I can help with SOS, shelters and relief camps, current alerts, the incident map, and how verification states work. What do you need?";

function reply(input: string): string {
  for (const [re, r] of REPLIES) if (re.test(input)) return r;
  return FALLBACK;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "ResQ assistant online. Ask me about alerts, safe actions, shelters or sending an SOS.",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: q }]);
    setThinking(true);
    timer.current = setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: reply(q) },
      ]);
      setThinking(false);
    }, 900);
  };

  return (
    <div className="fixed right-4 bottom-4 z-[120] flex flex-col items-end gap-3 md:right-6 md:bottom-6">
      {open && (
        <div className="flex h-[480px] w-[min(92vw,380px)] flex-col border border-border-strong bg-background shadow-[8px_8px_0_0_var(--color-foreground)]">
          {/* header */}
          <div className="flex items-center gap-3 border-b border-border-strong bg-foreground px-4 py-3 text-background">
            <span className="grid size-6 place-items-center border border-background/60">
              <span className="size-2 bg-background" />
            </span>
            <div className="leading-tight">
              <p className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                R<span className="text-[0.75em]">es</span>Q · Assistant
              </p>
              <p className="font-mono text-[9px] tracking-[0.18em] uppercase opacity-60">
                Guidance only — not dispatch
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="ml-auto grid size-7 place-items-center border border-background/40 transition-colors hover:bg-background hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* transcript */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 text-xs leading-relaxed ${
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
              <div className="flex justify-start">
                <div className="border border-border bg-surface px-3 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  Checking channels<span className="loader-dots" />
                </div>
              </div>
            )}
          </div>

          {/* composer */}
          <div className="border-t border-border-strong p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about alerts, shelters, SOS…"
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

      {/* square toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close ResQ assistant" : "Open ResQ assistant"}
        className="grid size-12 place-items-center border border-border-strong bg-foreground text-background transition-transform hover:scale-105"
      >
        {open ? <X className="size-5" /> : <MessageSquare className="size-5" />}
      </button>
    </div>
  );
}
