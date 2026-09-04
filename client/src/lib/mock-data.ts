/**
 * Seed inputs for the Nadipur flood scenario.
 * The console never renders these constants directly — operating-picture.ts
 * recomputes risk, rankings, metrics, chart series and guidance from them.
 */
export type SourceState = "OFFICIAL" | "VERIFIED" | "COMMUNITY" | "AI SIGNAL" | "STALE";

export type Incident = {
  id: string;
  type: string;
  zone: string;
  severity: number;
  reports: number;
  state: SourceState;
  updated: string;
  x: number;
  y: number;
};

export type ShelterSeed = {
  name: string;
  kind: string;
  elevM: number;
  occupied: number;
  capacity: number;
  distKm: number;
  accessible: boolean;
};

export type CampSeed = {
  name: string;
  ppl: number;
  cap: number;
  needs: string[];
  offers: string[];
  state: SourceState;
};

export type SosSeed = {
  id: string;
  who: string;
  need: string;
  pri: "P0" | "P1" | "P2";
  etaMin: number | null;
  status: string;
  assignedAtMinAgo?: number;
};

export type AlertSeed = {
  code: string;
  head: string;
  body: string;
  state: SourceState;
  time: string;
  src: string;
};

export type MatchSeed = {
  need: string;
  camp: string;
  offer: string;
  conf: number;
  confirmed: boolean;
};

/** Live sensor / authority inputs (Tier-2 style). */
export const SEED_SENSORS = {
  scenario: "flood · district nadipur",
  riverM: 8.42,
  dangerM: 8.0,
  rainfallMm: 141,
  reportsToday: 412,
  hazard: "flood" as const,
  region: "Nadipur",
};

export const SEED_INCIDENTS: Incident[] = [
  { id: "INC-0412", type: "Flood / river breach", zone: "Sector 04 — Nadipur", severity: 92, reports: 148, state: "OFFICIAL", updated: "00:02", x: 28, y: 34 },
  { id: "INC-0418", type: "Road submerged", zone: "NH-19 Underpass", severity: 71, reports: 37, state: "VERIFIED", updated: "00:06", x: 54, y: 22 },
  { id: "INC-0423", type: "Power line down", zone: "Sector 11 — Bazar", severity: 58, reports: 22, state: "COMMUNITY", updated: "00:11", x: 68, y: 58 },
  { id: "INC-0429", type: "Structure at risk", zone: "Riverfront Block C", severity: 84, reports: 61, state: "AI SIGNAL", updated: "00:14", x: 40, y: 68 },
  { id: "INC-0431", type: "Drainage overflow", zone: "Sector 07 — Old Town", severity: 44, reports: 12, state: "STALE", updated: "01:52", x: 79, y: 40 },
];

export const SEED_SHELTERS: ShelterSeed[] = [
  { name: "Municipal High School", kind: "Shelter", elevM: 14, occupied: 220, capacity: 400, distKm: 0.8, accessible: true },
  { name: "Grain Depot Hall", kind: "Shelter", elevM: 11, occupied: 180, capacity: 250, distKm: 1.4, accessible: true },
  { name: "District Hospital Annexe", kind: "Medical", elevM: 9, occupied: 40, capacity: 60, distKm: 2.1, accessible: true },
  { name: "Community Centre East", kind: "Shelter", elevM: 7, occupied: 310, capacity: 320, distKm: 2.6, accessible: false },
];

export const SEED_ALERTS: AlertSeed[] = [
  { code: "ALT-77", head: "Red warning — river above danger mark", body: "Nadipur gauge at 8.42 m, danger mark 8.00 m. Evacuation advised for low-lying blocks A–D.", state: "OFFICIAL", time: "07:12", src: "State Disaster Authority" },
  { code: "ALT-78", head: "Heavy rainfall continuing 6 hours", body: "120–160 mm expected. Avoid underpasses and river embankment routes.", state: "OFFICIAL", time: "07:40", src: "Meteorological Dept." },
  { code: "ALT-81", head: "Cluster of reports: water entering ground floors", body: "38 community reports clustered within 400 m. Awaiting field confirmation.", state: "AI SIGNAL", time: "08:03", src: "Report clustering" },
  { code: "ALT-83", head: "Camp capacity approaching limit", body: "Community Centre East at 97% capacity. Redirect intake to Grain Depot Hall.", state: "VERIFIED", time: "08:21", src: "Relief operator" },
];

export const SEED_CAMPS: CampSeed[] = [
  { name: "Municipal High School", ppl: 220, cap: 400, needs: ["Blankets", "Drinking water"], offers: ["Cooked meals"], state: "VERIFIED" },
  { name: "Grain Depot Hall", ppl: 180, cap: 250, needs: ["Medicines", "Baby food"], offers: ["Dry rations", "Volunteers"], state: "OFFICIAL" },
  { name: "Community Centre East", ppl: 310, cap: 320, needs: ["Space", "Sanitation"], offers: [], state: "VERIFIED" },
  { name: "Ward 9 Temple Hall", ppl: 64, cap: 150, needs: ["Bedding"], offers: ["Transport", "Charging point"], state: "COMMUNITY" },
];

export const SEED_SOS: SosSeed[] = [
  { id: "SOS-2201", who: "Household · 4 persons", need: "Trapped, ground floor", pri: "P0", etaMin: 6, status: "UNIT ASSIGNED", assignedAtMinAgo: 14 },
  { id: "SOS-2204", who: "Individual · elderly", need: "Medical — dialysis", pri: "P0", etaMin: 11, status: "AMBULANCE EN ROUTE", assignedAtMinAgo: 8 },
  { id: "SOS-2209", who: "Group · 12 persons", need: "Stranded on roof", pri: "P1", etaMin: 19, status: "QUEUED" },
  { id: "SOS-2213", who: "Individual", need: "Missing family member", pri: "P2", etaMin: null, status: "TRIAGE" },
];

export const SEED_MATCHES: MatchSeed[] = [
  { need: "Blankets · 120 units", camp: "Municipal High School", offer: "Ward 4 Volunteer Group", conf: 0.92, confirmed: false },
  { need: "Medicines · insulin cold chain", camp: "Grain Depot Hall", offer: "District Pharmacy Assoc.", conf: 0.81, confirmed: false },
  { need: "Sanitation units · 6", camp: "Community Centre East", offer: "Municipal Works", conf: 0.74, confirmed: false },
  { need: "Baby food · 40 kg", camp: "Grain Depot Hall", offer: "Relief Trust South", conf: 0.68, confirmed: false },
];

/** @deprecated Use seed + operating-picture. Kept so older imports compile during migration. */
export const incidents = SEED_INCIDENTS;
export const safePlaces = SEED_SHELTERS.map((s) => ({
  name: s.name,
  kind: s.kind,
  elev: `+${s.elevM} m`,
  cap: `${s.occupied} / ${s.capacity}`,
  dist: `${s.distKm} km`,
  score: 0,
}));
export const alerts = SEED_ALERTS;
export const camps = SEED_CAMPS;
export const responseQueue = SEED_SOS.map((q) => ({
  id: q.id,
  who: q.who,
  need: q.need,
  pri: q.pri,
  eta: q.etaMin != null ? String(q.etaMin).padStart(2, "0") + ":00" : "—",
  status: q.status,
}));
export const metrics: { label: string; value: string; sub: string }[] = [];
export const bounce: number[] = [];
