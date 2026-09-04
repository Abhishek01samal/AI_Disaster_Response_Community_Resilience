import {
  clock,
  recomputeAgents,
  refreshDerived,
  type AgentStep,
  type ConsoleSnapshot,
} from "../snapshot";
import type { Incident } from "../mock-data";
import { classifyChatIntent } from "./intents";
import type { ChatIntent } from "./types";
import {
  advanceSosFlow,
  getCompletedSosDraft,
  seedSosFromUtterance,
} from "./sos-flow";
import { factsBlock, sourceTag } from "./composer";
import type {
  ChatTurnResult,
  ConversationSession,
  SosDraft,
} from "./types";
import { DISCLAIMER, emptySession } from "./types";

const NADIPUR = { lat: 17.385, lng: 78.4867 };

function clone(s: ConsoleSnapshot): ConsoleSnapshot {
  return JSON.parse(JSON.stringify(s)) as ConsoleSnapshot;
}

function parseRiver(text: string): number | null {
  const m =
    text.match(/(?:river|gauge|level|nadipur)[^\d]{0,24}(\d+(?:\.\d+)?)\s*m\b/i) ||
    text.match(/(\d+(?:\.\d+)?)\s*m(?:eters)?\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 4 && n <= 20 ? n : null;
}

function parseRain(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*mm\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 0 && n <= 800 ? n : null;
}

function nextIncidentId(list: Incident[]): string {
  const nums = list.map((i) => Number(i.id.replace(/\D/g, ""))).filter((n) => !Number.isNaN(n));
  return `INC-${(Math.max(0, ...nums) + 1).toString().padStart(4, "0")}`;
}

function nextSosId(queue: ConsoleSnapshot["queue"]): string {
  const nums = queue.map((i) => Number(i.id.replace(/\D/g, ""))).filter((n) => !Number.isNaN(n));
  return `SOS-${Math.max(2200, ...nums) + 1}`;
}

function nextAlertCode(alerts: ConsoleSnapshot["alerts"]): string {
  const nums = alerts.map((a) => Number(a.code.replace(/\D/g, ""))).filter((n) => !Number.isNaN(n));
  return `ALT-${Math.max(70, ...nums) + 1}`;
}

function applyRiskRecompute(next: ConsoleSnapshot, prompt: string): ConsoleSnapshot {
  if (/fire/i.test(prompt) && !/flood/i.test(prompt)) {
    next.hazard = "fire";
  } else if (/flood|water|river/i.test(prompt)) {
    next.hazard = "flood";
  }
  return recomputeAgents(next);
}

function queueSosFromDraft(
  snapshot: ConsoleSnapshot,
  draft: SosDraft,
  sosId?: string
): ConsoleSnapshot {
  const next = clone(snapshot);
  const id = sosId ?? nextSosId(next.queue);
  const pri = draft.trapped || draft.medicalHelpRequired ? "P0" : "P1";
  next.queue = [
    {
      id,
      who: `Household · ${draft.peopleAffected} persons`,
      need: draft.emergencyLabel,
      pri,
      eta: "—",
      status: "QUEUED",
    },
    ...next.queue,
  ];
  next.alerts = [
    {
      code: nextAlertCode(next.alerts),
      head: "SOS intake from assistant",
      body: `${draft.emergencyLabel} · ${draft.peopleAffected} people · ${draft.locationText ?? "live location"}`,
      state: "AI SIGNAL",
      time: clock(),
      src: "Response agent · chat",
    },
    ...next.alerts,
  ];
  return recomputeAgents(refreshDerived(next));
}

function handleCheckRisk(s: ConsoleSnapshot, thinking: AgentStep[]): string {
  thinking.push(
    { agent: "RISK", text: "Risk picture is on Console · Core metrics, not in chat." },
    { agent: "EVALUATION", text: "Chat does not restated sourced numbers." }
  );
  return `Risk, gauge, rainfall and the 24h inflow chart are on Console (01). Official alerts are on Situation. Region: ${s.regionName}.`;
}

function handleSafeLocation(s: ConsoleSnapshot, thinking: AgentStep[]): { reply: string } {
  thinking.push({
    agent: "ROUTE",
    text: "SafetyScore ranking is on Safe-action engine and Incident Map.",
  });
  return {
    reply: "Ranked safe locations are on Console section 03 and the Incident Map. Chat will not list them here.",
  };
}

function handleRoute(_s: ConsoleSnapshot, thinking: AgentStep[]): string {
  thinking.push({ agent: "ROUTE", text: "Route layers live on the Incident Map." });
  return "Turn on Routes + Shelters on the Incident Map. Hazard-avoidance ranking is on section 03.";
}

function handleSosStatus(
  _s: ConsoleSnapshot,
  _session: ConversationSession,
  thinking: AgentStep[]
): { reply: string } {
  thinking.push({ agent: "RESPONSE", text: "Queue is the Responder panel, not chat." });
  return { reply: "SOS status is on Console section 06 · Responder queue." };
}

function handleShelter(_s: ConsoleSnapshot, _prompt: string, thinking: AgentStep[]): string {
  thinking.push({ agent: "RESOURCE", text: "Capacity is on Relief camp register." });
  return "Shelter occupancy, needs and offers are on Relief (07). Resource matches are on (08).";
}

function handleResource(
  s: ConsoleSnapshot,
  prompt: string,
  thinking: AgentStep[],
  session: ConversationSession
): { reply: string; snapshot: ConsoleSnapshot; changed: boolean; session: ConversationSession } {
  thinking.push(
    { agent: "RESOURCE", text: "Queued a need record for the matching pass — Confirm still required." },
    { agent: "EVALUATION", text: "No auto-allocation." }
  );
  const need = prompt.replace(/^(we need|need|request)\s+/i, "").slice(0, 80);
  const next = clone(s);
  next.matches = [
    {
      need: need || "Supplies · unspecified",
      camp: next.camps[0]?.name ?? "Municipal High School",
      offer: "Pending match",
      conf: 0.55,
      confirmed: false,
    },
    ...next.matches,
  ];
  next.alerts = [
    {
      code: nextAlertCode(next.alerts),
      head: "Resource need from chat",
      body: need,
      state: "COMMUNITY",
      time: clock(),
      src: "Resource agent · chat",
    },
    ...next.alerts,
  ];
  return {
    reply: `Need logged on Resource matching (08). Confirm still required on the console.`,
    snapshot: recomputeAgents(next),
    changed: true,
    session: { ...session, flow: "IDLE", resourceNeed: need },
  };
}

function handleSafetyInfo(_s: ConsoleSnapshot, thinking: AgentStep[]): string {
  thinking.push({ agent: "MASTER", text: "Do-now list is on Safe-action engine." });
  return "Do-now guidance is on Console section 03. Limits are on section 11.";
}

function handleSmallTalk(): string {
  return "Name a place (for example Nepal) and I will replace the dummy console with public sources. Data stays on Console, Incident Map, Relief, and Situation.";
}

function handleClarify(): { reply: string } {
  return {
    reply:
      "I do not print the operating picture in chat. Name a location and I load Console, Incident Map, Relief, and Situation from public sources.",
  };
}

function handleEscalate(thinking: AgentStep[]): string {
  thinking.push({
    agent: "RESPONSE",
    text: "Hand-off request noted for operator queue (simulator label).",
  });
  return "I've flagged your request for a human operator. Keep this chat open for updates. If anyone is in immediate danger, also contact local emergency services directly.";
}

function handleMutate(
  snapshot: ConsoleSnapshot,
  prompt: string,
  thinking: AgentStep[]
): { reply: string; snapshot: ConsoleSnapshot; changed: boolean } {
  let next = clone(snapshot);
  thinking.push(
    { agent: "DATA_REFINEMENT", text: "Normalized prompt into structured event." },
    { agent: "VALIDATION", text: "Marked COMMUNITY / AI SIGNAL until authority confirms." }
  );
  const river = parseRiver(prompt);
  const rain = parseRain(prompt);
  if (river != null) next.riverM = river;
  if (rain != null) next.rainfallMm = rain;

  const looksLikeNewIncident = /\b(flood|fire|submerged|breach|overflow|collapse|trapped|power|incident|water entered|road)\b/i.test(
    prompt
  );
  if (looksLikeNewIncident) {
    thinking.push({ agent: "RISK", text: "Clustered as AI SIGNAL incident." });
    const type = /fire/i.test(prompt)
      ? "Fire"
      : /medical/i.test(prompt)
        ? "Medical"
        : /road|underpass|submerged/i.test(prompt)
          ? "Road submerged"
          : "Flood / ground report";
    next.incidents = [
      {
        id: nextIncidentId(next.incidents),
        type,
        zone: /sector\s*\d+/i.exec(prompt)?.[0] ?? "Sector 04 — Nadipur",
        severity: river != null && river >= next.dangerM ? 90 : 72,
        reports: 1,
        state: "AI SIGNAL",
        updated: "00:00",
        x: 32 + Math.round(Math.random() * 40),
        y: 28 + Math.round(Math.random() * 40),
      },
      ...next.incidents,
    ];
    next.reportsToday += 1;
  }

  thinking.push(
    { agent: "RISK", text: "Recomputed composite risk." },
    { agent: "ROUTE", text: "Re-ranked shelters." },
    { agent: "RESOURCE", text: "Checked camp occupancy." },
    { agent: "EVALUATION", text: "No autonomous evacuation order." }
  );
  next = applyRiskRecompute(next, prompt);
  next.alerts = [
    {
      code: nextAlertCode(next.alerts),
      head: "Operating picture updated from citizen prompt",
      body: prompt.slice(0, 220),
      state: "AI SIGNAL",
      time: clock(),
      src: "Master orchestrator",
    },
    ...next.alerts,
  ];
  next = refreshDerived(next);
  return {
    reply: `Console updated from your report (AI SIGNAL until verified). See Incident register and Situation.`,
    snapshot: next,
    changed: true,
  };
}

function handleSubmitReport(
  snapshot: ConsoleSnapshot,
  prompt: string,
  session: ConversationSession,
  thinking: AgentStep[],
  secondarySos: boolean
): ChatTurnResult {
  thinking.push(
    { agent: "DATA_REFINEMENT", text: "Structured community report from free text." },
    { agent: "RISK", text: "Queued for clustering — not promoted to OFFICIAL." }
  );

  if (secondarySos || /\b(trapped|sos|ambulance|wheelchair|rising fast|help)\b/i.test(prompt)) {
    // Spec dialogue: treat as emergency candidate, start SOS with seeded slots
    const seeded = seedSosFromUtterance(prompt);
    const sosStart = advanceSosFlow(
      { ...session, sosDraft: seeded, flow: "SOS", sosState: "SOS_START" },
      prompt,
      true
    );
    return {
      intent: "FILE_SOS",
      reason: "Urgent report escalated to SOS slot-filling.",
      confidence: 0.9,
      thinking,
      reply: `Treating this as an SOS. Complete the steps here; the queue updates on Console 06.`,
      snapshot,
      changed: false,
      session: sosStart.session,
      options: sosStart.options,
      showDisclaimer: true,
      pendingWrite: {
        type: "report",
        payload: {
          rawText: prompt,
          locationText: seeded.locationText,
        },
      },
    };
  }

  // Confirm report draft
  if (session.flow === "REPORT" && session.reportDraft.awaitingConfirm) {
    const yn = /\b(yes|submit|send|confirm)\b/i.test(prompt);
    const no = /\b(no|cancel|edit)\b/i.test(prompt);
    if (no) {
      return {
        intent: "SUBMIT_REPORT",
        reason: "Report cancelled.",
        confidence: 1,
        thinking,
        reply: "Report cancelled. Nothing was filed.",
        snapshot,
        changed: false,
        session: emptySession(),
      };
    }
    if (yn || session.reportDraft.rawText) {
      const raw = session.reportDraft.rawText || prompt;
      const mutated = handleMutate(snapshot, raw, thinking);
      return {
        intent: "SUBMIT_REPORT",
        reason: "Community report submitted.",
        confidence: 1,
        thinking,
        reply: `Report filed as COMMUNITY ${sourceTag("COMMUNITY", "just now")}. A cluster of reports suggests possible flooding only after confirmation — this alone is not an official flood declaration.\n${mutated.reply}`,
        snapshot: mutated.snapshot,
        changed: true,
        session: emptySession(),
        pendingWrite: {
          type: "report",
          payload: { rawText: raw, locationText: session.reportDraft.locationText },
        },
      };
    }
  }

  const loc = prompt.match(/\b(sector\s*\d+|ward\s*\d+|nadipur)\b/i)?.[0];
  const nextSession: ConversationSession = {
    ...session,
    flow: "REPORT",
    reportDraft: { rawText: prompt, locationText: loc, awaitingConfirm: true },
  };
  return {
    intent: "SUBMIT_REPORT",
    reason: "Community report draft awaiting confirm.",
    confidence: 0.84,
    thinking,
    reply: `I'll file this as a community report (not official):\n“${prompt.slice(0, 180)}”${loc ? `\nLocation: ${loc}` : ""}\n\nSubmit this report?`,
    snapshot,
    changed: false,
    session: nextSession,
    options: [
      { id: "submit", label: "Submit report", value: "Yes, submit" },
      { id: "cancel", label: "Cancel", value: "Cancel" },
    ],
    showDisclaimer: true,
  };
}

/**
 * Main chatbot turn — same snapshot the console renders.
 */
export function runChatTurn(
  snapshot: ConsoleSnapshot,
  prompt: string,
  session: ConversationSession
): ChatTurnResult {
  const thinking: AgentStep[] = [];
  const text = prompt.trim();

  // Continue active SOS slot-filling before re-classifying
  if (session.flow === "SOS" && session.sosState !== "IDLE" && session.sosState !== "SOS_SUBMITTED") {
    thinking.push({
      agent: "MASTER",
      text: `Continuing SOS flow at ${session.sosState}.`,
    });
    const step = advanceSosFlow(session, text, false);
    if (step.cancelled) {
      return {
        intent: "FILE_SOS",
        reason: "SOS cancelled by user.",
        confidence: 1,
        thinking,
        reply: step.reply,
        snapshot,
        changed: false,
        session: step.session,
      };
    }
    if (step.submitted) {
      const draft = getCompletedSosDraft(step.session);
      if (!draft) {
        return {
          intent: "FILE_SOS",
          reason: "SOS submit failed — incomplete draft.",
          confidence: 1,
          thinking,
          reply: "Could not submit — draft incomplete. Let's restart.",
          snapshot,
          changed: false,
          session: emptySession(),
          options: [{ id: "restart", label: "Start SOS", value: "I need help" }],
        };
      }
      thinking.push(
        { agent: "RESPONSE", text: "Submitting SOS through Response Agent path." },
        { agent: "EVALUATION", text: "Simulator label — no real dispatch guarantee." }
      );
      const sosId = nextSosId(snapshot.queue);
      const nextSnap = queueSosFromDraft(snapshot, draft, sosId);
      return {
        intent: "FILE_SOS",
        reason: "SOS submitted to shared queue.",
        confidence: 1,
        thinking,
        reply: `${sosId} is on the Responder queue (06). Watch status there — not in this chat. ${DISCLAIMER}`,
        snapshot: nextSnap,
        changed: true,
        session: {
          ...emptySession(),
          lastSosId: sosId,
          preferredLanguage: session.preferredLanguage,
        },
        showDisclaimer: true,
        pendingWrite: {
          type: "sos",
          payload: { ...draft, lat: NADIPUR.lat, lng: NADIPUR.lng },
        },
      };
    }
    return {
      intent: "FILE_SOS",
      reason: `SOS slot ${step.session.sosState}.`,
      confidence: 1,
      thinking,
      reply: step.reply,
      snapshot,
      changed: false,
      session: step.session,
      options: step.options,
      card: step.readyToConfirm
        ? {
            kind: "sos_draft",
            draft: getCompletedSosDraft(step.session)!,
            actions: ["send", "edit", "cancel"],
          }
        : undefined,
      showDisclaimer: true,
    };
  }

  // Continue report confirm
  if (session.flow === "REPORT" && session.reportDraft.awaitingConfirm) {
    return handleSubmitReport(snapshot, text, session, thinking, false);
  }

  const classified = classifyChatIntent(text);
  thinking.push({
    agent: "MASTER",
    text: `Intent = ${classified.intent} (${classified.confidence.toFixed(2)}). ${classified.reason}`,
  });

  const intent = classified.intent;

  if (intent === "CLARIFY") {
    const c = handleClarify();
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: c.reply,
      snapshot,
      changed: false,
      session,
      showDisclaimer: true,
    };
  }

  if (intent === "SMALL_TALK") {
    const c = handleClarify();
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: `${handleSmallTalk()}\n\n${c.reply}`,
      snapshot,
      changed: false,
      session,
      showDisclaimer: true,
    };
  }

  if (intent === "LOAD_REGION") {
    thinking.push({
      agent: "DATA_REFINEMENT",
      text: "Fetch public sources and replace dummy console panels.",
    });
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply:
        "Loading public sources onto Console, Incident Map, Relief, and Situation. Chat will not list the numbers.",
      snapshot,
      changed: false,
      session,
      showDisclaimer: true,
      pendingWrite: { type: "live_region", query: text },
    };
  }

  if (intent === "ESCALATE_TO_HUMAN") {
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: handleEscalate(thinking),
      snapshot,
      changed: false,
      session,
      showDisclaimer: true,
    };
  }

  if (intent === "CHECK_RISK") {
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: handleCheckRisk(snapshot, thinking),
      snapshot,
      changed: false,
      session,
      showDisclaimer: true,
    };
  }

  if (intent === "FIND_SAFE_LOCATION") {
    const r = handleSafeLocation(snapshot, thinking);
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: r.reply,
      snapshot,
      changed: false,
      session,
      showDisclaimer: true,
    };
  }

  if (intent === "GET_ROUTE") {
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: handleRoute(snapshot, thinking),
      snapshot,
      changed: false,
      session,
      showDisclaimer: true,
    };
  }

  if (intent === "CHECK_SOS_STATUS") {
    const r = handleSosStatus(snapshot, session, thinking);
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: r.reply,
      snapshot,
      changed: false,
      session,
      showDisclaimer: true,
    };
  }

  if (intent === "CHECK_SHELTER") {
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: handleShelter(snapshot, text, thinking),
      snapshot,
      changed: false,
      session,
    };
  }

  if (intent === "REQUEST_RESOURCE") {
    const r = handleResource(snapshot, text, thinking, session);
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: r.reply,
      snapshot: r.snapshot,
      changed: r.changed,
      session: r.session,
      showDisclaimer: true,
    };
  }

  if (intent === "GENERAL_SAFETY_INFO") {
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: handleSafetyInfo(snapshot, thinking),
      snapshot,
      changed: false,
      session,
      showDisclaimer: true,
    };
  }

  if (intent === "MUTATE_SCENARIO") {
    const r = handleMutate(snapshot, text, thinking);
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: r.reply,
      snapshot: r.snapshot,
      changed: r.changed,
      session,
    };
  }

  if (intent === "SUBMIT_REPORT") {
    return handleSubmitReport(
      snapshot,
      text,
      session,
      thinking,
      classified.secondary === "FILE_SOS"
    );
  }

  if (intent === "FILE_SOS") {
    const step = advanceSosFlow(session, text, true);
    thinking.push(
      { agent: "RESPONSE", text: "Starting structured SOS slot-filling (no free-write of fields)." }
    );
    const draft = getCompletedSosDraft(step.session);
    return {
      intent,
      reason: classified.reason,
      confidence: classified.confidence,
      thinking,
      reply: step.reply,
      snapshot,
      changed: false,
      session: step.session,
      options: step.options,
      card: step.readyToConfirm && draft
        ? { kind: "sos_draft", draft, actions: ["send", "edit", "cancel"] }
        : undefined,
      showDisclaimer: true,
    };
  }

  const c = handleClarify();
  return {
    intent: "CLARIFY",
    reason: "Fallback clarify.",
    confidence: 0.2,
    thinking,
    reply: c.reply,
    snapshot,
    changed: false,
    session,
    showDisclaimer: true,
  };
}

export function chatFactsForComposer(result: ChatTurnResult): string {
  return factsBlock(result.snapshot, [
    `Reply intent: ${result.intent}`,
    `Deterministic reply draft: ${result.reply.slice(0, 500)}`,
  ]);
}

export type { ChatIntent, ConversationSession };
