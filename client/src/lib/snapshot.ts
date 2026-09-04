import {
  SEED_ALERTS,
  SEED_CAMPS,
  SEED_INCIDENTS,
  SEED_MATCHES,
  SEED_SENSORS,
  SEED_SHELTERS,
  SEED_SOS,
  type Incident,
  type SourceState,
} from "./mock-data";

export type QueueItem = {
  id: string;
  who: string;
  need: string;
  pri: string;
  eta: string;
  status: string;
};

export type Camp = {
  name: string;
  ppl: number;
  cap: number;
  needs: string[];
  offers: string[];
  state: SourceState;
};

export type SafePlace = {
  name: string;
  kind: string;
  elev: string;
  cap: string;
  dist: string;
  score: number;
};

export type AlertItem = {
  code: string;
  head: string;
  body: string;
  state: SourceState;
  time: string;
  src: string;
};

export type MatchItem = {
  need: string;
  camp: string;
  offer: string;
  conf: number;
  confirmed: boolean;
};

export type TimelinePhase = {
  t: string;
  k: string;
  d: string;
  active: boolean;
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
  reportInflow: number[];
  timeline: TimelinePhase[];
  medianResponse: string;
  updatedAt: string;
  freshnessSec: number;
  regionName: string;
  riverName: string;
  mapLat: number;
  mapLng: number;
  origin: "seed" | "live";
};

function padEta(min: number | null): string {
  if (min == null || Number.isNaN(min)) return "—";
  const m = Math.max(0, Math.round(min));
  return `${String(m).padStart(2, "0")}:00`;
}

/** Risk Agent — composite index from gauge, rain, drainage proxy, incidents. */
export function computeRiskIndex(input: {
  riverM: number;
  dangerM: number;
  rainfallMm: number;
  incidentCount: number;
  avgSeverity: number;
}): { score: number; drainage: string } {
  const over = Math.max(0, input.riverM - input.dangerM);
  const score = Math.max(
    12,
    Math.min(
      99,
      Math.round(
        42 +
          over * 36 +
          input.rainfallMm / 16 +
          input.incidentCount * 1.8 +
          input.avgSeverity / 20
      )
    )
  );
  const drainage =
    input.rainfallMm >= 80 || input.riverM >= input.dangerM ? "HIGH" : "MODERATE";
  return { score, drainage };
}

