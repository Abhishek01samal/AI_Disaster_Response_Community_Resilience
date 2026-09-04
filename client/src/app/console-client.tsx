"use client";

import { useState } from "react";
import { toast, Toaster } from "sonner";
import { Page, Section, Tag } from "@/components/site/shell";
import type { AuthUser } from "@/lib/auth";
import { bounce } from "@/lib/mock-data";
import { confirmMatchAction, submitReportAction, submitSosAction } from "@/lib/ops";
import { SituationProvider, useSituation } from "@/lib/situation-context";
import { refreshDerived } from "@/lib/snapshot";

const NADIPUR = { lat: 22.5726, lng: 88.3639 };

const SOS_TYPES = [
  { id: "TRAPPED", label: "Trapped" },
  { id: "MEDICAL", label: "Medical" },
  { id: "FLOOD", label: "Flooded" },
  { id: "FIRE", label: "Fire" },
  { id: "MISSING_PERSON", label: "Missing person" },
  { id: "OTHER", label: "Other" },
] as const;

const LAYERS = ["Hazard", "Routes", "Shelters", "SOS", "Ambulance", "Reports"];
const timeline = [
  { t: "T-18h", k: "Pre-warning", d: "Rainfall forecast crosses threshold. Preparedness checklist pushed to district." },
  { t: "T-06h", k: "Early action", d: "Shelters opened, camp registry activated, volunteer roster confirmed." },
  { t: "T-00h", k: "Impact", d: "River crosses danger mark. Emergency mode enabled for four sectors." },
  { t: "T+04h", k: "Response", d: "SOS triage, ambulance simulation, safe-location ranking live." },
  { t: "T+3d", k: "Recovery", d: "Damage reporting, resource matching, camp wind-down workflow." },
];

