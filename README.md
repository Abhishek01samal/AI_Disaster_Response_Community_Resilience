# FloodPulse — Flash Flood Early Warning & Response System
### Uppal / LB Nagar / Nagole Corridor, Hyderabad

## What This Is

A hackathon prototype demonstrating a rainfall-intensity-based flood prediction and
response system for Hyderabad's eastern flood corridor. The core insight: official
alerts report total rainfall over 24 hours, which hides the real danger — drains in
this corridor handle roughly 12–20mm/hr, so a short intense burst overwhelms them
even when the daily total looks harmless.

This system:
- Predicts breach timing from rainfall **rate**, not volume
- Ranks shelters using explainable basin-cascade logic
- Verifies incoming ground reports instead of trusting them blindly
- Routes users to safety avoiding known hazards
- Uses four coordinating functions (Classifier, Risk, Verifier, Router) as the
  orchestration layer — not an agent framework

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

## Repo Structure

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

## Environment Variables (`backend/.env`)

```
DATABASE_URL="postgresql://user:password@localhost:5432/floodpulse"
FEATHERLESS_API_KEY="your_key_here"
FEATHERLESS_BASE_URL="https://api.featherless.ai/v1"
PORT=4000
```

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

## Build Order (do not skip ahead)

**T0:** seed data → static map → backend endpoint
**T1:** Risk agent → Verifier agent → Classifier agent (live AI) → Router agent →
SafetyScore display
**T2** (only if T1 is fully stable): intensity/volume visual, cross-zone comparison,
report clustering, deck citations
