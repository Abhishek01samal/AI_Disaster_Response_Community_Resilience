export type SourceState = "OFFICIAL" | "VERIFIED" | "COMMUNITY" | "AI SIGNAL" | "STALE";

export type Incident = {
  id: string;
  type: string;
  zone: string;
  severity: number; // 0-100
  reports: number;
  state: SourceState;
  updated: string;
  x: number; // % position on map
  y: number;
};

export const incidents: Incident[] = [
  { id: "INC-0412", type: "Flood / river breach", zone: "Sector 04 — Nadipur", severity: 92, reports: 148, state: "OFFICIAL", updated: "00:02", x: 28, y: 34 },
  { id: "INC-0418", type: "Road submerged", zone: "NH-19 Underpass", severity: 71, reports: 37, state: "VERIFIED", updated: "00:06", x: 54, y: 22 },
  { id: "INC-0423", type: "Power line down", zone: "Sector 11 — Bazar", severity: 58, reports: 22, state: "COMMUNITY", updated: "00:11", x: 68, y: 58 },
  { id: "INC-0429", type: "Structure at risk", zone: "Riverfront Block C", severity: 84, reports: 61, state: "AI SIGNAL", updated: "00:14", x: 40, y: 68 },
  { id: "INC-0431", type: "Drainage overflow", zone: "Sector 07 — Old Town", severity: 44, reports: 12, state: "STALE", updated: "01:52", x: 79, y: 40 },
];

export const safePlaces = [
  { name: "Municipal High School", kind: "Shelter", elev: "+14 m", cap: "220 / 400", dist: "0.8 km", score: 94 },
  { name: "Grain Depot Hall", kind: "Shelter", elev: "+11 m", cap: "180 / 250", dist: "1.4 km", score: 88 },
  { name: "District Hospital Annexe", kind: "Medical", elev: "+9 m", cap: "40 / 60", dist: "2.1 km", score: 79 },
  { name: "Community Centre East", kind: "Shelter", elev: "+7 m", cap: "310 / 320", dist: "2.6 km", score: 61 },
];

export const alerts = [
  { code: "ALT-77", head: "Red warning — river above danger mark", body: "Nadipur gauge at 8.42 m, danger mark 8.00 m. Evacuation advised for low-lying blocks A–D.", state: "OFFICIAL" as SourceState, time: "07:12", src: "State Disaster Authority" },
  { code: "ALT-78", head: "Heavy rainfall continuing 6 hours", body: "120–160 mm expected. Avoid underpasses and river embankment routes.", state: "OFFICIAL" as SourceState, time: "07:40", src: "Meteorological Dept." },
  { code: "ALT-81", head: "Cluster of reports: water entering ground floors", body: "38 community reports clustered within 400 m. Awaiting field confirmation.", state: "AI SIGNAL" as SourceState, time: "08:03", src: "Report clustering" },
  { code: "ALT-83", head: "Camp capacity approaching limit", body: "Community Centre East at 97% capacity. Redirect intake to Grain Depot Hall.", state: "VERIFIED" as SourceState, time: "08:21", src: "Relief operator" },
];

export const camps = [
  { name: "Municipal High School", ppl: 220, cap: 400, needs: ["Blankets", "Drinking water"], offers: ["Cooked meals"], state: "VERIFIED" as SourceState },
  { name: "Grain Depot Hall", ppl: 180, cap: 250, needs: ["Medicines", "Baby food"], offers: ["Dry rations", "Volunteers"], state: "OFFICIAL" as SourceState },
  { name: "Community Centre East", ppl: 310, cap: 320, needs: ["Space", "Sanitation"], offers: [], state: "VERIFIED" as SourceState },
  { name: "Ward 9 Temple Hall", ppl: 64, cap: 150, needs: ["Bedding"], offers: ["Transport", "Charging point"], state: "COMMUNITY" as SourceState },
];

export const responseQueue = [
  { id: "SOS-2201", who: "Household · 4 persons", need: "Trapped, ground floor", pri: "P0", eta: "06:20", status: "UNIT ASSIGNED" },
  { id: "SOS-2204", who: "Individual · elderly", need: "Medical — dialysis", pri: "P0", eta: "11:05", status: "AMBULANCE EN ROUTE" },
  { id: "SOS-2209", who: "Group · 12 persons", need: "Stranded on roof", pri: "P1", eta: "18:40", status: "QUEUED" },
  { id: "SOS-2213", who: "Individual", need: "Missing family member", pri: "P2", eta: "—", status: "TRIAGE" },
];

export const metrics = [
  { label: "Active incidents", value: "18", sub: "+4 / 60 min" },
  { label: "Open SOS", value: "37", sub: "9 at P0" },
  { label: "Median response", value: "07:24", sub: "min:sec" },
  { label: "Shelter capacity", value: "68%", sub: "1 130 places" },
  { label: "Reports verified", value: "82%", sub: "of 412 today" },
];

export const bounce = [
  12, 18, 24, 21, 33, 41, 38, 46, 52, 49, 61, 58, 66, 72, 69, 78, 74, 83, 88, 84, 91, 86, 79, 72,
  68, 61, 57, 63, 70, 76, 81, 74, 66, 59, 52, 47, 41, 38, 33, 28, 24, 21, 18, 15, 13, 11, 9, 8,
];
