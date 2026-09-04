# README.md

```markdown
# ResQ — Flash Flood Early Warning & Response System

A rainfall-intensity-driven flood prediction and response platform for Hyderabad's
Uppal / LB Nagar / Nagole corridor, combining deterministic hydrological logic with
a coordinated multi-agent AI pipeline for hazard classification, verification, and
routing.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Core Demo Flow](#core-demo-flow)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview <a id="overview"></a>

**ResQ** is a hackathon-built decision-support platform addressing a specific,
well-documented gap in disaster response: official flood alerts report total
rainfall over 24 hours, which conceals the actual danger. Drainage infrastructure
in Hyderabad's eastern corridor typically handles only 12-20mm of rainfall per
hour. A 60mm downpour spread across 12 hours is manageable; the same 60mm falling
in 45 minutes overwhelms the system almost immediately. No current public system
distinguishes between these two scenarios.

The corridor — Uppal, LB Nagar, and Nagole — also has the fastest-growing
flood-risk footprint in the city, as former agricultural catchment has converted to
concrete faster than drainage capacity has kept pace. Historically, this land
drained through a network of interconnected lakes following natural contours;
urban construction severed these connections, so water still follows old paths but
now meets blocked or narrowed drains instead of open cascades. This means flooding
in one sub-zone is frequently a downstream consequence of an upstream basin
filling, not an isolated local event.

ResQ addresses this gap directly:

- Structured, real-time-style hazard prediction using rainfall rate against known
  drain capacity thresholds
- Basin-cascade modeling so downstream risk can be anticipated before local
  rainfall alone would indicate it
- Explainable shelter ranking instead of an opaque score
- An evidence-state system that distinguishes verified, unverified, and
  AI-flagged reports rather than treating all information as equally trustworthy
- Hazard-aware routing that avoids secondary dangers like open manholes and live
  wiring, not just standing water

---

## Key Features <a id="key-features"></a>

### Rainfall-Rate Breach Prediction

- Deterministic comparison of live rainfall rate against fixed drain capacity
- Predicts which sub-zone breaches first and an estimated time-to-overflow
- No LLM involved — pure hydraulic threshold logic

---

### Basin-Cascade Risk Modeling

- Basins tagged with upstream/downstream relationships
- Downstream sub-zones flagged as elevated risk when an upstream basin nears
  capacity, independent of local rainfall alone

---

### Explainable Shelter Ranking

- Shelters scored on distance, capacity, flood exposure, and basin position
- Every ranking is shown with a human-readable reason, not a black-box score

---

### Evidence-State Verification

- Every report tagged: OFFICIAL, UNVERIFIED, AI SIGNAL, STALE, or DISPUTED
- Rule-based verification by default; conflicting or corroborating reports
  adjust confidence automatically

---

### Live Hazard Classification

- Free-text ground reports classified live via an AI call during operation
- Returns structured hazard type and confidence score
- Hardcoded fallback ensures the system never shows a broken state if the API
  call fails

---

### Hazard-Aware Emergency Routing

- SOS flow computes a simulated route to the nearest safe shelter
- Route avoids known hazard points such as open manholes and exposed wiring
- Animated marker simulates real-time movement toward safety

---

### Four-Agent Coordination Pipeline

- Classifier, Risk, Verifier, and Router — four distinct functional responsibilities
- Implemented as plain, composable functions, not an agent framework
- Chosen deliberately: fixed, known inputs and outputs do not require the
  overhead of dynamic tool orchestration

---

## Tech Stack <a id="tech-stack"></a>

### Frontend

- **Next.js 16** — routing, rendering, and API integration
- **Tailwind CSS** — utility-first styling
- **Leaflet + OpenStreetMap** — map rendering, no API key required

---

### Backend

- **Node.js** — server runtime
- **Express** — REST API framework
- Four agent functions (Classifier, Risk, Verifier, Router) run in sequence from a
  single backend route

---

### Database & Data Layer

- **PostgreSQL** — relational storage for sub-zones, basins, shelters, hazard
  points, and reports
- **Prisma ORM** — type-safe database access and migrations
- Seed data loaded into memory on backend start for fast reads during operation

---

### AI

- **Featherless AI API** — called from the backend only, never exposed to the
  frontend
- OpenAI SDK-compatible client used for integration
- Used exclusively by the Classifier agent; Risk logic is deterministic math and
  Verifier logic is rule-based by default

---

### Infrastructure & Deployment

- No containerization, no orchestration, no message queues
- Local-first setup for development and demonstration
- **Vercel** (frontend) and **Render / Railway** (backend + Postgres) only if a
  shareable deployment is required

---

### Repository Structure

- Two independent folders — `frontend/` and `backend/`
- No monorepo tooling; each folder has its own `package.json` and is installed
  and run separately

---

## Setup Instructions <a id="setup-instructions"></a>

### 1. Clone the Repository

```bash
git clone https://github.com/<org>/resq.git
cd resq
```

### 2. Backend Setup

Create a `.env` file inside `backend/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/resq"
FEATHERLESS_API_KEY="your_key_here"
FEATHERLESS_BASE_URL="https://api.featherless.ai/v1"
PORT=4000
```

Install dependencies and initialize the database:

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

```
App running at: http://localhost:4000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

```
App running at: http://localhost:3000
```

---

## Core Demo Flow <a id="core-demo-flow"></a>

1. Map loads showing the Uppal / LB Nagar / Nagole corridor with shelters, basins,
   and hazard points
2. A rainfall rate is entered — the Risk agent predicts which sub-zone breaches
   first and when
3. Shelters are shown ranked by SafetyScore, with visible reasoning
4. The evidence feed displays existing ground reports tagged by trust level
5. A new report is typed live — the Classifier agent calls the AI API and returns
   hazard type and confidence in real time
6. SOS is triggered — the Router agent computes a path avoiding hazard points and
   animates movement toward the nearest safe shelter

---

## Future Enhancements <a id="future-enhancements"></a>

- Real-time rainfall sensor and IoT data ingestion
- Integration with official municipal data sources (GHMC, TGSPDCL)
- Expansion beyond the Uppal / LB Nagar / Nagole corridor to full city coverage
- Real routing engine integration in place of simulated waypoints
- Multi-role authentication for citizens, responders, and administrators
- Relief camp resource matching and coordination
- LLM-assisted verification for ambiguous or high-volume report conditions

---

## Contributing <a id="contributing"></a>

Contributions are welcome. Please open an issue or pull request describing the
proposed change before submitting significant modifications.

---

## License <a id="license"></a>

This project is licensed under the MIT License — see the LICENSE file for details.
```
