# PRD — ResQ

## 1. Problem Statement

Hyderabad's eastern corridor — Uppal, LB Nagar, and Nagole — has the fastest-growing
flood-risk footprint in the city, expanding from roughly 38 km² to over 60 km² as
agricultural catchment converts to concrete. The core failure isn't a lack of
rainfall data — it's that existing alerts report total rainfall over 24 hours, which
conceals the actual danger. Drains in this corridor can typically only handle
12–20mm of rain per hour. A 60mm downpour spread over 12 hours is manageable; the
same 60mm falling in 45 minutes overwhelms the drainage system almost immediately.
No current public system distinguishes between these two scenarios.

Historically this area drained through a network of interconnected lakes (cheruvus)
following natural contours. Urban construction severed these connections, so water
still follows old paths but now meets blocked or narrowed drains instead of open
cascades — meaning flooding in one sub-zone is frequently a downstream consequence
of an upstream basin filling, not an isolated local event.

A secondary but equally critical failure: flooding itself is rarely the direct
cause of injury or death — submerged open manholes, exposed live wiring, and
unverified rumors causing bad decisions are. Any usable system must account for
hazard points and evidence quality, not just water presence.

## 2. Goal

Build a working demonstration of a decision-support system that:
- Predicts flood breach timing from rainfall **rate** rather than total volume,
  using real drain capacity thresholds
- Models basin-cascade relationships so downstream risk can be anticipated before
  local rainfall alone would indicate it
- Ranks safe shelters with visible, explainable reasoning rather than an opaque
  score
- Distinguishes verified, unverified, and AI-flagged information rather than
  presenting all reports as equally trustworthy
- Routes users to safety while avoiding known secondary hazards
- Demonstrates a coordinated multi-step reasoning pipeline (four distinct
  functional "agents") rather than a single generic AI call

## 3. Non-Goals (explicitly out of scope)

- Real-time sensor or IoT data ingestion
- Integration with real GHMC, TGSPDCL, or HYDRAA systems
- Multi-agency coordination workflows
- Relief camp resource matching / donations / payments
- Real ambulance dispatch integration
- Multi-role authentication (citizen vs admin vs responder accounts)
- City-wide coverage beyond the Uppal / LB Nagar / Nagole corridor
- Any agent orchestration framework (LangChain, CrewAI, etc.)
- Real third-party routing API (Google Directions, OSRM, etc.)

## 4. Users (for this demo)

- **Citizen in the corridor** — views risk status, submits a new ground report,
  presses SOS to find the nearest safe shelter
- **Judge/evaluator** — the actual audience; the system must communicate its
  reasoning clearly enough to be understood in a 5–7 minute live demo

## 5. Functional Requirements

### 5.1 Seed Data (T0)
- Three sub-zones: Uppal, LB Nagar, Nagole, treated as one connected corridor
- 3–4 basins, each tagged with an upstream/downstream relationship to another
- One fixed drain capacity threshold (12–20mm/hr)
- 3–4 shelters: name, coordinates, distance, current capacity %
- 2–3 hazard points: coordinates, type (manhole/live wire), label
- 8–10 pre-written community reports, distributed across all three sub-zones, each
  pre-tagged with a trust level (official / unverified / stale)
- All seed data persisted in Postgres via Prisma, loaded into memory on backend
  start for fast reads during the demo

### 5.2 Map Display
- Single map view centered on the corridor, rendered with Leaflet + OSM tiles
- Distinct marker types for shelters, basins, hazard points, and sub-zone centers
- Must render clearly and legibly on a projector from a distance

### 5.3 Risk Agent (deterministic, no LLM)
- **Input:** rainfall rate (mm/hr), entered manually via a UI control
- **Logic:** compare input rate against the fixed drain capacity threshold; if
  exceeded, determine which sub-zone(s) breach and an estimated time-to-overflow.
  Additionally check basin-cascade state: if an upstream basin is flagged near
  capacity in seed data, elevate the downstream sub-zone's risk level independent
  of local rainfall input
- **Output:** structured result per sub-zone (breach: true/false, estimated time,
  risk level)

### 5.4 Verifier Agent (deterministic rules first)
- **Input:** incoming report (seeded or live-classified) plus existing report set
- **Logic:** rule-based evaluation — if multiple reports reference the same
  sub-zone within a similar time window, increase confidence; if a report
  conflicts with an official-tagged alert, flag as disputed
- **Output:** final evidence-state tag (OFFICIAL / UNVERIFIED / AI SIGNAL / STALE /
  DISPUTED)
- LLM fallback (optional): may call Featherless AI for ambiguous cases, but rules
  must handle the default path so the demo never depends on a live call succeeding

### 5.5 Classifier Agent (live AI, backend only)
- **Input:** free-text report typed by presenter during demo
- **Logic:** single call to Featherless AI (OpenAI SDK-compatible), prompted to
  return strict JSON: `{ hazard_type: string, confidence: number }`
- Must have a hardcoded fallback response if the API call fails or times out
- Called only from backend — API key never exposed to frontend

### 5.6 Router Agent (simulated)
- **Input:** user's (simulated) location, destination shortlist from SafetyScore
  ranking, hazard point set
- **Logic:** compute a simple waypoint path (2–4 interpolated points) from user to
  top-ranked shelter, manually adjusted to bend around hazard point coordinates —
  no real routing API
- **Output:** ordered list of coordinates for the frontend to animate a marker
  along

### 5.7 SafetyScore & Shelter Ranking
- For each shelter: compute a score from distance, capacity %, flood exposure, and
  whether it sits downstream of a basin flagged near capacity (from Risk agent
  output)
- Display ranked list with a short human-readable reason per shelter (e.g.,
  "1.2km away, dry, not downstream of an at-risk basin")

### 5.8 Evidence Feed
- Scrollable list of all reports (seeded + any live-classified during demo), each
  showing text, sub-zone, and evidence-state tag with distinct visual styling per
  tag type

### 5.9 SOS Flow
- Button triggers: shelter ranking lookup → Router agent path computation →
  animated marker movement along the returned path on the map

## 6. Data Model (Prisma / Postgres)

Core tables: `SubZone`, `Basin` (with `upstreamBasinId` self-relation), `Shelter`,
`HazardPoint`, `Report` (with `evidenceState` enum), `Threshold` (single-row config
for drain capacity). Keep schema flat and shallow — no need for complex relations
beyond basin upstream/downstream and report-to-subzone linkage. Seed via a single
`seed.ts` script run once at setup, not regenerated live.

## 7. Success Criteria

- Full demo flow runs start to finish without manual intervention beyond the two
  live-input moments (rainfall rate, new report text)
- Classifier agent completes a live call in under 5 seconds with a visible fallback
  if it fails
- SafetyScore reasoning is visible on screen, not just a number
- Evidence feed clearly visually distinguishes trust levels
- SOS animation completes smoothly without erratic marker jumps
- Entire flow rehearsed and demonstrable in under 4 minutes, leaving room for Q&A

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Live API call fails on stage | Hardcoded fallback response in Classifier agent |
| Team over-scopes into T2/T3 | Build order is sequential and non-negotiable |
| Map rendering issues on projector | Test on external display before demo day |
| Postgres/Prisma setup friction | Test seed script on every team member's machine early |

## 9. Open Questions / To Confirm Before Building

- Exact coordinates for Uppal, LB Nagar, Nagole sub-zone centers and chosen
  shelter/hazard/basin points
- Exact Featherless AI model name/endpoint and rate limits
- Who owns final pitch delivery and Q&A prep
