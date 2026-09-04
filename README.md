# ResQ — AI-Powered Flood Intelligence & Emergency Response System

ResQ is an AI-powered flood intelligence and emergency response platform designed to help disaster-response teams move from reactive flood management to proactive, data-driven decision-making.

The system combines rainfall data, elevation information, known flood-prone locations, population and critical infrastructure data, and AI-assisted action planning into a sequential intelligence pipeline.

ResQ is designed around four core questions:

- Where is the flood risk increasing?
- When could a ward become critical?
- Who and what could be affected?
- What action should emergency responders take?

The project is scoped for a hackathon demonstration and focuses on a small, verifiable set of Hyderabad wards rather than attempting city-wide hydraulic simulation.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Project Goal](#project-goal)
- [How ResQ Works](#how-resq-works)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Pipeline Stages](#pipeline-stages)
- [Historical Event Replay](#historical-event-replay)
- [Data Sources and Processing](#data-sources-and-processing)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Dashboard and User Experience](#dashboard-and-user-experience)
- [Setup Instructions](#setup-instructions)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Build Plan](#build-plan)
- [Demo Strategy](#demo-strategy)
- [Risks and Mitigations](#risks-and-mitigations)
- [Scope and Non-Goals](#scope-and-non-goals)
- [Future Enhancements](#future-enhancements)
- [Success Criteria](#success-criteria)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ResQ is a modular flood intelligence and emergency response system built for rapid decision support during intense rainfall and cloudburst events.

Hyderabad experiences recurring flooding and waterlogging, with chronic problem locations already identified by GHMC. However, emergency response can become reactive: response teams are often deployed after flooding becomes visible on the ground.

ResQ addresses the intelligence gap between rainfall information and operational response.

Instead of stopping at a generic warning such as:

> Heavy rainfall detected.

ResQ aims to produce an operationally useful sequence:

> A specific ward is becoming high risk → the estimated time to critical conditions is decreasing → specific population and infrastructure are exposed → specific emergency actions are recommended.

The platform therefore acts as an intelligence and response layer rather than a physical drainage or hydraulic simulation system.

The architecture deliberately keeps the first three stages deterministic and reserves AI/LLM reasoning for the final action-planning stage. This makes the system easier to reproduce, test, explain, and demonstrate.

---

## Problem Statement

Hyderabad has known flood and waterlogging hotspots. GHMC has identified 123 chronic waterlogging points across the city and categorized them by severity using A/B/C classifications.

These locations are associated with known factors such as:

- Blocked drains
- Low-lying construction
- Congested roads
- Localized rainfall accumulation
- Areas with historically recurring waterlogging

Despite the availability of this information, emergency response during severe rainfall can remain manual and reactive.

The central problem addressed by ResQ is:

> How can rainfall information be continuously converted into a specific, understandable emergency-response recommendation for the areas most likely to become critical in the next few minutes?

ResQ attempts to answer this by combining:

- Rainfall intensity
- Relative elevation
- Known flood hotspot proximity
- Risk scoring
- Time-to-critical estimation
- Population and infrastructure exposure
- AI-assisted emergency action planning

---

## Project Goal

The primary goal is to build a working, demoable, end-to-end flood intelligence pipeline capable of:

- Ingesting rainfall information.
- Supporting both live rainfall input and a historical event replay.
- Calculating flood risk for selected wards.
- Using elevation and known hotspot information in the risk calculation.
- Estimating how quickly a ward may approach a critical risk level.
- Identifying population and important infrastructure in affected wards.
- Recommending concrete emergency actions.
- Displaying the reasoning process as a live trace.
- Replaying a real historical Hyderabad flood event during the demonstration.
- Showing how the system could have produced useful response recommendations before or during the event.

The project is intentionally optimized for a reliable hackathon demonstration rather than production-scale deployment.

---

## How ResQ Works

ResQ uses a sequential four-stage intelligence pipeline.

```
Rainfall Data
     |
     v
+----------------+
|  Stage 1       |
|  Risk Agent    |
+----------------+
     |
     v
Risk Score + Risk Category
     |
     v
+----------------+
|  Stage 2       |
|  Timing Agent  |
+----------------+
     |
     v
Time-to-Critical + Trend
     |
     v
+----------------+
|  Stage 3       |
|  Impact Agent  |
+----------------+
     |
     v
Population + Hospitals + Roads + Schools
     |
     v
+----------------+
|  Stage 4       |
|  Action Agent  |
|  LLM Reasoning |
+----------------+
     |
     v
Recommended Emergency Actions
     |
     v
Dashboard + Live Reasoning Trace
```

The four stages correspond to the operational questions:

| Question | ResQ Stage | Output |
|---|---|---|
| Where? | Risk Agent | Risk score and category |
| When? | Timing Agent | Estimated time-to-critical |
| Who/What? | Impact Agent | Population and infrastructure |
| What action? | Action Agent | Emergency response recommendations |

---

## Core Features

### AI-Powered Emergency Action Planning

The final stage uses a direct LLM request to transform structured impact information into concrete emergency recommendations.

The model receives upstream JSON data and produces structured output containing:

- Ward identifier
- Recommended actions
- Human-readable summary sentence

The action vocabulary is intentionally constrained to keep the output predictable and operationally understandable.

Example action categories include:

- Dispatch response team
- Close or restrict a road
- Open or prepare a shelter
- Issue an alert

The LLM is not responsible for calculating the underlying flood risk. It receives the results of deterministic upstream stages and converts them into an operational recommendation.

### Deterministic Flood Risk Scoring

ResQ calculates a reproducible risk score for each selected ward.

The score considers:

- Rainfall rate
- Relative elevation
- Proximity to known GHMC waterlogging hotspots
- Hotspot severity category

The risk score is normalized to a range of 0 to 1 and mapped to a risk category.

The same input should always produce the same Stage 1 result.

### Time-to-Critical Estimation

The Timing Agent analyzes the historical sequence of risk scores for a ward.

It produces:

```json
{
  "ward_id": "WARD_ID",
  "eta_minutes_to_critical": 20,
  "trend": "increasing"
}
```

The timing calculation is intentionally simplified. It may use linear extrapolation, category-weighted trend estimation, or risk progression over successive readings. It is not intended to reproduce a hydraulic simulation.

### Population and Infrastructure Impact Analysis

Once a ward is identified as approaching critical conditions, ResQ determines what could be affected.

The Impact Agent uses locally cached OSM information to identify:

- Population estimates or population proxies
- Hospitals
- Major roads
- Schools

This converts a numeric risk score into a practical picture of potential impact.

### Live Reasoning Trace

A key part of the dashboard is visibility into the pipeline.

Instead of displaying only the final answer, the UI exposes intermediate outputs such as:

```
Rainfall input received
        ↓
Ward risk calculated
        ↓
Risk trend increasing
        ↓
Time-to-critical estimated
        ↓
Infrastructure identified
        ↓
Emergency action generated
```

### Historical Flood Event Replay

ResQ includes a replay mode for a real historical Hyderabad rainfall/flood event. The replay feeds historical rainfall values into the same pipeline used for the live demonstration.

### Local-First Demonstration

The live demo is designed to run on localhost. External data required for the demonstration is prepared and cached before the event. This minimizes dependence on venue Wi-Fi, live Overpass requests, and unpredictable external data availability.

---

## System Architecture

```
                         +----------------------+
                         |     Data Sources      |
                         +----------+-----------+
                                    |
                +-------------------+-------------------+
                |                   |                   |
                v                   v                   v
         Rainfall Data       Elevation Data       GHMC Hotspots
                |                   |                   |
                +-------------------+-------------------+
                                    |
                                    v
                         +----------------------+
                         |    Risk Agent        |
                         | Deterministic Logic  |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |   Timing Agent       |
                         | Trend Extrapolation  |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |    Impact Agent      |
                         |   OSM Data Filter    |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |    Action Agent      |
                         |   Direct LLM Call    |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |    FastAPI Backend   |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         | Next.js Frontend     |
                         | Map + Trace + Status  |
                         +----------------------+
```

### Architecture Principles

**Sequential Rather Than Multi-Agent Graph**

The four stages form a direct decision pipeline. There is no requirement for agent negotiation, agent-to-agent conversation, complex graph orchestration, or multiple autonomous planning loops.

**LLM Only Where Reasoning Adds Value**

Stages 1–3 are deterministic. The LLM is used only for Stage 4 because the action recommendation benefits from natural-language reasoning over structured impact information.

**Local Cached Data**

OSM and elevation data are prepared before the demonstration. The live pipeline reads local data instead of depending on external geographic APIs during the demo.

---

## Pipeline Stages

### Stage 1 — Risk Agent

**Input:** Rainfall rate (mm/hr), elevation profile, GHMC hotspot proximity and category, ward information.

**Output:**
```json
{
  "ward_id": "ward-001",
  "risk_score": 0.84,
  "category": "high"
}
```

**Requirements:** Deterministic, reproducible, fast, explainable. Same input produces same output.

---

### Stage 2 — Timing Agent

**Input:** Historical risk score sequence for a ward.

**Output:**
```json
{
  "ward_id": "ward-001",
  "eta_minutes_to_critical": 18,
  "trend": "increasing"
}
```

**Requirements:** Stable across consecutive readings, avoids visible oscillation, monotonic-feeling progression, computationally lightweight.

---

### Stage 3 — Impact Agent

**Input:** Wards flagged by Stage 2, cached OSM infrastructure data.

**Output:**
```json
{
  "ward_id": "ward-001",
  "population_estimate": 45000,
  "hospitals": ["Hospital A", "Hospital B"],
  "major_roads": ["Road A", "Road B"],
  "schools": ["School A"]
}
```

**Requirements:** Uses real OSM-derived data, cached before demonstration, deterministic lookup.

---

### Stage 4 — Action Agent

The Action Agent is the only LLM-based stage.

**Input:** Complete Stage 3 output.

**Output:**
```json
{
  "ward_id": "ward-001",
  "actions": ["dispatch team", "close road", "issue alert"],
  "summary_sentence": "Ward 001 is approaching critical flood risk and requires immediate response preparation."
}
```

**Requirements:** Structured JSON output, fixed action vocabulary, one human-readable summary sentence.

---

## Historical Event Replay

### Replay Flow

```
Select Historical Event → Load Historical Rainfall → Advance Replay Clock
→ Calculate Risk → Estimate Time-to-Critical → Identify Impact
→ Generate Action → Update Dashboard
```

The historical replay provides a concrete validation mechanism. Rather than demonstrating only a synthetic scenario, ResQ shows that its pipeline identifies a location that actually experienced flooding.

---

## Data Sources and Processing

| Source | Purpose | Tool |
|---|---|---|
| Live / historical rainfall | Primary dynamic input | Manual or API input |
| SRTM elevation data | Relative elevation per ward | `rasterio`, `elevation` |
| GHMC waterlogging hotspots | Risk scoring input | Static structured dataset |
| OpenStreetMap infrastructure | Impact analysis | `osmnx` (cached) |

---

## Tech Stack

### Backend

| Layer | Choice |
|---|---|
| Language | Python |
| Framework | FastAPI |
| Storage | SQLite / JSON |
| Validation | Pydantic |
| LLM | Direct Anthropic API (Stage 4 only) |
| Elevation | `rasterio`, `elevation` |
| Geographic data | `osmnx`, OpenStreetMap |

### Frontend

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS v4 |
| Map | Leaflet.js + OpenStreetMap tiles |
| Components | Radix UI primitives |
| Communication | REST API polling |

### Explicitly Excluded

The project intentionally does not depend on: LangChain, LangGraph, CrewAI, AutoGen, Docker, Kubernetes, or microservices.

---

## Project Structure

```
ResQ/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── rainfall.py
│   │   │       ├── wards.py
│   │   │       ├── replay.py
│   │   │       └── pipeline.py
│   │   ├── agents/
│   │   │   ├── risk_agent.py
│   │   │   ├── timing_agent.py
│   │   │   ├── impact_agent.py
│   │   │   └── action_agent.py
│   │   ├── pipeline/
│   │   │   ├── orchestrator.py
│   │   │   ├── models.py
│   │   │   └── validators.py
│   │   ├── data/
│   │   │   ├── rainfall/
│   │   │   ├── elevation/
│   │   │   ├── hotspots/
│   │   │   ├── osm/
│   │   │   └── historical_events/
│   │   ├── services/
│   │   │   ├── rainfall_service.py
│   │   │   ├── elevation_service.py
│   │   │   ├── osm_service.py
│   │   │   └── replay_service.py
│   │   ├── storage/
│   │   │   └── database.py
│   │   └── config.py
│   ├── tests/
│   │   ├── test_risk.py
│   │   ├── test_timing.py
│   │   ├── test_impact.py
│   │   └── test_pipeline.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                    ← Next.js App Router frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         ← Single-page SPA (all sections)
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── site/
│   │   │   │   ├── shell.tsx    ← Header, Footer, Ticker, Section, Tag
│   │   │   │   ├── chat.tsx     ← AI chat widget
│   │   │   │   └── motion.tsx   ← Boot reveal, scroll animations
│   │   │   ├── ai-elements/
│   │   │   └── providers.tsx
│   │   └── lib/
│   │       ├── mock-data.ts     ← Static demo data (swap for API later)
│   │       └── utils.ts
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── data/
│   ├── wards/
│   ├── hotspots/
│   ├── elevation/
│   ├── osm/
│   └── historical/
│
├── docs/
│   ├── architecture.md
│   ├── demo-script.md
│   └── data-sources.md
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## Data Flow

```
1. Rainfall Input
2. Ward Mapping
3. Elevation Lookup
4. GHMC Hotspot Lookup
5. Risk Calculation
6. Risk History Update
7. Time-to-Critical Estimation
8. Impact Lookup
9. Structured LLM Action Planning
10. API Response
11. Dashboard Update
```

A complete pipeline result:

```json
{
  "ward_id": "ward-001",
  "rainfall": { "rate_mm_hr": 85 },
  "risk": { "score": 0.84, "category": "high" },
  "timing": { "eta_minutes_to_critical": 18, "trend": "increasing" },
  "impact": {
    "population_estimate": 45000,
    "hospitals": [],
    "major_roads": [],
    "schools": []
  },
  "action": {
    "actions": ["dispatch team", "close road", "issue alert"],
    "summary_sentence": "Immediate response preparation is recommended for the affected ward."
  }
}
```

---

## Functional Requirements

### Risk Agent
- Accept rainfall rate per ward
- Use elevation information
- Use GHMC hotspot proximity and category
- Produce a 0–1 risk score and risk category
- Produce deterministic results

### Timing Agent
- Accept a sequence of historical risk readings
- Estimate time-to-critical
- Report direction of risk movement
- Maintain stable estimates across similar consecutive inputs

### Impact Agent
- Identify wards approaching critical conditions
- Query locally cached OSM information
- Return population estimates, hospitals, major roads, schools

### Action Agent
- Receive structured Stage 3 data
- Make one direct LLM request
- Produce structured JSON with fixed emergency-action vocabulary
- Return a human-readable summary sentence

### Dashboard
- Display selected wards and current risk state
- Visualize risk on a map
- Show pipeline progress and intermediate reasoning outputs
- Show affected infrastructure and recommended actions
- Provide historical replay controls

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Full pipeline runtime | Under 5 seconds per ward |
| Demo network dependency | Zero for cached data |
| Reproducibility | Same replay produces same Stage 1–3 outputs |
| Codebase complexity | Small enough for the entire team to explain |
| Data availability | All demo-critical geographic data cached locally |
| LLM reliability | Structured output validated before display |
| UI responsiveness | Reasoning trace visibly updates during pipeline execution |

---

## Dashboard and User Experience

### Main Map

Shows selected wards, relative risk state, flood-prone locations, and important infrastructure.

### Ward Risk Panel

Displays ward name, rainfall rate, risk score, risk category, trend, and estimated time-to-critical.

### Impact Panel

Displays population estimate, hospitals, major roads, and schools.

### Action Panel

Displays recommended response actions, AI-generated summary sentence, and urgency indication.

### Reasoning Trace

```
[12:01:02] Rainfall input received
[12:01:02] Evaluating Ward A
[12:01:03] Risk score calculated: 0.72
[12:01:03] Risk trend: increasing
[12:01:03] Estimated critical time: 24 minutes
[12:01:04] Impact data loaded
[12:01:04] Hospitals identified: 2
[12:01:04] Major roads identified: 3
[12:01:05] Action recommendation generated
```

---

## Setup Instructions

### Prerequisites

- Python 3.x
- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Abhishek01samal/AI_Disaster_Response_Community_Resilience.git
cd AI_Disaster_Response_Community_Resilience
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure Backend Environment

Create `backend/.env`:

```env
ANTHROPIC_API_KEY=<your-api-key>
RAINFALL_API_URL=<rainfall-api-url>
```

Do not commit real credentials to Git.

### 4. Prepare Geographic Data

Before the live demonstration, prepare and cache:

- Selected ward boundaries
- SRTM elevation data
- GHMC hotspot data
- OSM infrastructure data

### 5. Start the Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Backend available at: `http://localhost:8000`

### 6. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: `http://localhost:3000`

---

## Environment Configuration

```env
ANTHROPIC_API_KEY=<your-api-key>
RAINFALL_API_URL=<rainfall-provider-url>
```

Environment files containing credentials should never be committed. Use `.env.example` with placeholders only.

---

## Running the Application

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

## Development Workflow

Recommended implementation order:

```
Data Preparation → Risk Agent → Timing Agent → End-to-End Pipeline
→ Impact Agent → Action Agent → Map Dashboard → Live Trace
→ Historical Replay → Full Demo Validation
```

---

## Build Plan

| Task | Time Window | Deliverable |
|---|---|---|
| Scope lock | Hour 0–1 | Wards, event, pitch line |
| Rainfall data | Hour 1–4 | Live input + historical data |
| Elevation | Hour 1–4 | SRTM data for selected wards |
| Hotspot dataset | Hour 1–4 | Structured GHMC hotspot data |
| OSM data | Hour 4–8 | Cached infrastructure data |
| Risk Agent | Hour 6–10 | Tested risk calculation |
| Timing Agent | Hour 8–12 | Time-to-critical calculation |
| Pipeline integration | Hour 10–14 | Risk-to-timing pipeline |
| Impact Agent | Hour 12–16 | Infrastructure impact lookup |
| Action Agent | Hour 14–18 | Structured LLM output |
| Full backend pipeline | Hour 16–20 | Historical event replay end-to-end |
| Map skeleton | Hour 14–20 | Static ward map |
| Dashboard integration | Hour 18–24 | Live risk visualization |
| Reasoning trace | Hour 20–26 | Visible pipeline trace |
| Replay control | Hour 24–28 | Live historical replay |
| Dry run 1 | Hour 26–30 | Full demo-machine test |
| Bug triage | Hour 28–30 | Demo-critical fixes |
| Pitch deck | Hour 30–32 | Final presentation |
| Demo script | Hour 30–33 | Timed demonstration |
| Dry run 2 | Hour 32–34 | Timed demo + Q&A |
| Final polish | Hour 34–35 | UI and reliability polish |
| **Freeze** | **Hour 35–36** | **No new features** |

---

## Demo Strategy

1. **Establish the Problem** — Show Hyderabad's known waterlogging hotspots
2. **Start the System** — Display the ResQ dashboard with selected wards
3. **Risk Detection** — Risk Agent evaluates wards, shows score and category
4. **Time-to-Critical** — Timing Agent estimates time before critical conditions
5. **Impact Analysis** — Impact Agent identifies population, hospitals, roads, schools
6. **AI Action Recommendation** — Action Agent produces specific emergency actions
7. **Historical Replay** — Run the real historical Hyderabad event step-by-step
8. **Explain the Engineering** — "First three stages are deterministic data problems. Final stage uses LLM for human-readable operational recommendation."

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Overpass API unavailable during demo | Cache all required OSM data before the demo |
| LLM response is slow | Keep the prompt and output structured and minimal |
| LLM response is malformed | Validate structured output and prepare a replay fallback |
| Venue Wi-Fi fails | Run the demonstration locally with cached data |
| Risk model behaves unpredictably | Keep Stages 1–3 deterministic |
| Timing estimate jumps between ticks | Smooth or constrain the trend calculation |
| Scope expands too far | Keep the project limited to 3–5 wards |
| Demo path breaks | Test repeatedly on the actual demonstration machine |
| Judges challenge accuracy | Clearly state that the model is an intelligence layer, not a hydraulic simulation |

---

## Scope and Non-Goals

ResQ intentionally does **not** attempt to:

- Physically model drainage networks, nala capacity, or fluid dynamics
- Solve civil infrastructure planning (drain redevelopment, permeable surfaces)
- Provide city-wide coverage (limited to 3–5 selected wards)
- Include multi-user authentication or production persistence
- Use multi-agent negotiation or agent orchestration frameworks

---

## Future Enhancements

- **City-Wide Coverage** — Expand from 3–5 wards to broader Hyderabad coverage
- **Advanced Flood Modeling** — Incorporate hydrological models and water-level sensors
- **Real-Time Sensor Integration** — Rain gauges, road monitoring, IoT infrastructure
- **Citizen Alerting** — Mobile notifications, SMS, public dashboards
- **Advanced Prediction** — Models that learn from historical events
- **Production Infrastructure** — Authentication, cloud deployment, monitoring

---

## Success Criteria

ResQ is considered complete when:

1. **End-to-End Pipeline** — Rainfall → Risk → Timing → Impact → Action works for at least one ward without manual intervention.
2. **Historical Validation** — A real historical Hyderabad flood event can be replayed and produce a risk/action result for a ward that actually experienced flooding.
3. **Visible Reasoning** — Each major pipeline stage is visible in the dashboard.
4. **Specific Actions** — The final output contains concrete actions (dispatch team, close road, open shelter, issue alert).
5. **Self-Contained Demo** — The complete demonstration runs locally without depending on venue network reliability.
6. **Technical Honesty** — The project clearly distinguishes real data, cached data, deterministic calculations, simplified estimations, and LLM-generated recommendations.

---

## Design Principles

| Principle | Description |
|---|---|
| Reliability Over Complexity | Every feature evaluated based on whether it improves the core demonstration |
| Explainability Over Black-Box | Stages 1–3 understandable from their inputs and formulas |
| Determinism Where Possible | Risk, timing, and impact processing are reproducible |
| AI Where It Adds Value | LLM used for final reasoning and communication layer only |
| Local-First Demo | Critical demo functionality works without venue internet |
| Small, Defensible Scope | Smaller system with real, verifiable data preferred |

---

## Contributing

Contributions are welcome during development.

Before making a change, ensure that it does not unnecessarily expand the locked hackathon scope.

Recommended contribution process:

1. Create a focused branch.
2. Make the smallest change necessary.
3. Test the affected pipeline stage.
4. Run the complete demo path if the change affects integration.
5. Keep deterministic stages deterministic.
6. Avoid adding new frameworks unless they solve a demonstrated project requirement.
7. Document any change that affects the demo workflow.

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.

---

## Project Summary

ResQ is designed around a simple idea:

> Turn rainfall into actionable emergency intelligence before flooding becomes visible.

The system combines deterministic risk analysis, time-to-critical estimation, geographic impact analysis, and AI-assisted action planning into a single, explainable pipeline.

The hackathon implementation prioritizes:

- Real data where available
- Deterministic processing where possible
- AI only where it adds meaningful value
- Local reliability
- Historical validation
- Transparent reasoning
- Specific emergency actions
- A focused and defensible technical scope

The final objective is not to claim that ResQ can perfectly predict every flood. The objective is to demonstrate a practical intelligence layer that can transform changing rainfall conditions into a structured understanding of **where** the risk is, **when** it may become critical, **what** could be affected, and **what** responders should consider doing next.