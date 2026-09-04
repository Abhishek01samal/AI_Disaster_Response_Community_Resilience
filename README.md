# ResQ — Flash Flood Early Warning & Response System

A rainfall-intensity-driven flood prediction and response platform for Hyderabad's
Uppal / LB Nagar / Nagole corridor. Built with deterministic hydrological logic
and a coordinated multi-agent AI pipeline — not an agent framework.

---

## Overview

**ResQ** addresses a critical gap in disaster response: official flood alerts report
total rainfall over 24 hours, which conceals the actual danger. Drainage
infrastructure in Hyderabad's eastern corridor typically handles only 12-20mm of
rainfall per hour. A 60mm downpour spread across 12 hours is manageable; the same
60mm falling in 45 minutes overwhelms the system almost immediately. No current
public system distinguishes between these two scenarios.

The corridor — Uppal, LB Nagar, and Nagole — also has the fastest-growing
flood-risk footprint in the city, expanding from roughly 38 km² to over 60 km² as
agricultural catchment converts to concrete. Historically this area drained through
a network of interconnected lakes (cheruvus) following natural contours. Urban
construction severed these connections, so water still follows old paths but now
meets blocked or narrowed drains instead of open cascades — meaning flooding in one
sub-zone is frequently a downstream consequence of an upstream basin filling, not
an isolated local event.

A secondary but equally critical failure: flooding itself is rarely the direct
cause of injury or death — submerged open manholes, exposed live wiring, and
unverified rumors causing bad decisions are. Any usable system must account for
hazard points and evidence quality, not just water presence.

ResQ addresses these gaps with four deterministic functional agents operating as a
pipeline — not a generic AI system.

---

## Architecture

The system coordinates four plain functions in a fixed sequence. No agent framework
(LangChain, CrewAI, etc.) is used. Each function has known, fixed inputs and
outputs — this determinism ensures the demo never depends on a live call succeeding.

| Agent | Input | Logic | Output |
|---|---|---|---|
| **Classifier** | Free-text report typed by presenter | Single call to Featherless AI, prompted to return strict JSON `{hazard_type: string, confidence: number}` | Hazard type + confidence, or hardcoded fallback if API fails |
| **Risk** | Rainfall rate (mm/hr) entered manually | Compare rate against fixed drain capacity threshold (12-20mm/hr); if exceeded, determine which sub-zone(s) breach and estimated time-to-overflow. Additionally check basin-cascade state: if an upstream basin is flagged near capacity in seed data, elevate the downstream sub-zone's risk level independent of local rainfall input | Per-sub-zone result: breach true/false, estimated time, risk level |
| **Verifier** | Incoming report + existing report set | Rule-based evaluation: if multiple reports reference the same sub-zone within a similar time window, increase confidence; if a report conflicts with an official-tagged alert, flag as disputed | Final evidence-state tag: OFFICIAL / UNVERIFIED / AI SIGNAL / STALE / DISPUTED |
| **Router** | User's simulated location, destination shortlist from SafetyScore ranking, hazard point set | Compute a simple waypoint path (2-4 interpolated points) from user to top-ranked shelter, manually adjusted to bend around hazard point coordinates — no real routing API | Ordered list of coordinates for the frontend to animate a marker along |

**Pipeline sequence:** Presenter enters rainfall rate → Risk agent predicts breach →
Shelters ranked by SafetyScore → Evidence feed shows reports tagged by trust level →
Presenter types new report → Classifier agent calls AI live → hazard type + confidence
appear → Presenter clicks SOS → Router agent computes path avoiding hazards → animated
marker moves toward nearest safe shelter.

All seed data is persisted in PostgreSQL via Prisma and loaded into memory on backend
start for fast reads during the demo.

---

## Data Model (Prisma / PostgreSQL)

Core tables (flat, shallow schema — no complex relations beyond basin upstream/downstream
and report-to-subzone linkage):

