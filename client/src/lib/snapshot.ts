import type { Incident, SourceState } from "./mock-data";
import {
  alerts,
  camps,
  incidents,
  metrics,
  responseQueue,
  safePlaces,
} from "./mock-data";

export type QueueItem = (typeof responseQueue)[number];
export type Camp = (typeof camps)[number];
export type SafePlace = (typeof safePlaces)[number];
export type AlertItem = (typeof alerts)[number];
export type MatchItem = {
  need: string;
  camp: string;
  offer: string;
  conf: number;
  confirmed: boolean;
};

export type AgentStep = { agent: string; text: string };

export type ConsoleSnapshot = {
  scenario: string;
  riverM: number;
  dangerM: number;
  rainfallMm: number;
  drainage: string;
  riskIndex: number;
  reportsToday: number;
  hazard: string;
  doNow: string[];
  incidents: Incident[];
  safePlaces: SafePlace[];
  alerts: AlertItem[];
  camps: Camp[];
  queue: QueueItem[];
  matches: MatchItem[];
  metrics: { label: string; value: string; sub: string }[];
  ticker: string[];
};

export function initialSnapshot(): ConsoleSnapshot {
  const snap: ConsoleSnapshot = {
    scenario: "flood · district nadipur",
    riverM: 8.42,
    dangerM: 8,
    rainfallMm: 141,
    drainage: "HIGH",
    riskIndex: 78,
    reportsToday: 412,
    hazard: "flood",
    doNow: [
      "Move to the highest accessible floor. Do not enter basements or underpasses.",
      "Take phone, power bank, medicines, ID and drinking water.",
      "Avoid the embankment road — two segments flagged submerged.",
      "Share live location only while an SOS is active.",
    ],
    incidents: incidents.map((i) => ({ ...i })),
    safePlaces: safePlaces.map((p) => ({ ...p })),
    alerts: alerts.map((a) => ({ ...a })),
    camps: camps.map((c) => ({ ...c, needs: [...c.needs], offers: [...c.offers] })),
    queue: responseQueue.map((q) => ({ ...q })),
    matches: [
      { need: "Blankets · 120 units", camp: "Municipal High School", offer: "Ward 4 Volunteer Group", conf: 0.92, confirmed: false },
      { need: "Medicines · insulin cold chain", camp: "Grain Depot Hall", offer: "District Pharmacy Assoc.", conf: 0.81, confirmed: false },
      { need: "Sanitation units · 6", camp: "Community Centre East", offer: "Municipal Works", conf: 0.74, confirmed: false },
      { need: "Baby food · 40 kg", camp: "Grain Depot Hall", offer: "Relief Trust South", conf: 0.68, confirmed: false },
    ],
    metrics: metrics.map((m) => ({ ...m })),
    ticker: [],
  };
  return refreshDerived(snap);
}

export function refreshDerived(s: ConsoleSnapshot): ConsoleSnapshot {
  const occ = s.camps.reduce((a, c) => a + c.ppl, 0);
  const cap = s.camps.reduce((a, c) => a + c.cap, 0);
  const pct = cap ? Math.round((occ / cap) * 100) : 0;
  const p0 = s.queue.filter((q) => q.pri === "P0").length;
  const warning =
    s.riverM >= s.dangerM
      ? `RED WARNING — NADIPUR RIVER ${s.riverM.toFixed(2)} M`
      : `RIVER ${s.riverM.toFixed(2)} M — BELOW DANGER ${s.dangerM.toFixed(2)} M`;

  return {
    ...s,
    metrics: [
      { label: "Active incidents", value: String(s.incidents.length), sub: `${s.hazard} · live` },
      { label: "Open SOS", value: String(s.queue.length), sub: `${p0} at P0` },
      { label: "Median response", value: "07:24", sub: "min:sec" },
      { label: "Shelter capacity", value: `${pct}%`, sub: `${occ.toLocaleString()} places` },
      {
        label: "Reports verified",
        value: `${Math.min(99, Math.round((s.alerts.filter((a) => a.state === "VERIFIED" || a.state === "OFFICIAL").length / Math.max(1, s.alerts.length)) * 100))}%`,
        sub: `of ${s.reportsToday} today`,
      },
    ],
    ticker: [
      warning,
      `${s.incidents.length} ACTIVE INCIDENTS`,
      `${s.queue.length} OPEN SOS · ${p0} AT P0`,
      `SHELTER CAPACITY ${pct}%`,
      "AMBULANCE LAYER: SIMULATED",
    ],
  };
}

export function clock(): string {
  return new Date().toISOString().slice(11, 16);
}

export type { SourceState };
