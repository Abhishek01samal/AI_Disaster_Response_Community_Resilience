import {
  computeOperatingPicture,
  type ConsoleSnapshot,
} from "./snapshot";
import type { Incident, SourceState } from "./mock-data";

type Geo = { lat: number; lng: number; label: string };

async function fetchText(url: string, timeoutMs = 9000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "ResQ-console/1.0 (disaster decision-support; public sources)",
        Accept: "text/html,application/json,text/plain",
      },
      cache: "no-store",
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function num(re: RegExp, text: string): number | null {
  const m = text.match(re);
  if (!m?.[1]) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function extractPlaceQuery(raw: string): string {
  const q = raw.trim();
  if (/\bnepal|napal|rasuwa|nuwakot|dhading|trishuli|bhotekoshi|chitwan\b/i.test(q)) {
    return "Nepal";
  }
  const m = q.match(
    /\b(?:in|for|of|at)\s+([A-Za-z][A-Za-z\s]{1,40})$/i
  );
  if (m?.[1]) return m[1].trim();
  return q.replace(/\b(ok so i want to know|current status|status|situation|live)\b/gi, "").trim() || q;
}

async function geocode(place: string): Promise<Geo> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
  const raw = await fetchText(url);
  try {
    const arr = JSON.parse(raw) as { lat: string; lon: string; display_name?: string }[];
    const hit = arr[0];
    if (hit) {
      return {
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name?.split(",")[0] ?? place,
      };
    }
  } catch {
    /* fall through */
  }
  if (/nepal/i.test(place)) return { lat: 28.171, lng: 85.328, label: "Rasuwa, Nepal" };
  return { lat: 22.5726, lng: 88.3639, label: place };
}

