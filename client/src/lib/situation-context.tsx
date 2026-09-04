"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { runOrchestration, type OrchestrationResult } from "./agents-runtime";
import { initialSnapshot, type ConsoleSnapshot, type AgentStep } from "./snapshot";

type SituationValue = {
  snapshot: ConsoleSnapshot;
  setSnapshot: (s: ConsoleSnapshot) => void;
  thinking: AgentStep[];
  lastIntent: string | null;
  runPrompt: (message: string) => Promise<OrchestrationResult>;
};

const SituationContext = createContext<SituationValue | null>(null);

export function SituationProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ConsoleSnapshot>(initialSnapshot);
  const [thinking, setThinking] = useState<AgentStep[]>([]);
  const [lastIntent, setLastIntent] = useState<string | null>(null);

  const runPrompt = useCallback(async (message: string) => {
    const fallback = runOrchestration(snapshot, message);
    setThinking(fallback.thinking);
    setLastIntent(fallback.intent);

    try {
      const res = await fetch("/api/resq/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, snapshot }),
      });
      if (!res.ok) {
        if (fallback.changed) setSnapshot(fallback.snapshot);
        return fallback;
      }
      const data = (await res.json()) as OrchestrationResult;
      setThinking(data.thinking ?? fallback.thinking);
      setLastIntent(data.intent);
      if (data.changed && data.snapshot) setSnapshot(data.snapshot);
      return data;
    } catch {
      if (fallback.changed) setSnapshot(fallback.snapshot);
      return fallback;
    }
  }, [snapshot]);

  const value = useMemo(
    () => ({ snapshot, setSnapshot, thinking, lastIntent, runPrompt }),
    [snapshot, thinking, lastIntent, runPrompt]
  );

  return <SituationContext.Provider value={value}>{children}</SituationContext.Provider>;
}

export function useSituation() {
  const ctx = useContext(SituationContext);
  if (!ctx) throw new Error("useSituation must be used inside SituationProvider");
  return ctx;
}