function Bars() {
  return (
    <div className="flex h-24 items-end gap-[2px]">
      {bounce.map((v, i) => (
        <span
          key={i}
          className="w-full bg-foreground/80"
          style={{ height: `${Math.max(6, v)}%` }}
        />
      ))}
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 68;
  const c = Math.PI * r;
  return (
    <svg viewBox="0 0 160 92" className="w-full">
      <path
        d={`M 12 84 A ${r} ${r} 0 0 1 148 84`}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="10"
      />
      <path
        d={`M 12 84 A ${r} ${r} 0 0 1 148 84`}
        fill="none"
        stroke="var(--color-foreground)"
        strokeWidth="10"
        strokeDasharray={`${(value / 100) * c} ${c}`}
      />
      <text
        x="80"
        y="80"
        textAnchor="middle"
        className="fill-foreground font-mono"
        fontSize="30"
      >
        {value}
      </text>
    </svg>
  );
}

export default function ConsoleClient({ user }: { user: AuthUser | null }) {
  return (
    <SituationProvider>
      <ConsoleApp user={user} />
    </SituationProvider>
  );
}

function ConsoleApp({ user }: { user: AuthUser | null }) {
  const { snapshot, setSnapshot, runPrompt } = useSituation();
  const incidents = snapshot.incidents;
  const camps = snapshot.camps;
  const safePlaces = snapshot.safePlaces;
  const metrics = snapshot.metrics;
  const matches = snapshot.matches;

  const [activeLayers, setActiveLayers] = useState<string[]>(["Hazard", "Shelters", "SOS"]);
  const [sel, setSel] = useState(incidents[0]!.id);
  const selected = incidents.find((i) => i.id === sel) ?? incidents[0]!;
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosBusy, setSosBusy] = useState(false);
  const [sosType, setSosType] = useState<(typeof SOS_TYPES)[number]["id"]>("TRAPPED");
  const [people, setPeople] = useState(1);
  const [trapped, setTrapped] = useState(true);
  const [medical, setMedical] = useState(false);
  const [consent, setConsent] = useState(true);
  const [confirmBusy, setConfirmBusy] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [phase, setPhase] = useState(timeline[2]!.t);

  const queue = snapshot.queue;
  const feed = snapshot.alerts;

  const toggleLayer = (l: string) =>
    setActiveLayers((a) => (a.includes(l) ? a.filter((x) => x !== l) : [...a, l]));

  function enterEmergencyMode() {
    setEmergencyMode(true);
    setActiveLayers(["Hazard", "Shelters", "SOS", "Ambulance"]);
    document.getElementById("map")?.scrollIntoView({ behavior: "smooth" });
    setSosOpen(true);
  }

  async function locate(): Promise<{ lat: number; lng: number }> {
    if (!navigator.geolocation) return NADIPUR;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(NADIPUR),
        { enableHighAccuracy: true, timeout: 4000 }
      );
    });
  }

  async function sendSos() {
    setSosBusy(true);
    try {
      const loc = consent ? await locate() : NADIPUR;
      const result = await submitSosAction({
        emergencyType: sosType,
        peopleAffected: people,
        trapped,
        medicalHelpRequired: medical,
        locationConsent: consent,
        lat: loc.lat,
        lng: loc.lng,
      });
      const id = `SOS-${Date.now().toString().slice(-4)}`;
      const localId = result.sosId?.toUpperCase() ?? id;
      setSnapshot(
        refreshDerived({
          ...snapshot,
          queue: [
            {
              id: localId,
              who: `Household · ${people} persons`,
              need: SOS_TYPES.find((t) => t.id === sosType)?.label ?? sosType,
              pri: trapped || medical ? "P0" : "P2",
              eta: "—",
              status: "QUEUED",
            },
            ...snapshot.queue,
          ],
        })
      );
      if (!result.success) {
        toast.message(`SOS ${localId} queued locally`, {
          description: result.error ?? "Backend unreachable — simulator only.",
        });
      } else {
        toast.success(`SOS ${localId} queued · simulated ambulance layer`);
      }
      setSosOpen(false);
    } finally {
      setSosBusy(false);
    }
  }

  async function confirmMatch(need: string) {
    setConfirmBusy(need);
    try {
      const result = await confirmMatchAction(need, "CONFIRM");
      setSnapshot(
        refreshDerived({
          ...snapshot,
          matches: snapshot.matches.map((m) =>
            m.need === need ? { ...m, confirmed: true } : m
          ),
        })
      );
      toast.success(
        result.success
          ? "Match confirmed by human operator"
          : "Match confirmed on console (backend offline)"
      );
    } finally {
      setConfirmBusy(null);
    }
  }

  async function submitReport() {
    const text = reportText.trim();
    if (!text) return;
    setReportBusy(true);
    try {
      const loc = await locate();
      const result = await submitReportAction({
        rawText: text,
        locationText: selected.zone,
        lat: loc.lat,
        lng: loc.lng,
      });
      await runPrompt(`Report that ${text}`);
      setReportText("");
      toast.success(
        result.success
          ? "Report accepted · agent pipeline started"
          : "Report applied on console · agents ran locally"
      );
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <Page user={user}>
      <Toaster position="top-center" theme="light" />
      {emergencyMode ? (
        <div className="border-b border-border-strong bg-foreground px-4 py-2 text-background">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 md:px-8">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
              Emergency mode · four sectors · guidance is location-conditioned · no autonomous orders
            </span>
            <button
              type="button"
              onClick={() => setEmergencyMode(false)}
              className="border border-background/40 px-3 py-1 font-mono text-[10px] tracking-[0.16em] uppercase"
            >
              Exit
            </button>
          </div>
        </div>
      ) : null}
      <div id="console">
        {/* HERO */}
        <section className="border-b border-border-strong">
          <div className="mx-auto max-w-[1600px] px-4 pt-10 pb-0 md:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <span className="label-mono">Operating layer · not a chatbot</span>
              <span className="label-mono">Scenario: {snapshot.scenario}</span>
            </div>
            <h1 className="display-tight mt-6 text-[16vw] leading-[0.82] md:text-[11.5vw]">
              R<span className="text-[0.62em]">es</span>Q
            </h1>
            <div className="mt-6 grid gap-8 border-t border-border py-6 md:grid-cols-12">
              <p className="md:col-span-5 md:col-start-1 text-lg leading-snug">
                The safest useful action, visible within seconds of a disaster signal.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground md:col-span-4">
                One map-first surface joining early warning, local risk intelligence, safe-action
                guidance, emergency assistance, medical coordination and relief. Sources, timestamps
                and confidence stay visible on every record.
              </p>
              <div className="flex flex-wrap items-start gap-2 md:col-span-3 md:justify-end">
                <button
                  type="button"
                  onClick={enterEmergencyMode}
                  className="border border-border-strong bg-foreground px-4 py-2 font-mono text-[11px] tracking-[0.16em] text-background uppercase"
                >
                  Enter emergency mode
                </button>
                <a
                  href="#situation"
                  className="border border-border-strong px-4 py-2 font-mono text-[11px] tracking-[0.16em] uppercase hover:bg-muted transition-colors"
                >
                  Live situation
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS STRIP */}
        <div className="border-b border-border">
          <div className="mx-auto grid max-w-[1600px] grid-cols-2 divide-x divide-border border-x border-border md:grid-cols-5 md:px-0">
            {metrics.map((m) => (
              <div key={m.label} className="px-4 py-5">
                <p className="label-mono">{m.label}</p>
                <p className="mt-2 font-mono text-3xl tabular-nums">{m.value}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CORE PANELS */}
        <Section index="01" title="Core metrics" note={`Risk ${snapshot.riskIndex} · river ${snapshot.riverM.toFixed(2)} m`}>
          <div className="grid gap-px bg-border md:grid-cols-3">
            <div className="panel p-5">
              <div className="flex items-baseline justify-between">
                <p className="label-mono">Report inflow · 24h</p>
                <span className="font-mono text-xs">{snapshot.reportsToday}</span>
              </div>
              <div className="mt-6">
                <Bars />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>00:00</span>
                <span>12:00</span>
                <span>NOW</span>
              </div>
            </div>
            <div className="panel p-5">
              <p className="label-mono">Composite risk index</p>
              <div className="mt-4">
                <Gauge value={snapshot.riskIndex} />
              </div>
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                GAUGE {snapshot.riverM.toFixed(2)} M · RAINFALL {snapshot.rainfallMm} MM · DRAINAGE LOAD {snapshot.drainage}
              </p>
            </div>
            <div className="panel p-5">
              <p className="label-mono">Response tracker</p>
              <ul className="mt-4 divide-y divide-border">
                {queue.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2.5">
                    <button
                      type="button"
                      className="font-mono text-[11px] underline-offset-2 hover:underline"
                      onClick={() => {
                        document.getElementById("map")?.scrollIntoView({ behavior: "smooth" });
                        toast.message(r.id, { description: `${r.status} · ${r.pri}` });
                      }}
                    >
                      {r.id}
                    </button>
                    <span className="truncate text-xs text-muted-foreground">{r.need}</span>
                    <span className="ml-auto font-mono text-[10px]">{r.pri}</span>
                    <Tag>{r.status}</Tag>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* INCIDENTS */}
        <Section index="02" title="Incident register" note="Source state shown per record">
          <div className="overflow-x-auto border border-border bg-surface">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-border-strong">
                  {["ID", "Type", "Zone", "Severity", "Reports", "State", "Updated"].map((h) => (
                    <th key={h} className="label-mono px-4 py-2 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/40"
                    onClick={() => {
                      setSel(i.id);
                      document.getElementById("map")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{i.id}</td>
                    <td className="px-4 py-3 text-sm">{i.type}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{i.zone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-24 bg-muted">
                          <span
                            className="block h-full bg-foreground"
                            style={{ width: `${i.severity}%` }}
                          />
                        </span>
                        <span className="font-mono text-[11px] tabular-nums">{i.severity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{i.reports}</td>
                    <td className="px-4 py-3">
                      <Tag>{i.state}</Tag>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {i.updated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* SAFE ACTION */}
        <Section index="03" title="Safe-action engine" note={`Hazard: ${snapshot.hazard}`}>
          <div className="grid gap-px bg-border lg:grid-cols-3">
            <div className="panel p-6 lg:col-span-1">
              <p className="label-mono">Do now</p>
              <ol className="mt-4 space-y-4">
                {snapshot.doNow.map((s, n) => (
                  <li key={n} className="flex gap-4">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(n + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="panel p-6 lg:col-span-2">
              <div className="flex items-baseline justify-between">
                <p className="label-mono">Ranked safe locations</p>
                <span className="label-mono">Elevation · capacity · route risk</span>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {safePlaces.map((p) => (
                  <li key={p.name} className="grid grid-cols-12 items-center gap-2 py-3">
                    <button
                      type="button"
                      className="col-span-12 text-left text-sm md:col-span-4 hover:underline"
                      onClick={() => {
                        document.getElementById("map")?.scrollIntoView({ behavior: "smooth" });
                        toast.message(p.name, { description: `${p.kind} · score ${p.score} · ${p.dist}` });
                      }}
                    >
                      {p.name}
                    </button>
                    <span className="label-mono col-span-3 md:col-span-2">{p.kind}</span>
                    <span className="col-span-3 font-mono text-xs md:col-span-1">{p.elev}</span>
                    <span className="col-span-3 font-mono text-xs md:col-span-2">{p.cap}</span>
                    <span className="col-span-3 font-mono text-xs md:col-span-1">{p.dist}</span>
                    <span className="col-span-12 flex items-center gap-2 md:col-span-2">
                      <span className="h-1.5 flex-1 bg-muted">
                        <span
                          className="block h-full bg-foreground"
                          style={{ width: `${p.score}%` }}
                        />
                      </span>
                      <span className="font-mono text-[11px]">{p.score}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* PRINCIPLES */}
        <Section index="04" title="Design principles" note="Boundaries are the product">
          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                t: "Action over information",
                d: "Every major alert answers one question: what should I do now, here.",
              },
              {
                t: "Time is first class",
                d: "Timestamps, freshness and stale-data warnings on every changing record.",
              },
              {
                t: "Source transparency",
                d: "Official, verified community, community report and AI signal never blur together.",
              },
              {
                t: "AI with boundaries",
                d: "Classification, clustering and matching only. Safety-critical calls stay deterministic and human-reviewed.",
              },
            ].map((c) => (
              <button
                key={c.t}
                type="button"
                className="panel p-6 text-left"
                onClick={() => toast.message(c.t, { description: c.d })}
              >
                <h3 className="display-tight text-lg">{c.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* MAP SECTION */}
      <Section id="map" index="05" title="Incident map" note="Coarse location for public layers">
        <div className="mb-4 flex flex-wrap gap-2">
          {LAYERS.map((l) => {
            const on = activeLayers.includes(l);
            return (
              <button
                key={l}
                type="button"
                onClick={() => toggleLayer(l)}
                className={`border border-border-strong px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] uppercase transition-colors ${
                  on ? "bg-foreground text-background" : "bg-surface text-foreground"
                }`}
              >
                [{on ? "x" : " "}] {l}
              </button>
            );
          })}
        </div>

        <div className="grid gap-px bg-border lg:grid-cols-3">
          <div className="panel relative lg:col-span-2">
            <div className="rule-grid dot-grid relative aspect-[4/3] w-full">
              <div className="absolute inset-0 hatch opacity-40" style={{ clipPath: "polygon(0 55%, 34% 42%, 62% 60%, 100% 48%, 100% 100%, 0 100%)" }} />
              <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 62 C 20 52, 38 68, 55 58 S 84 46, 100 54" fill="none" stroke="var(--color-foreground)" strokeWidth="0.5" opacity="0.5" />
                {activeLayers.includes("Routes") && (
                  <path d="M12 88 L 30 66 L 52 60 L 74 38 L 88 20" fill="none" stroke="var(--color-foreground)" strokeWidth="0.6" strokeDasharray="2 1.5" />
                )}
              </svg>

              {activeLayers.includes("Hazard") &&
                incidents.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setSel(i.id)}
                    style={{ left: `${i.x}%`, top: `${i.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    aria-label={i.id}
                  >
                    <span className="relative grid place-items-center">
                      {i.id === sel && (
                        <span className="pulse-ring absolute size-6 rounded-full border border-foreground" />
                      )}
                      <span
                        className={`grid size-6 place-items-center border border-border-strong font-mono text-[8px] ${
                          i.id === sel ? "bg-foreground text-background" : "bg-surface"
                        }`}
                      >
                        {i.severity}
                      </span>
                    </span>
                  </button>
                ))}

              {activeLayers.includes("Shelters") &&
                [
                  [18, 18],
                  [72, 76],
                  [86, 30],
                ].map(([x, y]) => (
                  <span
                    key={`${x}-${y}`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="absolute size-3 -translate-x-1/2 -translate-y-1/2 border border-border-strong bg-background"
                  />
                ))}

              {activeLayers.includes("SOS") &&
                [
                  [46, 48],
                  [60, 30],
                  [34, 80],
                ].map(([x, y]) => (
                  <span
                    key={`s-${x}`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-foreground"
                  />
                ))}

              {activeLayers.includes("Ambulance") &&
                [
                  [42, 62],
                  [70, 44],
                ].map(([x, y]) => (
                  <span
                    key={`a-${x}`}
                    title="Simulated ambulance"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 border border-border-strong bg-foreground px-1 font-mono text-[7px] tracking-[0.08em] text-background"
                  >
                    AMB
                  </span>
                ))}

              {activeLayers.includes("Reports") &&
                incidents.map((i) => (
                  <span
                    key={`r-${i.id}`}
                    style={{ left: `${i.x + 3}%`, top: `${i.y + 4}%` }}
                    className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/50"
                  />
                ))}

              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="h-px w-16 bg-foreground" />
                <span className="font-mono text-[10px]">500 M</span>
              </div>
              <div className="absolute top-3 right-3 font-mono text-[10px] text-muted-foreground">
                22.5726 N / 88.3639 E
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <p className="label-mono">Selected incident</p>
            <p className="display-tight mt-3 text-3xl">{selected.id}</p>
            <p className="mt-2 text-sm">{selected.type}</p>
            <p className="text-sm text-muted-foreground">{selected.zone}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag>{selected.state}</Tag>
              <Tag>SEV {selected.severity}</Tag>
              <Tag>{selected.reports} REPORTS</Tag>
              <Tag>UPDATED {selected.updated}</Tag>
            </div>

            <p className="label-mono mt-8">Nearest safe locations</p>
            <ul className="mt-3 divide-y divide-border">
              {safePlaces.slice(0, 3).map((p) => (
                <li key={p.name} className="flex items-center justify-between py-2.5 text-sm">
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onClick={() => toast.message(p.name, { description: `Route score ${p.score} · ${p.dist}` })}
                  >
                    {p.name}
                  </button>
                  <span className="font-mono text-xs text-muted-foreground">{p.dist}</span>
                </li>
              ))}
            </ul>

            {sosOpen ? (
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <p className="label-mono">SOS intake</p>
                <div className="grid grid-cols-2 gap-2">
                  {SOS_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSosType(t.id);
                        setTrapped(t.id === "TRAPPED");
                        setMedical(t.id === "MEDICAL");
                      }}
                      className={`border px-2 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase ${
                        sosType === t.id
                          ? "border-border-strong bg-foreground text-background"
                          : "border-border"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center justify-between font-mono text-[11px]">
                  People affected
                  <input
                    type="number"
                    min={1}
                    value={people}
                    onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 border border-border-strong bg-background px-2 py-1 text-right"
                  />
                </label>
                <label className="flex items-center gap-2 font-mono text-[11px]">
                  <input type="checkbox" checked={trapped} onChange={(e) => setTrapped(e.target.checked)} />
                  Currently trapped
                </label>
                <label className="flex items-center gap-2 font-mono text-[11px]">
                  <input type="checkbox" checked={medical} onChange={(e) => setMedical(e.target.checked)} />
                  Medical help required
                </label>
                <label className="flex items-center gap-2 font-mono text-[11px]">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  Share live location while SOS is active
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={sosBusy}
                    onClick={sendSos}
                    className="flex-1 border border-border-strong bg-foreground px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-background uppercase disabled:opacity-50"
                  >
                    {sosBusy ? "Sending…" : "Confirm SOS"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSosOpen(false)}
                    className="border border-border-strong px-3 py-3 font-mono text-[11px] tracking-[0.16em] uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSosOpen(true)}
                className="mt-8 w-full border border-border-strong bg-foreground px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-background uppercase"
              >
                Send SOS
              </button>
            )}
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">
              Live location shared only while the SOS is active. Revocable at any time. Ambulance layer is simulated.
            </p>
          </div>
        </div>
      </Section>

      <Section index="06" title="Responder queue" note="Ambulance layer is a labelled simulator">
        <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-4">
          {queue.map((r) => (
            <div key={r.id} className="panel p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs">{r.id}</span>
                <Tag>{r.pri}</Tag>
              </div>
              <p className="mt-4 text-sm">{r.need}</p>
              <p className="text-sm text-muted-foreground">{r.who}</p>
              <div className="mt-6 flex items-end justify-between border-t border-border pt-3">
                <span className="label-mono">{r.status}</span>
                <span className="font-mono text-xl tabular-nums">{r.eta}</span>
              </div>
              <button
                type="button"
                className="mt-3 w-full border border-border-strong px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase hover:bg-foreground hover:text-background"
                onClick={() => {
                  const order = [
                    "QUEUED",
                    "TRIAGE",
                    "UNIT ASSIGNED",
                    "AMBULANCE EN ROUTE",
                    "ARRIVED",
                    "CLOSED",
                  ];
                  const i = Math.max(0, order.indexOf(r.status));
                  const next = order[Math.min(order.length - 1, i + 1)]!;
                  setSnapshot(
                    refreshDerived({
                      ...snapshot,
                      queue: snapshot.queue.map((q) =>
                        q.id === r.id ? { ...q, status: next } : q
                      ),
                    })
                  );
                  toast.message(`${r.id} → ${next}`, {
                    description: "Simulator only — not a real dispatch.",
                  });
                }}
              >
                Advance status
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* RELIEF SECTION */}
      <Section id="relief" index="07" title="Relief camp register" note="Listings start community-reported">
        <div className="grid gap-px bg-border md:grid-cols-2">
          {camps.map((c) => {
            const pct = Math.round((c.ppl / c.cap) * 100);
            return (
              <div key={c.name} className="panel p-6">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 text-left"
                  onClick={() =>
                    toast.message(c.name, {
                      description: `${c.ppl}/${c.cap} · ${c.state}`,
                    })
                  }
                >
                  <h3 className="display-tight text-xl">{c.name}</h3>
                  <Tag>{c.state}</Tag>
                </button>
                <div className="mt-6 flex items-end gap-4">
                  <span className="font-mono text-5xl tabular-nums">{pct}%</span>
                  <span className="label-mono pb-2">
                    {c.ppl} of {c.cap} places
                  </span>
                </div>
                <span className="mt-3 block h-2 w-full bg-muted">
                  <span className="block h-full bg-foreground" style={{ width: `${pct}%` }} />
                </span>
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div>
                    <p className="label-mono">Needs</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {c.needs.map((n) => (
                        <li key={n}>— {n}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="label-mono">Offers</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {c.offers.length ? (
                        c.offers.map((o) => <li key={o}>+ {o}</li>)
                      ) : (
                        <li className="text-muted-foreground">none listed</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section index="08" title="Resource matching" note="AI assisted · human confirmed">
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border-strong">
                {["Need", "Destination", "Matched offer", "Confidence", ""].map((h) => (
                  <th key={h} className="label-mono px-4 py-2 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.need} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-sm">{m.need}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{m.camp}</td>
                  <td className="px-4 py-3 text-sm">{m.offer}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-20 bg-muted">
                        <span
                          className="block h-full bg-foreground"
                          style={{ width: `${m.conf * 100}%` }}
                        />
                      </span>
                      <span className="font-mono text-[11px]">{m.conf.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.confirmed ? (
                      <Tag>Human confirmed</Tag>
                    ) : (
                      <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={confirmBusy === m.need}
                        onClick={() => confirmMatch(m.need)}
                        className="border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                      >
                        {confirmBusy === m.need ? "…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSnapshot(
                            refreshDerived({
                              ...snapshot,
                              matches: snapshot.matches.filter((x) => x.need !== m.need),
                            })
                          );
                          toast.message("Match rejected");
                        }}
                        className="border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase hover:bg-muted"
                      >
                        Reject
                      </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* SITUATION SECTION */}
      <Section id="situation" index="09" title="Official & community feed" note="Newest first">
        <div className="grid gap-px bg-border lg:grid-cols-3">
          <div className="panel p-6 lg:col-span-2">
            <form
              className="mb-6 space-y-2 border-b border-border pb-6"
              onSubmit={(e) => {
                e.preventDefault();
                void submitReport();
              }}
            >
              <p className="label-mono">File a community report</p>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="What are you seeing, and where?"
                rows={3}
                className="w-full border border-border-strong bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
              <button
                type="submit"
                disabled={reportBusy || !reportText.trim()}
                className="border border-border-strong bg-foreground px-4 py-2 font-mono text-[10px] tracking-[0.16em] text-background uppercase disabled:opacity-40"
              >
                {reportBusy ? "Submitting…" : "Submit to agents"}
              </button>
            </form>
            <ul className="divide-y divide-border">
              {[...feed].reverse().map((a) => (
                <li key={a.code} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs">{a.code}</span>
                    <Tag>{a.state}</Tag>
                    <span className="label-mono ml-auto">
                      {a.time} · {a.src}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg leading-snug">{a.head}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-6">
            <p className="label-mono">Information states</p>
            <ul className="mt-4 space-y-4">
              {[
                ["OFFICIAL", "Issued by an authority. Highest trust."],
                ["VERIFIED", "Community record confirmed by moderator or trusted source."],
                ["COMMUNITY", "Unconfirmed report. Treat as a signal, not a fact."],
                ["AI SIGNAL", "Model-derived cluster or classification with confidence."],
                ["STALE", "Last known value. Live service degraded."],
              ].map(([k, v]) => (
                <li key={k}>
                  <Tag>{k}</Tag>
                  <p className="mt-2 text-sm text-muted-foreground">{v}</p>
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t border-border pt-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
              CASUALTY FIGURES ARE SHOWN AS REPORTED OR OFFICIALLY CONFIRMED — NEVER AS AN ESTIMATE
              PRESENTED AS FACT.
            </p>
          </div>
        </div>
      </Section>

      <Section index="10" title="Preparedness to recovery" note="One continuous timeline">
        <ol className="grid gap-px bg-border md:grid-cols-5">
          {timeline.map((s) => (
            <li
              key={s.t}
              className={`panel p-5 cursor-pointer ${phase === s.t ? "ring-1 ring-foreground" : ""}`}
              onClick={() => {
                setPhase(s.t);
                toast.message(s.k, { description: s.d });
              }}
            >
              <span className="font-mono text-xs">{s.t}</span>
              <h3 className="display-tight mt-3 text-lg">{s.k}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section index="11" title="Limits" note="Stated, not hidden">
        <div className="grid gap-px bg-border md:grid-cols-3">
          {[
            "No autonomous evacuation orders. Guidance is approved content, location-conditioned.",
            "No structural safety certification. Building suitability is a factor list, not an inspection.",
            "No autonomous dispatch. Ambulance coordination is a clearly labelled simulator here.",
          ].map((t) => (
            <button
              key={t}
              type="button"
              className="panel p-6 text-left text-sm leading-relaxed"
              onClick={() => toast.message("Limit in force", { description: t })}
            >
              {t}
            </button>
          ))}
        </div>
      </Section>
    </Page>
  );
}
