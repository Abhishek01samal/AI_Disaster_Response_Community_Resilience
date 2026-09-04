import type { ConsoleSnapshot } from "../snapshot";
import type { ChatIntent } from "./types";

const COMPOSER_SYSTEM = `You are the ResQ response composer. You turn structured agent JSON into short natural-language replies for citizens and operators.

HARD RULES:
- Never state a severity, capacity number, ETA, or location as fact unless it appears in the FACTS block below.
- Always keep source labels: OFFICIAL / VERIFIED / COMMUNITY / AI SIGNAL / STALE when referring to reports or alerts.
- Never say "flood confirmed" from clustering alone — say a cluster of reports suggests possible flooding, awaiting confirmation.
- Never promise a response time, ambulance ETA, or rescue guarantee.
- If risk confidence is low or data may be stale, say information may be out of date.
- Out of scope (medical diagnosis, legal advice, unrelated topics) → deflect to disaster safety, reporting, and coordination only.
- Never issue evacuation orders or claim a real ambulance was dispatched.
- Keep replies 2–6 short sentences. Calm tone if the user seems panicked.
- This is decision support. Life-threatening emergencies also need local emergency services.`;

export function buildComposerSystemPrompt(facts: string, intent: ChatIntent): string {
  return `${COMPOSER_SYSTEM}

Intent for this turn: ${intent}

FACTS (only these may be stated as true):
${facts}`;
}

/** Deterministic freshness hint — only when primary risk signals look stale. */
export function freshnessNote(s: ConsoleSnapshot): string {
  const officialFresh = s.alerts.some((a) => a.state === "OFFICIAL" || a.state === "VERIFIED");
  const allStale =
    s.alerts.length > 0 && s.alerts.every((a) => a.state === "STALE");
  if (allStale || (!officialFresh && s.riskIndex <= 0)) {
    return "This information may be out of date.";
  }
  return "";
}

export function sourceTag(state: string, age?: string): string {
  const label = state.replace(/_/g, " ");
  return age ? `(${label.toLowerCase()}, ${age})` : `(${label.toLowerCase()})`;
}

export function factsBlock(s: ConsoleSnapshot, extra: string[] = []): string {
  const lines = [
    `River gauge: ${s.riverM.toFixed(2)} m (danger ${s.dangerM.toFixed(2)} m)`,
    `Rainfall: ${s.rainfallMm} mm · drainage ${s.drainage}`,
    `Composite risk index: ${s.riskIndex}`,
    `Active incidents: ${s.incidents.length}`,
    `Open SOS: ${s.queue.length} (${s.queue.filter((q) => q.pri === "P0").length} at P0)`,
    `Top shelters: ${s.safePlaces
      .slice(0, 3)
      .map((p) => `${p.name} score ${p.score} ${p.dist} ${p.cap}`)
      .join("; ")}`,
    `Do-now: ${s.doNow.slice(0, 3).join(" | ")}`,
    `Latest alert: ${s.alerts[0]?.head ?? "none"} [${s.alerts[0]?.state ?? "—"}]`,
    ...extra,
  ];
  return lines.join("\n");
}

export { COMPOSER_SYSTEM };
