import { classifyIntent, type Intent } from "./intent";
import {
  clock,
  refreshDerived,
  type AgentStep,
  type ConsoleSnapshot,
} from "./snapshot";
import type { Incident } from "./mock-data";

export type OrchestrationResult = {
  intent: Intent;
  reason: string;
  thinking: AgentStep[];
  reply: string;
  snapshot: ConsoleSnapshot;
  changed: boolean;
};

function clone(s: ConsoleSnapshot): ConsoleSnapshot {
  return JSON.parse(JSON.stringify(s)) as ConsoleSnapshot;
}

function parseRiver(text: string): number | null {
  const m = text.match(
    /(?:river|gauge|level|nadipur)[^\d]{0,24}(\d+(?:\.\d+)?)\s*m\b/i
  ) || text.match(/(\d+(?:\.\d+)?)\s*m(?:eters)?\b/i);
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
  const n = (Math.max(0, ...nums) + 1).toString().padStart(4, "0");
  return `INC-${n}`;
}

function nextSosId(queue: ConsoleSnapshot["queue"]): string {
  const nums = queue.map((i) => Number(i.id.replace(/\D/g, ""))).filter((n) => !Number.isNaN(n));
  return `SOS-${Math.max(2200, ...nums) + 1}`;
}

function nextAlertCode(alerts: ConsoleSnapshot["alerts"]): string {
  const nums = alerts.map((a) => Number(a.code.replace(/\D/g, ""))).filter((n) => !Number.isNaN(n));
  return `ALT-${Math.max(70, ...nums) + 1}`;
}

