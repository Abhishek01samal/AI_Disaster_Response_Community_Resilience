# ResQ — Disaster Response Operating Layer

> The safest useful action, visible within seconds of a disaster signal.

ResQ is a **map-first operating layer** — not a chatbot — that unifies early warning, risk intelligence, safe-action guidance, emergency response, and relief coordination into one continuously updated console. Every record carries a source, timestamp, and confidence level, and safety-critical decisions stay deterministic and human-reviewed.

## Core Principles

- **Action over information** — every alert answers "what should I do now, here."
- **Time is first-class** — timestamps, freshness, and stale-data warnings on all changing records.
- **Source transparency** — Official, Verified, Community, and AI Signal states never blur together.
- **AI with boundaries** — AI handles classification, clustering, and matching only. It never issues autonomous evacuation orders, dispatches, or certifies structural safety.

## Product Surfaces

| Surface | Purpose |
|---|---|
| **Console** | Live metrics: active incidents, open SOS, shelter capacity, response times |
| **Incident Map** | Hazard zones, routes, shelters, SOS pins on a live map |
| **Relief** | Camp registry, needs/offers, AI-assisted resource matching |
| **Situation** | Chronological official + community + AI feed with trust labels |

Information states shown throughout: **OFFICIAL → VERIFIED → COMMUNITY → AI SIGNAL → STALE**

---

## Multi-Agent Architecture

Five specialized decision-support workers sit behind the console. They never act autonomously — every output flows through a deterministic safety core (rules engine, PostGIS, RBAC, human approval) before becoming an action.

```
                    MASTER AGENT (Orchestrator)
                            │
        ┌───────────┬───────────┬────────────┐
        ▼           ▼           ▼            ▼
     RISK        ROUTE      RESOURCE     RESPONSE
        └───────────┴───────────┴────────────┘
                            │
                 DETERMINISTIC SAFETY CORE
              (Rules + PostGIS + RBAC + Human review)
                            │
                        ResQ Console
```

### 1. Master / Orchestrator Agent
Receives every event (alerts, reports, SOS, resource changes), decides which specialist agents to invoke, and merges their outputs into one coherent incident context. Never issues instructions like "evacuate now" — it composes verified guidance for human/authority approval.

### 2. Risk Intelligence Agent
Answers *"what's happening, where, how bad?"* Performs incident classification, report clustering (e.g., 38 reports → one flood cluster), duplicate detection, priority scoring, and anomaly detection. All outputs are confidence-scored signals awaiting verification, not confirmed facts.

### 3. Safe Route & Location Agent
Answers *"where should people go, and how?"* Ranks shelters using a transparent `SafetyScore` (hazard exposure, capacity, accessibility, distance) and evaluates route risk (hazard crossings, closures). Actual geospatial math (nearest-neighbor, point-in-polygon, intersections) runs in **PostGIS**, not in the LLM.

### 4. Resource & Relief Agent
Answers *"what's needed, and where's it available?"* Monitors camp capacity, extracts structured needs/offers from free text, and proposes need↔offer matches with a confidence score — always pending human confirmation before allocation.

### 5. Emergency Response Agent
Answers *"who needs help right now?"* Handles SOS intake, triage-priority suggestions, the responder queue, and a clearly labeled **ambulance simulator** (no real dispatch integration assumed for the hackathon build).

**Agent-to-agent communication** uses structured JSON events (e.g., `RISK_UPDATE`, `SAFE_LOCATION_RESULT`, `RESOURCE_ALERT`, `RESPONSE_UPDATE`) rather than free-form chat.

---

## User Data Model (Data-Minimization Approach)

Data is collected in layers — only what each workflow actually needs:

| Stage | Data Collected |
|---|---|
| **Registration** | Name, contact, role, language preference, emergency contacts, basic household size |
| **Optional profile** | Accessibility needs, mobility assistance, medical-assistance flag (sensitive — consent-gated) |
| **On SOS activation** | Live location (consent-scoped, revocable), emergency type, people affected, trapped/medical flags |
| **Community reporting** | Report text, location, optional media, timestamp |

Precise location is reserved for active emergency workflows; public map layers only ever show coarse location.

---

## Database Schema (Prisma / PostgreSQL)

Extends the existing auth schema (`User`, `OAuthProvider`) with:

- **User context**: `EmergencyContact`, `UserLocation`, `UserAssistanceProfile`, `UserConsent`
- **Geo & hazard**: `Location`, `Building`, `HazardZone`, `Incident`, `Alert`
- **Relief**: `Shelter`, `Resource`, `ReliefNeed`, `ResourceOffer`, `ResourceMatch`, `Donation`
- **Response**: `SOSRequest`, `Ambulance`, `AmbulanceAssignment`
- **Trust/reporting**: `CommunityReport` (with `SourceState` + `VerificationStatus` enums)
- **Agent orchestration**: `AgentWorkflow`, `AgentExecution`, `EvaluationResult`, `AuditEvent`

The agent tables (`AgentWorkflow` → `AgentExecution`) are intentionally generic so each agent (Data Refinement, Validation, Master, Risk, Route, Resource, Response, Evaluation) can log its own input/output/confidence independently, allowing teams to build agents in parallel against shared JSON contracts.

`Json` fields stand in for PostGIS geometry types for now; production geospatial operations (point-in-polygon, nearest-shelter, spatial clustering) are a planned follow-up on top of PostGIS.

---

## Recommended Build Order

```
Prisma Schema → Repository Layer → Service Layer → Agent Logic → Orchestration (Inngest) → UI
```

A single TypeScript backend (not microservices) is recommended for the hackathon scope, organized as:

```
backend/
├── agents/        (master, risk, route, resource, response)
├── safety/        (rules, validation, human-approval, confidence)
├── geospatial/     (postgis, hazards, routes, locations)
├── realtime/       (socket.ts)
└── database/
```

---

## Design Boundary (Stated, Not Hidden)

- No autonomous evacuation orders — guidance only, always source-approved.
- No structural safety certification — building suitability is a ranked factor list, not an inspection.
- No autonomous dispatch — ambulance coordination is a labeled simulator.

> Decision support — not a replacement for emergency authorities.