| Table | Key Columns |
|---|---|
| `SubZone` | id, name, center_coordinates |
| `Basin` | id, name, center_coordinates, upstream_basin_id (self-relation) |
| `Shelter` | id, name, coordinates, capacity_percent, distance_from_center |
| `HazardPoint` | id, name, coordinates, type (manhole/live_wire), label |
| `Report` | id, text, sub_zone_id, evidence_state (enum: OFFICIAL/UNVERIFIED/AI_SIGNAL/STALE/DISPUTED), created_at |
| `Threshold` | id, drain_capacity_mm_per_hr (single-row config, fixed 12-20) |
| `SubZone` | id, name, center_coordinates |

Seed data is loaded via a single `seed.ts` script run once at setup, not regenerated
live.

---

## Tech Stack (Fixed — Do Not Deviate)

| Layer | Choice |
|---|---|
| Frontend | Next.js 16, Tailwind CSS |
| Map | Leaflet + OpenStreetMap tiles (no API key required) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| AI | Featherless AI API (backend only) — OpenAI SDK-compatible client acceptable |
| Agents | Four plain functions — no agent framework |
| Risk logic | Deterministic math only, no LLM |
| Verifier logic | Deterministic rules first, LLM only as optional fallback |
| Router logic | Simulated waypoint interpolation, no real routing API |
| Infrastructure | None (no Docker, no Kubernetes, no queues) |
| Deployment | Local-first. Vercel + Render/Railway only if a shareable link is needed |
| Repo structure | Two separate folders — **NOT a monorepo** |

---

## Repository Structure

```
floodpulse/
├── frontend/          (Next.js 16 app)
│   ├── app/
│   ├── components/
│   ├── public/
│   └── package.json
├── backend/            (Express app)
│   ├── src/
│   │   ├── agents/     (classifier.ts, risk.ts, verifier.ts, router.ts)
│   │   ├── routes/
│   │   ├── seed/       (seed data + seed script)
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
└── README.md
```

No shared root `package.json`, no shared build tooling. Each folder is installed and
run independently.

---

## Local Setup

**Backend**
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```
Runs on `http://localhost:4000`

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:3000`, calls backend at `http://localhost:4000`

---

## Environment Variables (`backend/.env`)

```
DATABASE_URL="postgresql://user:password@localhost:5432/floodpulse"
FEATHERLESS_API_KEY="your_key_here"
FEATHERLESS_BASE_URL="https://api.featherless.ai/v1"
PORT=4000
```

---

## Core Demo Flow

1. Map loads showing the corridor with shelters, basins, hazard points
2. Presenter enters a rainfall rate (mm/hr) → Risk agent predicts which sub-zone
   breaches first and when
3. Shelter list shown ranked by SafetyScore, with visible reasoning
4. Evidence feed shows pre-seeded community reports tagged by trust level
5. Presenter types a new report live → Classifier agent calls Featherless AI live →
   hazard type + confidence appear
6. Presenter clicks SOS → Router agent computes a waypoint path avoiding hazard
   points → animated marker moves along it

---

## Build Order (do not skip ahead)

**T0:** seed data → static map → backend endpoint
**T1:** Risk agent → Verifier agent → Classifier agent (live AI) → Router agent →
SafetyScore display
**T2** (only if T1 is fully stable): intensity/volume visual, cross-zone comparison,
report clustering, deck citations

---

## Success Criteria

- Full demo flow runs start to finish without manual intervention beyond the two
  live-input moments (rainfall rate, new report text)
- Classifier agent completes a live call in under 5 seconds with a visible fallback
  if it fails
- SafetyScore reasoning is visible on screen, not just a number
- Evidence feed clearly visually distinguishes trust levels
- SOS animation completes smoothly without erratic marker jumps
- Entire flow rehearsed and demonstrable in under 4 minutes, leaving room for Q&A

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Live API call fails on stage | Hardcoded fallback response in Classifier agent |
| Team over-scopes into T2/T3 | Build order is sequential and non-negotiable |
| Map rendering issues on projector | Test on external display before demo day |
| Postgres/Prisma setup friction | Test seed script on every team member's machine early |

---

## Open Questions / To Confirm Before Building

- Exact coordinates for Uppal, LB Nagar, Nagole sub-zone centers and chosen
  shelter/hazard/basin points
- Exact Featherless AI model name/endpoint and rate limits
- Who owns final pitch delivery and Q&A prep

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.