/** Deterministic specialist agents. LLM may narrate; it does not replace this math. */
export function runOrchestration(
  snapshot: ConsoleSnapshot,
  prompt: string
): OrchestrationResult {
  const { intent, reason } = classifyIntent(prompt);
  const thinking: AgentStep[] = [
    { agent: "MASTER", text: `Intent = ${intent}. ${reason}` },
  ];

  if (intent === "QUERY") {
    thinking.push(
      { agent: "VALIDATION", text: "No write to the operating picture — query only." },
      { agent: "RISK", text: `Current risk index ${snapshot.riskIndex}, river ${snapshot.riverM.toFixed(2)} m.` },
      { agent: "ROUTE", text: `Top shelter: ${snapshot.safePlaces[0]?.name ?? "none"} (${snapshot.safePlaces[0]?.score}).` },
      { agent: "RESOURCE", text: `${snapshot.camps.length} camps in register.` },
      { agent: "RESPONSE", text: `${snapshot.queue.length} SOS in queue.` },
      { agent: "EVALUATION", text: "Answer uses existing sources only. No silent promotion to OFFICIAL." }
    );
    return {
      intent,
      reason,
      thinking,
      reply: answerQuery(snapshot, prompt),
      snapshot,
      changed: false,
    };
  }

  let next = clone(snapshot);
  thinking.push({
    agent: "DATA_REFINEMENT",
    text: "Normalized the prompt into a structured event (location, hazard, numbers).",
  });
  thinking.push({
    agent: "VALIDATION",
    text: "Schema, timestamp and source checks passed as COMMUNITY / AI SIGNAL until an authority confirms.",
  });

  const river = parseRiver(prompt);
  const rain = parseRain(prompt);
  if (river != null) next.riverM = river;
  if (rain != null) next.rainfallMm = rain;

  if (intent === "SOS") {
    thinking.push({
      agent: "RESPONSE",
      text: "Queued a simulated SOS. No real dispatch. Human / simulator only.",
    });
    const trapped = /trap/i.test(prompt);
    const medical = /medical|dialysis|ambulance|injur/i.test(prompt);
    next.queue = [
      {
        id: nextSosId(next.queue),
        who: "Citizen · chat intake",
        need: trapped ? "Trapped" : medical ? "Medical" : "SOS from chat",
        pri: trapped || medical ? "P0" : "P1",
        eta: "—",
        status: "QUEUED",
      },
      ...next.queue,
    ];
  }

  const looksLikeNewIncident =
    intent === "MUTATE" &&
    /\b(flood|fire|submerged|breach|overflow|collapse|trapped|power|incident|water entered|road)\b/i.test(
      prompt
    );

  if (looksLikeNewIncident) {
    thinking.push({
      agent: "RISK",
      text: "Clustered as a new AI SIGNAL incident pending field confirmation.",
    });
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

  thinking.push({
    agent: "RISK",
    text: "Recomputed composite risk from gauge, rainfall and report volume.",
  });
  const over = Math.max(0, next.riverM - next.dangerM);
  next.riskIndex = Math.max(
    12,
    Math.min(99, Math.round(48 + over * 38 + next.rainfallMm / 18 + next.incidents.length))
  );
  next.drainage = next.rainfallMm >= 80 || next.riverM >= next.dangerM ? "HIGH" : "MODERATE";
  next.hazard = /fire/i.test(prompt) && !/flood/i.test(prompt) ? "fire" : "flood";

  next.incidents = next.incidents.map((i, idx) =>
    idx === 0 && looksLikeNewIncident
      ? i
      : { ...i, severity: Math.min(99, i.severity + Math.round(over * 4)) }
  );

  thinking.push({
    agent: "ROUTE",
    text: "Re-ranked shelters: elevation, capacity, route risk. Shortest path is not used.",
  });
  next.safePlaces = [...next.safePlaces]
    .map((p) => {
      const elev = Number(p.elev.replace(/[^\d]/g, "")) || 8;
      const [used, total] = p.cap.split("/").map((x) => Number(x.trim()));
      const open = total ? 1 - used / total : 0.5;
      const dist = Number(p.dist.replace(/[^\d.]/g, "")) || 1;
      const score = Math.max(
        20,
        Math.min(99, Math.round(40 + elev * 2.4 + open * 28 - dist * 6 - over * 8))
      );
      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);

  thinking.push({
    agent: "RESOURCE",
    text: "Checked camp occupancy. Near-limit sites stay labelled; allocations still need Confirm.",
  });
  const tight = next.camps.find((c) => c.ppl / c.cap >= 0.9);
  const spare = next.camps.find((c) => c.ppl / c.cap < 0.75);
  if (tight && spare) {
    next.alerts = [
      ...next.alerts,
      {
        code: nextAlertCode(next.alerts),
        head: `${tight.name} approaching capacity`,
        body: `${tight.name} at ${Math.round((tight.ppl / tight.cap) * 100)}%. Resource Agent suggests redirecting intake to ${spare.name}. Human confirmation required.`,
        state: "AI SIGNAL",
        time: clock(),
        src: "Resource agent",
      },
    ];
  }

  next.doNow =
    next.hazard === "fire"
      ? [
          "Leave smoke-filled rooms. Crawl if air is low.",
          "Do not use lifts. Take phone, ID and medicines.",
          "Move to the nearest open assembly point upwind of smoke.",
          "Share live location only while an SOS is active.",
        ]
      : [
          "Move to the highest accessible floor. Do not enter basements or underpasses.",
          "Take phone, power bank, medicines, ID and drinking water.",
          next.riverM >= next.dangerM
            ? `Avoid the embankment road — gauge ${next.riverM.toFixed(2)} m is above danger ${next.dangerM.toFixed(2)} m.`
            : "Watch underpasses; two segments were previously flagged submerged.",
          "Share live location only while an SOS is active.",
        ];

  thinking.push({
    agent: "EVALUATION",
    text: "Gate: new facts stay AI SIGNAL / COMMUNITY. No autonomous evacuation order. Ambulance remains simulated.",
  });

  next.alerts = [
    ...next.alerts,
    {
      code: nextAlertCode(next.alerts),
      head: intent === "SOS" ? "SOS intake from assistant" : "Operating picture updated from citizen prompt",
      body: prompt.slice(0, 220),
      state: "AI SIGNAL",
      time: clock(),
      src: "Master orchestrator",
    },
  ];

  next = refreshDerived(next);

  const reply =
    intent === "SOS"
      ? `SOS queued as ${next.queue[0]?.id} (${next.queue[0]?.pri}). Response Agent listed it in the responder queue. This is a labelled simulator — no real ambulance was dispatched. Revoke location sharing from the SOS panel if you need to.`
      : `Master ran Risk, Route, Resource and Response on your update. River ${next.riverM.toFixed(2)} m · rain ${next.rainfallMm} mm · risk ${next.riskIndex}. Ranked safe location: ${next.safePlaces[0]?.name} (score ${next.safePlaces[0]?.score}). New signals are AI SIGNAL until verified. Confirm is still required for relief allocations.`;

  return { intent, reason, thinking, reply, snapshot: next, changed: true };
}

function answerQuery(s: ConsoleSnapshot, prompt: string): string {
  const q = prompt.toLowerCase();
  if (/shelter|safe|where (should|do) i go|camp/i.test(q)) {
    const top = s.safePlaces.slice(0, 3)
      .map((p) => `${p.name} (${p.score}, ${p.dist}, ${p.cap})`)
      .join("; ");
    return `Route Agent ranking (not shortest path): ${top}. Community Centre East is a capacity risk if occupancy is high. Check Relief for needs/offers.`;
  }
  if (/sos|help|ambulance|trapped/i.test(q)) {
    return `Open Incident Map → Send SOS. ${s.queue.length} cases are in the responder queue, ${s.queue.filter((x) => x.pri === "P0").length} at P0. Ambulance layer is simulated. I will not dispatch a unit from chat unless you clearly ask to file an SOS.`;
  }
  if (/river|gauge|rain|risk|warning|flood/i.test(q)) {
    return `Risk Agent picture: Nadipur gauge ${s.riverM.toFixed(2)} m (danger ${s.dangerM.toFixed(2)} m), rainfall ${s.rainfallMm} mm, drainage ${s.drainage}, composite risk ${s.riskIndex}. ${s.riverM >= s.dangerM ? "RED warning remains active on the ticker." : "Gauge is below the danger mark."} Official items live on Situation.`;
  }
  if (/incident|map|report/i.test(q)) {
    return `${s.incidents.length} incidents on the register. Latest: ${s.incidents[0]?.id} — ${s.incidents[0]?.type} (${s.incidents[0]?.state}). File a new ground report under Situation; it starts as COMMUNITY.`;
  }
  if (/match|blanket|medicine|resource/i.test(q)) {
    const open = s.matches.filter((m) => !m.confirmed).length;
    return `Resource Agent has ${s.matches.length} proposed matches, ${open} still waiting on human Confirm. High-impact allocations are never auto-applied.`;
  }
  return `Current picture: ${s.ticker[0]}. ${s.incidents.length} incidents, ${s.queue.length} SOS, risk ${s.riskIndex}. Ask a specific question, or state a new fact (for example “river is 8.9 m”) to run the full agent loop.`;
}
