# ResQ — AI-Powered Flood Intelligence & Emergency Response System

ResQ is an AI-assisted flood intelligence pipeline built for Hyderabad disaster response. It converts rainfall data into ward-level risk scores, time-to-critical estimates, impact analysis, and concrete emergency actions — moving teams from reactive flood management to proactive decision-making.

Built for a hackathon demo, scoped to 3–5 verified Hyderabad wards rather than city-wide hydraulic simulation.

---

## Core Idea

ResQ answers four questions in sequence:

1. **Where** is flood risk increasing?
2. **When** could a ward become critical?
3. **Who/what** could be affected?
4. **What action** should responders take?

---

## Pipeline

```
Rainfall Data
     |
     v
Stage 1 — Risk Agent (deterministic)
     |
     v
Risk Score + Category
     |
     v
Stage 2 — Timing Agent (deterministic)
     |
     v
Time-to-Critical + Trend
     |
     v
Stage 3 — Impact Agent (deterministic)
     |
     v
Population + Hospitals + Roads + Schools
     |
     v
Stage 4 — Action Agent (LLM)
     |
     v
Recommended Emergency Actions
     |
     v
Dashboard + Live Reasoning Trace
```

| Question | Stage | Output |
|---|---|---|
| Where? | Risk Agent | Risk score (0–1) + category |
| When? | Timing Agent | ETA-to-critical (mins) + trend |
| Who/What? | Impact Agent | Population, hospitals, roads, schools |
| What action? | Action Agent | Fixed-vocabulary actions + summary sentence |

Only **Stage 4** uses an LLM. Stages 1–3 are deterministic and reproducible by design — same input always produces the same output — which keeps the system explainable and demo-safe.

---

## Core Features

- **Deterministic risk scoring** — rainfall rate, relative elevation, GHMC hotspot proximity/severity → normalized 0–1 score
- **Time-to-critical estimation** — trend extrapolation over historical risk readings
- **Impact analysis** — locally cached OSM data for population, hospitals, major roads, schools
- **AI-powered action planning** — single structured LLM call producing a fixed action vocabulary (dispatch team, close road, open shelter, issue alert) plus a human-readable summary
- **Live reasoning trace** — dashboard shows each pipeline stage as it executes, not just the final answer
- **Historical event replay** — feeds a real historical Hyderabad rainfall event through the same pipeline, for validation
- **Local-first demo** — all external data cached beforehand; no dependency on venue Wi-Fi or live APIs

---

## Tech Stack

**Backend:** Python, FastAPI, SQLite/JSON, Pydantic, Anthropic API (Stage 4 only), `rasterio` / `elevation`, `osmnx`

**Frontend:** Next.js (App Router), Tailwind CSS v4, Leaflet.js + OSM tiles, Radix UI, REST polling

**Explicitly excluded:** LangChain, LangGraph, CrewAI, AutoGen, Docker, Kubernetes, microservices

---

## Project Structure

```
ResQ/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # rainfall, wards, replay, pipeline
│   │   ├── agents/              # risk, timing, impact, action agents
│   │   ├── pipeline/            # orchestrator, models, validators
│   │   ├── data/                # rainfall, elevation, hotspots, osm, historical
│   │   ├── services/
│   │   └── storage/
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/                 # Next.js pages
│       ├── components/site/     # shell, chat, motion
│       └── lib/                 # mock data, utils
├── data/                        # wards, hotspots, elevation, osm, historical
├── docs/                        # architecture, demo-script, data-sources
└── README.md
```

---

## Setup

### Prerequisites
Python 3.x, Node.js, npm, Git

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:
```env
ANTHROPIC_API_KEY=<your-api-key>
RAINFALL_API_URL=<rainfall-api-url>
```

Run:
```bash
uvicorn app.main:app --reload --port 8000
```
Available at `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Available at `http://localhost:3000`

> Before a live demo, pre-cache: ward boundaries, SRTM elevation data, GHMC hotspot data, and OSM infrastructure data.

---

## Scope & Non-Goals

ResQ does **not** attempt to:
- Physically model drainage networks, nala capacity, or fluid dynamics
- Solve civil infrastructure planning
- Provide city-wide coverage (limited to 3–5 wards)
- Support multi-user auth or production persistence
- Use multi-agent negotiation/orchestration frameworks

---

## Success Criteria

1. End-to-end pipeline (Rainfall → Risk → Timing → Impact → Action) runs for ≥1 ward without manual intervention
2. A real historical Hyderabad flood event replays and produces a valid result for a ward that actually flooded
3. Every pipeline stage is visible in the dashboard
4. Output actions are concrete and specific
5. Full demo runs locally, no network dependency
6. Clear distinction between real data, cached data, deterministic output, and LLM-generated output

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Overpass API unavailable | Cache all OSM data pre-demo |
| LLM response slow/malformed | Keep prompt minimal; validate structured output |
| Venue Wi-Fi fails | Run fully local with cached data |
| Timing estimate oscillates | Smooth/constrain trend calculation |
| Scope creep | Hard cap at 3–5 wards |

---

## Design Principles

| Principle | Description |
|---|---|
| Reliability over complexity | Every feature judged by whether it improves the demo |
| Explainability over black-box | Stages 1–3 fully understandable from inputs/formulas |
| Determinism where possible | Risk, timing, impact are reproducible |
| AI where it adds value | LLM used only for final reasoning/communication |
| Local-first demo | Critical functionality works offline |
| Small, defensible scope | Fewer wards, real verifiable data preferred |

---

## License

MIT License — see `LICENSE` file for details.

---

> **In one line:** Turn rainfall into actionable emergency intelligence before flooding becomes visible — deterministic where possible, AI only where it adds value.