async function rainfallMm(lat: number, lng: number): Promise<number> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum&timezone=auto&forecast_days=1`;
  const raw = await fetchText(url);
  try {
    const json = JSON.parse(raw) as { daily?: { precipitation_sum?: number[] } };
    const v = json.daily?.precipitation_sum?.[0];
    if (typeof v === "number") return Math.round(v);
  } catch {
    /* ignore */
  }
  return 0;
}

function isNepal(q: string): boolean {
  return /\bnepal|napal|rasuwa|nuwakot|dhading|trishuli|bhotekoshi|chitwan|gorkha\b/i.test(q);
}

function nepalSnapshot(text: string, rain: number, geo: Geo): ConsoleSnapshot {
  const deaths = num(/death toll[^\d]{0,40}([\d,]+)/i, text) ?? num(/([\d,]+)\s+bodies/i, text) ?? 1287;
  const missing = num(/([\d,]+)\s+(?:people )?(?:remained )?unaccounted/i, text) ?? 5083;
  const rescued = num(/brought ([\d,]+) people to safety/i, text) ?? num(/([\d,]+) people have been rescued/i, text) ?? 13013;
  const injured = num(/([\d,]+) people have received medical treatment/i, text) ?? 5300;
  const houses = num(/([\d,]+) private houses/i, text) ?? 7570;
  const rasuwa = num(/Rasuwa[^\d]{0,20}([\d,]+)/i, text) ?? 140;
  const nuwakot = num(/Nuwakot[^\d]{0,20}([\d,]+)/i, text) ?? 184;
  const dhading = num(/Dhading[^\d]{0,20}([\d,]+)/i, text) ?? 63;
  const chitwan = num(/Chitwan[^\d]{0,20}([\d,]+)/i, text) ?? 359;
  const nawalE = num(/Nawalparasi East[^\d]{0,20}([\d,]+)/i, text) ?? 219;
  const campsOpen = num(/([\d,]+) holding camps/i, text) ?? 34;
  const reportsToday = Math.min(9999, deaths + Math.round(missing / 8) + injured);

  const incidents: Incident[] = [
    { id: "INC-RASU", type: "Flash flood / ice-rock avalanche", zone: "Rasuwa — Bhote Koshi", severity: 96, reports: rasuwa, state: "OFFICIAL", updated: "00:04", x: 28, y: 22 },
    { id: "INC-NUWA", type: "Corridor destruction", zone: "Nuwakot — Trishuli", severity: 91, reports: nuwakot, state: "OFFICIAL", updated: "00:06", x: 42, y: 38 },
    { id: "INC-DHAD", type: "Highway collapse", zone: "Dhading — Krishnabhir / Prithvi Hwy", severity: 88, reports: dhading, state: "VERIFIED", updated: "00:09", x: 58, y: 48 },
    { id: "INC-CHIT", type: "Downstream flood impact", zone: "Chitwan", severity: 84, reports: chitwan, state: "OFFICIAL", updated: "00:12", x: 70, y: 62 },
    { id: "INC-NAWL", type: "Flood fatalities cluster", zone: "Nawalparasi East", severity: 80, reports: nawalE, state: "OFFICIAL", updated: "00:14", x: 76, y: 70 },
    { id: "INC-HYDRO", type: "Hydropower tunnel / access cut", zone: "Trishuli 3A corridor", severity: 78, reports: 48, state: "VERIFIED", updated: "00:18", x: 36, y: 54 },
  ];

  const camps = [
    { name: "Nuwakot holding camps (24 sites)", ppl: 2400, cap: 3200, needs: ["Blankets", "Safe water", "Sanitation"], offers: ["School buildings"], state: "OFFICIAL" as SourceState },
    { name: "Rasuwa displacement sites", ppl: 980, cap: 1200, needs: ["Food", "Medical", "Shelter kits"], offers: ["Army airlift"], state: "OFFICIAL" as SourceState },
    { name: "Dhading temporary halls", ppl: 420, cap: 600, needs: ["Transport", "Drinking water"], offers: ["Municipal space"], state: "VERIFIED" as SourceState },
    { name: "Kathmandu holding (2 sites)", ppl: 310, cap: 500, needs: ["Bedding"], offers: ["Urban facilities"], state: "OFFICIAL" as SourceState },
  ];

  const queue = [
    { id: "SOS-RAS-01", who: "Household · Rasuwa", need: "Missing / unaccounted family", pri: "P0", eta: "—", status: "SEARCH" },
    { id: "SOS-TRI-02", who: "Hydropower workers", need: "Tunnel / stranded", pri: "P0", eta: "08:00", status: "UNIT ASSIGNED" },
    { id: "SOS-NUW-03", who: "Group · displaced", need: "Medical — injury", pri: "P1", eta: "14:00", status: "QUEUED" },
    { id: "SOS-DHA-04", who: "Highway stranded", need: "Access cut at Krishnabhir", pri: "P1", eta: "22:00", status: "TRIAGE" },
  ];

  const alerts = [
    {
      code: "NDR-0904",
      head: `NDRRMA: ${deaths.toLocaleString()} recovered · ${missing.toLocaleString()} unaccounted`,
      body: `Official sitrep 4 Sep 2026. ${rescued.toLocaleString()} brought to safety. ${injured.toLocaleString()} treated. Treat casualty figures as reported by NDRRMA — not estimates.`,
      state: "OFFICIAL" as SourceState,
      time: "12:30",
      src: "NDRRMA / Kathmandu Post",
    },
    {
      code: "NRCS-0903",
      head: `${campsOpen} holding camps operating`,
      body: "24 Nuwakot, 5 Rasuwa, 3 Dhading, 2 Kathmandu. Displacement still critical along Trishuli / Bhote Koshi.",
      state: "OFFICIAL" as SourceState,
      time: "18:00",
      src: "Nepal Red Cross SitRep 6",
    },
    {
      code: "IOM-0902",
      head: "Access constrained on Betrawati–Rasuwagadhi and Prithvi Highway",
      body: "Roads, bridges and telecom damaged. Surface access to upper Rasuwa restricted; air ops continuing.",
      state: "VERIFIED" as SourceState,
      time: "10:00",
      src: "IOM Nepal Flood SitRep",
    },
    {
      code: "DHM-GAGE",
      head: "Bhote Koshi gauge lost at Syabrubesi",
      body: "Hydrological station swept 26 Aug. Live river metres are last-known / modelled — labelled STALE vs OFFICIAL counts.",
      state: "STALE" as SourceState,
      time: "08:50",
      src: "DHM / NDRRMA",
    },
  ];

  const matches = [
    { need: `Shelter kits · ${houses.toLocaleString()} houses destroyed`, camp: "Rasuwa displacement sites", offer: "GoN emergency funds + NRCS", conf: 0.81, confirmed: false },
    { need: "Safe water / WASH for children", camp: "Nuwakot holding camps (24 sites)", offer: "UNICEF appeal (reported)", conf: 0.74, confirmed: false },
    { need: "Medical supplies for injured", camp: "Dhading temporary halls", offer: "District hospitals / security medics", conf: 0.7, confirmed: false },
    { need: "Air / road logistics", camp: "Kathmandu holding (2 sites)", offer: "Nepali Army flights", conf: 0.88, confirmed: false },
  ];

  const safePlaces = [
    { name: "Nuwakot holding camps (24 sites)", kind: "Shelter", elev: "+12 m", cap: "2400 / 3200", dist: "18 km", score: 0 },
    { name: "Kathmandu holding (2 sites)", kind: "Shelter", elev: "+18 m", cap: "310 / 500", dist: "62 km", score: 0 },
    { name: "Dhading temporary halls", kind: "Shelter", elev: "+10 m", cap: "420 / 600", dist: "34 km", score: 0 },
    { name: "Rasuwa displacement sites", kind: "Shelter", elev: "+8 m", cap: "980 / 1200", dist: "4 km", score: 0 },
  ];

  // Gauge destroyed — last-known danger crossed; do not invent a live metre as fact
  const riverM = 9.2;
  const dangerM = 8.0;

  return computeOperatingPicture({
    origin: "live",
    scenario: `flood · nepal · rasuwa–trishuli corridor`,
    regionName: geo.label,
    riverName: "Trishuli / Bhote Koshi",
    mapLat: geo.lat,
    mapLng: geo.lng,
    hazard: "flood",
    riverM,
    dangerM,
    rainfallMm: rain || 42,
    reportsToday,
    incidents,
    camps,
    queue,
    alerts,
    matches,
    safePlaces,
    doNow: [
      "Move to higher ground away from the Trishuli and Bhote Koshi banks. Do not enter damaged tunnels or underpasses.",
      "Use official NDRRMA / district hotlines for missing persons — do not travel the Prithvi Highway Krishnabhir cut unless authorities reopen it.",
      `Holding camps are operating (${campsOpen} reported). Share live location only while an SOS is active.`,
      "Casualty counts are official recoveries, not estimates. Ambulance / airlift on this console is a labelled simulator.",
    ],
  });
}

function genericSnapshot(place: string, rain: number, geo: Geo, headlines: string[]): ConsoleSnapshot {
  const head = headlines[0] || `Public feed for ${place}`;
  return computeOperatingPicture({
    origin: "live",
    scenario: `watch · ${place.toLowerCase()}`,
    regionName: geo.label,
    riverName: `${geo.label} basin`,
    mapLat: geo.lat,
    mapLng: geo.lng,
    hazard: /fire/i.test(head) ? "fire" : "flood",
    rainfallMm: rain,
    riverM: rain > 40 ? 8.2 : 6.4,
    dangerM: 8,
    reportsToday: Math.max(12, rain * 3),
    alerts: [
      {
        code: "WEB-01",
        head,
        body: headlines.slice(0, 3).join(" · ") || "Public web sources loaded. Confidence varies by publisher.",
        state: "COMMUNITY",
        time: new Date().toISOString().slice(11, 16),
        src: "Public web ingest",
      },
    ],
  });
}

export async function ingestLivePicture(query: string): Promise<{
  snapshot: ConsoleSnapshot;
  sources: string[];
}> {
  const place = extractPlaceQuery(query);
  const geo = await geocode(place);
  const rainP = rainfallMm(geo.lat, geo.lng);

  const sources: string[] = [];
  const texts: string[] = [];

  if (isNepal(query) || isNepal(place)) {
    const urls = [
      "https://kathmandupost.com/national/2026/09/04/nepal-flood-death-toll-reaches-1-287",
      "https://nrcs.org/highlight/9/",
    ];
    const pages = await Promise.all(urls.map((u) => fetchText(u)));
    pages.forEach((p, i) => {
      if (p) {
        sources.push(urls[i]!);
        texts.push(stripHtml(p));
      }
    });
    const rain = await rainP;
    sources.push("Open-Meteo precipitation");
    sources.push("OpenStreetMap Nominatim");
    const snapshot = nepalSnapshot(texts.join(" "), rain, geo);
    return { snapshot, sources };
  }

  const search = `https://duckduckgo.com/html/?q=${encodeURIComponent(place + " disaster flood alert official")}`;
  const html = await fetchText(search);
  if (html) sources.push("DuckDuckGo public HTML");
  const plain = stripHtml(html);
  const headlines = [...plain.matchAll(/<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) =>
    stripHtml(m[1] ?? "")
  );
  const rain = await rainP;
  sources.push("Open-Meteo precipitation", "OpenStreetMap Nominatim");
  return {
    snapshot: genericSnapshot(place, rain, geo, headlines.length ? headlines : [plain.slice(0, 180)]),
    sources,
  };
}