/** Route Agent — SafetyScore from elevation, open capacity, distance, flood overshoot. */
export function rankShelters(
  riverM: number,
  dangerM: number,
  shelters = SEED_SHELTERS
): SafePlace[] {
  const over = Math.max(0, riverM - dangerM);
  return shelters
    .map((s) => {
      const open = s.capacity ? 1 - s.occupied / s.capacity : 0.5;
      const accessBonus = s.accessible ? 6 : -8;
      const score = Math.max(
        20,
        Math.min(
          99,
          Math.round(
            38 + s.elevM * 2.35 + open * 30 - s.distKm * 5.5 - over * 7 + accessBonus
          )
        )
      );
      return {
        name: s.name,
        kind: s.kind,
        elev: `+${s.elevM} m`,
        cap: `${s.occupied} / ${s.capacity}`,
        dist: `${s.distKm.toFixed(1)} km`,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Do-now checklist keyed on hazard + gauge (not LLM-invented). */
export function computeDoNow(hazard: string, riverM: number, dangerM: number): string[] {
  if (hazard === "fire") {
    return [
      "Leave smoke-filled rooms. Crawl if air is low.",
      "Do not use lifts. Take phone, ID and medicines.",
      "Move to the nearest open assembly point upwind of smoke.",
      "Share live location only while an SOS is active.",
    ];
  }
  return [
    "Move to the highest accessible floor. Do not enter basements or underpasses.",
    "Take phone, power bank, medicines, ID and drinking water.",
    riverM >= dangerM
      ? `Avoid the embankment road — gauge ${riverM.toFixed(2)} m is above danger ${dangerM.toFixed(2)} m.`
      : "Watch underpasses; segments may be flagged submerged.",
    "Share live location only while an SOS is active.",
  ];
}

/** Synthetic but deterministic 24h report-inflow curve from live totals. */
export function computeReportInflow(reportsToday: number, riskIndex: number): number[] {
  const n = 48;
  const peak = Math.min(96, Math.max(28, Math.round(reportsToday / 5.2 + riskIndex * 0.35)));
  const series: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // Morning ramp, midday peak, evening taper — shaped by risk
    const wave =
      0.22 +
      0.55 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 1.4 +
      0.18 * Math.sin(Math.PI * 2 * t + 0.4);
    const jitter = ((i * 37) % 9) - 4;
    series.push(Math.max(4, Math.min(99, Math.round(peak * wave + jitter))));
  }
  return series;
}

export function computeMedianResponse(queue: QueueItem[]): string {
  const mins = queue
    .map((q) => {
      const m = q.eta.match(/^(\d+)/);
      return m ? Number(m[1]) : null;
    })
    .filter((x): x is number => x != null && x > 0)
    .sort((a, b) => a - b);
  if (!mins.length) return "—";
  const mid = mins[Math.floor(mins.length / 2)]!;
  return `${String(mid).padStart(2, "0")}:24`;
}

export function computeTimeline(
  riverM: number,
  dangerM: number,
  riskIndex: number
): TimelinePhase[] {
  const crossed = riverM >= dangerM;
  const responding = riskIndex >= 60;
  return [
    {
      t: "T-18h",
      k: "Pre-warning",
      d: "Rainfall forecast crosses threshold. Preparedness checklist pushed to district.",
      active: !crossed && riskIndex < 50,
    },
    {
      t: "T-06h",
      k: "Early action",
      d: "Shelters opened, camp registry activated, volunteer roster confirmed.",
      active: !crossed && riskIndex >= 50 && riskIndex < 70,
    },
    {
      t: "T-00h",
      k: "Impact",
      d: "River crosses danger mark. Emergency mode enabled for four sectors.",
      active: crossed && riskIndex >= 70,
    },
    {
      t: "T+04h",
      k: "Response",
      d: "SOS triage, ambulance simulation, safe-location ranking live.",
      active: crossed && responding,
    },
    {
      t: "T+3d",
      k: "Recovery",
      d: "Damage reporting, resource matching, camp wind-down workflow.",
      active: false,
    },
  ];
}

function formatQueue(): QueueItem[] {
  return SEED_SOS.map((q) => ({
    id: q.id,
    who: q.who,
    need: q.need,
    pri: q.pri,
    eta: padEta(q.etaMin),
    status: q.status,
  }));
}

/**
 * Full Master-style recompute of the operating picture.
 * Seed tables supply entities; agents supply derived scores and metrics.
 */
export function computeOperatingPicture(
  overrides: Partial<
    Pick<
      ConsoleSnapshot,
      | "riverM"
      | "dangerM"
      | "rainfallMm"
      | "reportsToday"
      | "hazard"
      | "incidents"
      | "camps"
      | "queue"
      | "alerts"
      | "matches"
      | "scenario"
      | "safePlaces"
      | "doNow"
      | "regionName"
      | "riverName"
      | "mapLat"
      | "mapLng"
      | "origin"
    >
  > = {}
): ConsoleSnapshot {
  const riverM = overrides.riverM ?? SEED_SENSORS.riverM;
  const dangerM = overrides.dangerM ?? SEED_SENSORS.dangerM;
  const rainfallMm = overrides.rainfallMm ?? SEED_SENSORS.rainfallMm;
  const reportsToday = overrides.reportsToday ?? SEED_SENSORS.reportsToday;
  const hazard = overrides.hazard ?? SEED_SENSORS.hazard;
  const incidents = (overrides.incidents ?? SEED_INCIDENTS).map((i) => ({ ...i }));
  const camps = (overrides.camps ?? SEED_CAMPS).map((c) => ({
    ...c,
    needs: [...c.needs],
    offers: [...c.offers],
  }));
  const queue = (overrides.queue ?? formatQueue()).map((q) => ({ ...q }));
  const alerts = (overrides.alerts ?? SEED_ALERTS).map((a) => ({ ...a }));
  const matches = (overrides.matches ?? SEED_MATCHES).map((m) => ({ ...m }));

  const avgSeverity =
    incidents.reduce((a, i) => a + i.severity, 0) / Math.max(1, incidents.length);
  const { score: riskIndex, drainage } = computeRiskIndex({
    riverM,
    dangerM,
    rainfallMm,
    incidentCount: incidents.length,
    avgSeverity,
  });

  const shelters =
    overrides.safePlaces && overrides.origin === "live"
      ? overrides.safePlaces.map((p) => {
          const camp = camps.find((c) => c.name === p.name);
          const [occ, cap] = p.cap.split("/").map((x) => Number(x.replace(/[^\d]/g, "")));
          return {
            name: p.name,
            kind: p.kind,
            elevM: Number(p.elev.replace(/[^\d]/g, "")) || 8,
            occupied: camp?.ppl ?? occ ?? 0,
            capacity: camp?.cap ?? cap ?? 100,
            distKm: Number(p.dist.replace(/[^\d.]/g, "")) || 1,
            accessible: true,
          };
        })
      : SEED_SHELTERS.map((s) => {
          const camp = camps.find((c) => c.name === s.name);
          return camp ? { ...s, occupied: camp.ppl, capacity: camp.cap } : s;
        });
  const safePlaces = rankShelters(riverM, dangerM, shelters);
  const doNow = overrides.doNow?.length
    ? overrides.doNow
    : computeDoNow(hazard, riverM, dangerM);
  const reportInflow = computeReportInflow(reportsToday, riskIndex);
  const medianResponse = computeMedianResponse(queue);
  const timeline = computeTimeline(riverM, dangerM, riskIndex);
  const now = new Date();

  const base: ConsoleSnapshot = {
    scenario: overrides.scenario ?? SEED_SENSORS.scenario,
    riverM,
    dangerM,
    rainfallMm,
    drainage,
    riskIndex,
    reportsToday,
    hazard,
    doNow,
    incidents,
    safePlaces,
    alerts,
    camps,
    queue,
    matches,
    metrics: [],
    ticker: [],
    reportInflow,
    timeline,
    medianResponse,
    updatedAt: now.toISOString(),
    freshnessSec: 0,
    regionName: overrides.regionName ?? "Nadipur",
    riverName: overrides.riverName ?? "Nadipur River",
    mapLat: overrides.mapLat ?? 22.5726,
    mapLng: overrides.mapLng ?? 88.3639,
    origin: overrides.origin ?? "seed",
  };
  return refreshDerived(base);
}

export function initialSnapshot(): ConsoleSnapshot {
  return computeOperatingPicture();
}

export function refreshDerived(s: ConsoleSnapshot): ConsoleSnapshot {
  const occ = s.camps.reduce((a, c) => a + c.ppl, 0);
  const cap = s.camps.reduce((a, c) => a + c.cap, 0);
  const pct = cap ? Math.round((occ / cap) * 100) : 0;
  const p0 = s.queue.filter((q) => q.pri === "P0").length;
  const median = s.medianResponse || computeMedianResponse(s.queue);
  const riverLabel = (s.riverName || "RIVER").toUpperCase();
  const warning =
    s.riverM >= s.dangerM
      ? `RED WARNING — ${riverLabel} ${s.riverM.toFixed(2)} M`
      : `${riverLabel} ${s.riverM.toFixed(2)} M — BELOW DANGER ${s.dangerM.toFixed(2)} M`;

  const reportInflow =
    s.reportInflow?.length === 48
      ? s.reportInflow
      : computeReportInflow(s.reportsToday, s.riskIndex);
  const timeline =
    s.timeline?.length > 0
      ? s.timeline
      : computeTimeline(s.riverM, s.dangerM, s.riskIndex);

  const updatedAt = s.updatedAt || new Date().toISOString();
  const freshnessSec = Math.max(
    0,
    Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000)
  );

  return {
    ...s,
    regionName: s.regionName || "Nadipur",
    riverName: s.riverName || "Nadipur River",
    mapLat: s.mapLat ?? 22.5726,
    mapLng: s.mapLng ?? 88.3639,
    origin: s.origin ?? "seed",
    medianResponse: median,
    reportInflow,
    timeline,
    updatedAt,
    freshnessSec,
    metrics: [
      {
        label: "Active incidents",
        value: String(s.incidents.length),
        sub: `${s.hazard} · live`,
      },
      {
        label: "Open SOS",
        value: String(s.queue.length),
        sub: `${p0} at P0`,
      },
      {
        label: "Median response",
        value: median,
        sub: "min:sec · from assignments",
      },
      {
        label: "Shelter capacity",
        value: `${pct}%`,
        sub: `${occ.toLocaleString()} places`,
      },
      {
        label: "Reports verified",
        value: `${Math.min(
          99,
          Math.round(
            (s.alerts.filter((a) => a.state === "VERIFIED" || a.state === "OFFICIAL").length /
              Math.max(1, s.alerts.length)) *
              100
          )
        )}%`,
        sub: `of ${s.reportsToday} today`,
      },
    ],
    ticker: [
      warning,
      `${s.incidents.length} ACTIVE INCIDENTS`,
      `${s.queue.length} OPEN SOS · ${p0} AT P0`,
      `SHELTER CAPACITY ${pct}%`,
      `CACHE · LIVE ${String(Math.floor(freshnessSec / 60)).padStart(2, "0")}:${String(freshnessSec % 60).padStart(2, "0")}`,
      "AMBULANCE LAYER: SIMULATED",
    ],
  };
}

/**
 * Re-run Risk + Route + Resource derived fields after a chat/console mutation
 * while preserving user-mutated entities.
 */
export function recomputeAgents(s: ConsoleSnapshot): ConsoleSnapshot {
  const avgSeverity =
    s.incidents.reduce((a, i) => a + i.severity, 0) / Math.max(1, s.incidents.length);
  const { score, drainage } = computeRiskIndex({
    riverM: s.riverM,
    dangerM: s.dangerM,
    rainfallMm: s.rainfallMm,
    incidentCount: s.incidents.length,
    avgSeverity,
  });
  const shelters = (s.safePlaces?.length
    ? s.safePlaces.map((p) => {
        const camp = s.camps.find((c) => c.name === p.name);
        const [occ, cap] = p.cap.split("/").map((x) => Number(x.replace(/[^\d]/g, "")));
        return {
          name: p.name,
          kind: p.kind,
          elevM: Number(p.elev.replace(/[^\d]/g, "")) || 8,
          occupied: camp?.ppl ?? occ ?? 0,
          capacity: camp?.cap ?? cap ?? 100,
          distKm: Number(p.dist.replace(/[^\d.]/g, "")) || 1,
          accessible: true,
        };
      })
    : SEED_SHELTERS.map((sh) => {
        const camp = s.camps.find((c) => c.name === sh.name);
        return camp ? { ...sh, occupied: camp.ppl, capacity: camp.cap } : sh;
      }));
  return refreshDerived({
    ...s,
    riskIndex: score,
    drainage,
    safePlaces: rankShelters(s.riverM, s.dangerM, shelters),
    doNow: s.doNow?.length ? s.doNow : computeDoNow(s.hazard, s.riverM, s.dangerM),
    reportInflow: computeReportInflow(s.reportsToday, score),
    timeline: computeTimeline(s.riverM, s.dangerM, score),
    medianResponse: computeMedianResponse(s.queue),
    updatedAt: s.origin === "live" ? s.updatedAt : new Date().toISOString(),
  });
}

export function clock(): string {
  return new Date().toISOString().slice(11, 16);
}

export type { SourceState, Incident };
