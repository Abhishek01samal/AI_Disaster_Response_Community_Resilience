"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { runChatTurn } from "./chat/engine";
import {
  DISCLAIMER,
  emptySession,
  type ChatCard,
  type ChatTurnResult,
  type ConversationSession,
  type QuickOption,
} from "./chat/types";
import {
  computeOperatingPicture,
  recomputeAgents,
  refreshDerived,
  type ConsoleSnapshot,
  type AgentStep,
} from "./snapshot";
import { submitReportAction, submitSosAction } from "./ops";

export type PromptResult = ChatTurnResult & {
  legacyIntent: string;
};

type SituationValue = {
  snapshot: ConsoleSnapshot;
  setSnapshot: (s: ConsoleSnapshot) => void;
  thinking: AgentStep[];
  lastIntent: string | null;
  session: ConversationSession;
  lastOptions: QuickOption[];
  lastCard: ChatCard | null;
  disclaimer: string;
  live: boolean;
  runPrompt: (message: string) => Promise<PromptResult>;
};

const SituationContext = createContext<SituationValue | null>(null);

const NADIPUR = { lat: 17.385, lng: 78.4867 };

async function locate(): Promise<{ lat: number; lng: number }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return NADIPUR;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(NADIPUR),
      { enableHighAccuracy: true, timeout: 4000 }
    );
  });
}

async function flushPendingWrite(turn: ChatTurnResult) {
  const w = turn.pendingWrite;
  if (!w) return;
  try {
    if (w.type === "sos") {
      const loc = w.payload.locationConsent === true ? await locate() : NADIPUR;
      await submitSosAction({
        emergencyType: w.payload.emergencyType,
        peopleAffected: w.payload.peopleAffected,
        trapped: w.payload.trapped,
        medicalHelpRequired: w.payload.medicalHelpRequired,
        locationConsent: !!w.payload.locationConsent,
        lat: loc.lat,
        lng: loc.lng,
        emergencyNote: w.payload.note,
      });
    } else if (w.type === "report") {
      await submitReportAction({
        rawText: w.payload.rawText,
        locationText: w.payload.locationText,
      });
    }
  } catch {
    /* local console already updated */
  }
}

export function SituationProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ConsoleSnapshot>(() => computeOperatingPicture());
  const [thinking, setThinking] = useState<AgentStep[]>([]);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [session, setSession] = useState<ConversationSession>(emptySession);
  const [lastOptions, setLastOptions] = useState<QuickOption[]>([]);
  const [lastCard, setLastCard] = useState<ChatCard | null>(null);
  const [live, setLive] = useState(true);

  // Live clock: refresh freshness + lightly drift report inflow so panels feel live
  useEffect(() => {
    const id = window.setInterval(() => {
      setSnapshot((prev) => {
        const nextInflow = prev.reportInflow.map((v, i) => {
          if (i < prev.reportInflow.length - 1) return v;
          const jitter = ((Date.now() / 5000) | 0) % 5;
          return Math.max(4, Math.min(99, v + jitter - 2));
        });
        return refreshDerived({
          ...prev,
          reportInflow: nextInflow,
          freshnessSec: Math.max(
            0,
            Math.floor((Date.now() - new Date(prev.updatedAt).getTime()) / 1000)
          ),
        });
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  // Tier-2 style recompute every 30 minutes (and once shortly after mount)
  useEffect(() => {
    const recompute = () => {
      setSnapshot((prev) => {
        if (prev.origin === "live") {
          return refreshDerived({
            ...prev,
            freshnessSec: Math.max(
              0,
              Math.floor((Date.now() - new Date(prev.updatedAt).getTime()) / 1000)
            ),
          });
        }
        return recomputeAgents({
          ...prev,
          riverM: Number((prev.riverM + (Math.random() * 0.04 - 0.02)).toFixed(2)),
          rainfallMm: Math.max(0, prev.rainfallMm + Math.round(Math.random() * 4 - 2)),
        });
      });
      setLive(true);
    };
    const boot = window.setTimeout(recompute, 1500);
    const id = window.setInterval(recompute, 30 * 60 * 1000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, []);

  const runPrompt = useCallback(
    async (message: string) => {
      const local = runChatTurn(snapshot, message, session);
      setThinking(local.thinking);
      setLastIntent(local.intent);
      setLastOptions(local.options ?? []);
      setLastCard(local.card ?? null);
      setSession(local.session);

      if (local.pendingWrite?.type === "live_region") {
        try {
          const res = await fetch("/api/resq/live-picture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: local.pendingWrite.query }),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              snapshot: ConsoleSnapshot;
              reply?: string;
            };
            const snap = refreshDerived({
              ...data.snapshot,
              origin: "live",
              updatedAt: new Date().toISOString(),
            });
            setSnapshot(snap);
            setLive(true);
            if (typeof document !== "undefined") {
              document.getElementById("console")?.scrollIntoView({ behavior: "smooth" });
            }
            return {
              ...local,
              reply:
                data.reply ??
                `Loaded ${snap.regionName} onto Console, Incident Map, Relief, and Situation.`,
              snapshot: snap,
              changed: true,
              legacyIntent: local.intent,
            };
          }
        } catch {
          /* fall through */
        }
        return { ...local, legacyIntent: local.intent };
      }

      try {
        const res = await fetch("/api/resq/orchestrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, snapshot, session }),
        });
        if (!res.ok) {
          if (local.changed) setSnapshot(recomputeAgents(local.snapshot));
          void flushPendingWrite(local);
          return { ...local, legacyIntent: local.intent };
        }
        const data = (await res.json()) as ChatTurnResult & { reply: string };
        setThinking(data.thinking ?? local.thinking);
        setLastIntent(data.intent ?? local.intent);
        setLastOptions(data.options ?? local.options ?? []);
        setLastCard(data.card ?? local.card ?? null);
        if (data.session) setSession(data.session);
        const snap =
          data.changed && data.snapshot
            ? recomputeAgents(data.snapshot)
            : local.changed
              ? recomputeAgents(local.snapshot)
              : snapshot;
        const merged: PromptResult = {
          ...local,
          ...data,
          snapshot: snap,
          changed: Boolean(data.changed || local.changed),
          pendingWrite: data.pendingWrite ?? local.pendingWrite,
          legacyIntent: data.intent ?? local.intent,
        };
        if (merged.changed) setSnapshot(snap);
        void flushPendingWrite(merged);
        return merged;
      } catch {
        if (local.changed) setSnapshot(recomputeAgents(local.snapshot));
        void flushPendingWrite(local);
        return { ...local, legacyIntent: local.intent };
      }
    },
    [snapshot, session]
  );

  const value = useMemo(
    () => ({
      snapshot,
      setSnapshot: (s: ConsoleSnapshot) => setSnapshot(recomputeAgents(s)),
      thinking,
      lastIntent,
      session,
      lastOptions,
      lastCard,
      disclaimer: DISCLAIMER,
      live,
      runPrompt,
    }),
    [snapshot, thinking, lastIntent, session, lastOptions, lastCard, live, runPrompt]
  );

  return <SituationContext.Provider value={value}>{children}</SituationContext.Provider>;
}

export function useSituation() {
  const ctx = useContext(SituationContext);
  if (!ctx) throw new Error("useSituation must be used inside SituationProvider");
  return ctx;
}
