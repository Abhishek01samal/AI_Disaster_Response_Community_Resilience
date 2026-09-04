# ResQ — Flash Flood Early Warning & Response System

A rainfall-intensity-driven flood prediction and response platform for Hyderabad's
Uppal / LB Nagar / Nagole corridor, built with **Next.js 14** (App Router) and
deterministic hydrological logic.

---

## Overview

**ResQ** is a hackathon-built decision-support platform addressing a specific,
well-documented gap in disaster response: official flood alerts report total
rainfall over 24 hours, which conceals the actual danger. Drainage infrastructure
in Hyderabad's eastern corridor typically handles only 12-20mm of rainfall per hour.
A 60mm downpour spread across 12 hours is manageable; the same 60mm falling in 45
minutes overwhelms the system almost immediately. No current public system
distinguishes between these two scenarios.

The corridor — Uppal, LB Nagar, and Nagole — also has the fastest-growing
flood-risk footprint in the city, as former agricultural catchment has converted to
concrete faster than drainage capacity has kept pace. Historically, this land
drained through a network of interconnected lakes following natural contours;
urban construction severed these connections, so water still follows old paths but
now meets blocked or narrowed drains instead of open cascades. This means flooding
in one sub-zone is frequently a downstream consequence of an upstream basin
filling, not an isolated local event.

ResQ addresses this gap with a Next.js-based decision support system:

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

## Key Features

### Rainfall-Rate Breach Prediction

- Deterministic comparison of live rainfall rate against fixed drain capacity
- Predicts which sub-zone breaches first and an estimated time-to-overflow
- No LLM involved — pure hydraulic threshold logic

### Basin-Cascade Risk Modeling

- Basins tagged with upstream/downstream relationships
- Downstream sub-zones flagged as elevated risk when an upstream basin nears
  capacity, independent of local rainfall alone

### Explainable Shelter Ranking

- Shelters scored on distance, capacity, flood exposure, and basin position
- Every ranking displayed with a human-readable reason, not a black-box score

### Evidence-State Verification

- Every report tagged: OFFICIAL, UNVERIFIED, AI SIGNAL, STALE, or DISPUTED
- Rule-based verification by default; conflicting or corroborating reports
  adjust confidence automatically

### Live Hazard Classification

- Free-text ground reports classified live via an AI call during operation
- Returns structured hazard type and confidence score
- Hardcoded fallback ensures the system never shows a broken state if the API
  call fails

### Hazard-Aware Emergency Routing

- SOS flow computes a simulated route to the nearest safe shelter
- Route avoids known hazard points such as open manholes and exposed wiring
- Animated marker simulates real-time movement toward safety

### Four-Agent Coordination Pipeline

- Classifier, Risk, Verifier, and Router — four distinct functional responsibilities
- Implemented as plain, composable functions, not an agent framework
- Chosen deliberately: fixed, known inputs and outputs do not require the
  overhead of dynamic tool orchestration

---

## Tech Stack

### Frontend — Next.js 14 App Router

- **Next.js 14** — App Router, file-based routing, server components, and API routes
- **Tailwind CSS** — utility-first styling with custom monochrome design system
- **Leaflet + OpenStreetMap** — interactive map rendering, no API key required
- **shadcn/ui** — New York-style UI components with 0 border-radius, OKLCH colors
- **React Query** — server state management and data fetching
- **TanStack Router** — type-safe routing built on top of React

### Backend — Node.js + Express

- **Node.js** — server runtime
- **Express** — REST API framework for agent functions
- Four agent functions (Classifier, Risk, Verifier, Router) run in sequence from
  API routes

### Database & Data Layer

- **PostgreSQL** — relational storage for sub-zones, basins, shelters, hazard
  points, and reports
- **Prisma ORM** — type-safe database access and migrations
- Seed data loaded into memory on backend start for fast reads during operation

### AI

- **Featherless AI API** — called from the backend only, never exposed to the
  frontend
- OpenAI SDK-compatible client used for integration
- Used exclusively by the Classifier agent; Risk logic is deterministic math and
  Verifier logic is rule-based by default

### Infrastructure & Deployment

- No containerization, no orchestration, no message queues
- Local-first setup for development and demonstration
- **Vercel** (frontend) and **Render / Railway** (backend + Postgres) only if a
  shareable deployment is required

### Repository Structure

- Two separate folders — `frontend/` (Next.js 14 app) and `backend/` (Express API)
- No monorepo tooling; each folder has its own `package.json` and is installed
  and run independently

---

## Setup Instructions

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

App running at: `http://localhost:4000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App running at: `http://localhost:3000`, calls backend at `http://localhost:4000`

---

## Core Demo Flow

1. Map loads showing the Uppal / LB Nagar / Nagole corridor with shelters, basins,
   and hazard points (rendered with Leaflet + OpenStreetMap)
2. A rainfall rate (mm/hr) is entered via a UI control → the Risk agent (deterministic
   math) predicts which sub-zone breaches first and an estimated time-to-overflow
3. Shelters are shown ranked by SafetyScore, with a human-readable reason per shelter
   (e.g., "1.2km away, dry, not downstream of an at-risk basin")
4. The evidence feed displays existing ground reports tagged by trust level
   (OFFICIAL / UNVERIFIED / AI SIGNAL / STALE / DISPUTED)
5. A new report is typed live → the Classifier agent calls Featherless AI via the
   backend → hazard type and confidence appear in real time
6. SOS is triggered → the Router agent computes a simulated waypoint path avoiding
   hazard points → animated marker moves along the path on the map toward the
   nearest safe shelter

---

## Future Enhancements

- Real-time rainfall sensor and IoT data ingestion
- Integration with official municipal data sources (GHMC, TGSPDCL)
- Expansion beyond the Uppal / LB Nagar / Nagole corridor to full city coverage
- Real routing engine integration (Google Directions / OSRM) in place of simulated
  waypoints
- Multi-role authentication for citizens, responders, and administrators
- Relief camp resource matching and coordination
- LLM-assisted verification for ambiguous or high-volume report conditions

---

## Contributing

Contributions are welcome. Please open an issue or pull request describing the
proposed change before submitting significant modifications.

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.