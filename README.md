ResQ — AI-Powered Flood Intelligence & Emergency Response System

ResQ is an AI-powered flood intelligence and emergency response platform designed to help disaster-response teams move from reactive flood management to proactive, data-driven decision-making.

The system combines rainfall data, elevation information, known flood-prone locations, population and critical infrastructure data, and AI-assisted action planning into a sequential intelligence pipeline.

ResQ is designed around four core questions:

Where is the flood risk increasing?

When could a ward become critical?

Who and what could be affected?

What action should emergency responders take?

The project is scoped for a hackathon demonstration and focuses on a small, verifiable set of Hyderabad wards rather than attempting city-wide hydraulic simulation.

Table of Contents

Overview

Problem Statement

Project Goal

How ResQ Works

Core Features

System Architecture

Pipeline Stages

Historical Event Replay

Data Sources and Processing

Tech Stack

Project Structure

Data Flow

Functional Requirements

Non-Functional Requirements

Dashboard and User Experience

Setup Instructions

Environment Configuration

Running the Application

Development Workflow

Build Plan

Demo Strategy

Risks and Mitigations

Scope and Non-Goals

Future Enhancements

Success Criteria

Contributing

License

Overview

ResQ is a modular flood intelligence and emergency response system built for rapid decision support during intense rainfall and cloudburst events.

Hyderabad experiences recurring flooding and waterlogging, with chronic problem locations already identified by GHMC. However, emergency response can become reactive: response teams are often deployed after flooding becomes visible on the ground.

ResQ addresses the intelligence gap between rainfall information and operational response.

Instead of stopping at a generic warning such as:

Heavy rainfall detected.

ResQ aims to produce an operationally useful sequence:

A specific ward is becoming high risk → the estimated time to critical conditions is decreasing → specific population and infrastructure are exposed → specific emergency actions are recommended.

The platform therefore acts as an intelligence and response layer rather than a physical drainage or hydraulic simulation system.

The architecture deliberately keeps the first three stages deterministic and reserves AI/LLM reasoning for the final action-planning stage. This makes the system easier to reproduce, test, explain, and demonstrate.

Problem Statement

Hyderabad has known flood and waterlogging hotspots. GHMC has identified 123 chronic waterlogging points across the city and categorized them by severity using A/B/C classifications.

These locations are associated with known factors such as:

Blocked drains

Low-lying construction

Congested roads

Localized rainfall accumulation

Areas with historically recurring waterlogging

Despite the availability of this information, emergency response during severe rainfall can remain manual and reactive.

The central problem addressed by ResQ is:

How can rainfall information be continuously converted into a specific, understandable emergency-response recommendation for the areas most likely to become critical in the next few minutes?

ResQ attempts to answer this by combining:

Rainfall intensity

Relative elevation

Known flood hotspot proximity

Risk scoring

Time-to-critical estimation

Population and infrastructure exposure

AI-assisted emergency action planning

Project Goal

The primary goal is to build a working, demoable, end-to-end flood intelligence pipeline capable of:

Ingesting rainfall information.

Supporting both live rainfall input and a historical event replay.

Calculating flood risk for selected wards.

Using elevation and known hotspot information in the risk calculation.

Estimating how quickly a ward may approach a critical risk level.

Identifying population and important infrastructure in affected wards.

Recommending concrete emergency actions.

Displaying the reasoning process as a live trace.

Replaying a real historical Hyderabad flood event during the demonstration.

Showing how the system could have produced useful response recommendations before or during the event.

The project is intentionally optimized for a reliable hackathon demonstration rather than production-scale deployment.

How ResQ Works

ResQ uses a sequential four-stage intelligence pipeline.

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

The four stages correspond to the operational questions:

Question

ResQ Stage

Output

Where?

Risk Agent

Risk score and category

When?

Timing Agent

Estimated time-to-critical

Who/What?

Impact Agent

Population and infrastructure

What action?

Action Agent

Emergency response recommendations

Core Features

AI-Powered Emergency Action Planning

The final stage uses a direct LLM request to transform structured impact information into concrete emergency recommendations.

The model receives upstream JSON data and produces structured output containing:

Ward identifier

Recommended actions

Human-readable summary sentence

The action vocabulary is intentionally constrained to keep the output predictable and operationally understandable.

Example action categories include:

Dispatch response team

Close or restrict a road

Open or prepare a shelter

Issue an alert

The LLM is not responsible for calculating the underlying flood risk. It receives the results of deterministic upstream stages and converts them into an operational recommendation.

Deterministic Flood Risk Scoring

ResQ calculates a reproducible risk score for each selected ward.

The score considers:

Rainfall rate

Relative elevation

Proximity to known GHMC waterlogging hotspots

Hotspot severity category

The risk score is normalized to a range of 0 to 1 and mapped to a risk category.

The same input should always produce the same Stage 1 result.

Time-to-Critical Estimation

The Timing Agent analyzes the historical sequence of risk scores for a ward.

It produces:

{
  "ward_id": "WARD_ID",
  "eta_minutes_to_critical": 20,
  "trend": "increasing"
}

The timing calculation is intentionally simplified.

It may use:

Linear extrapolation

Category-weighted trend estimation

Risk progression over successive readings

It is not intended to reproduce a hydraulic simulation.

The primary requirement is a stable and understandable estimate that does not jump dramatically between similar readings.

Population and Infrastructure Impact Analysis

Once a ward is identified as approaching critical conditions, ResQ determines what could be affected.

The Impact Agent uses locally cached OSM information to identify:

Population estimates or population proxies

Hospitals

Major roads

Schools

This converts a numeric risk score into a practical picture of potential impact.

Live Reasoning Trace

A key part of the dashboard is visibility into the pipeline.

Instead of displaying only the final answer, the UI exposes intermediate outputs such as:

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

This makes the system easier for judges and users to understand and demonstrates that the final recommendation is produced through a defined pipeline.

Historical Flood Event Replay

ResQ includes a replay mode for a real historical Hyderabad rainfall/flood event.

The replay feeds historical rainfall values into the same pipeline used for the live demonstration.

This allows the system to demonstrate:

Historical Rainfall
       ↓
Risk Detection
       ↓
Timing Estimate
       ↓
Impact Identification
       ↓
Emergency Recommendation

The objective is to show that a ward that actually experienced flooding during the historical event would also have been flagged by the ResQ pipeline.

Local-First Demonstration

The live demo is designed to run on localhost.

External data required for the demonstration is prepared and cached before the event.

This minimizes dependence on:

Venue Wi-Fi

Live Overpass requests

Unpredictable external data availability

Repeated network calls

The local-first approach is an explicit reliability decision for the hackathon environment.

System Architecture

ResQ uses a sequential modular architecture.

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
                         | React + Vite UI      |
                         | Map + Trace + Status  |
                         +----------------------+

Architecture Principles

Sequential Rather Than Multi-Agent Graph

The four stages form a direct decision pipeline.

There is no requirement for:

Agent negotiation

Agent-to-agent conversation

Complex graph orchestration

Multiple autonomous planning loops

The sequential architecture is easier to build, debug, explain, and validate within the available development time.

LLM Only Where Reasoning Adds Value

Stages 1–3 are deterministic.

The LLM is used only for Stage 4 because the action recommendation benefits from natural-language reasoning over structured impact information.

This reduces:

Latency

API usage

Non-determinism

Debugging complexity

Risk of unexplained intermediate decisions

Local Cached Data

OSM and elevation data are prepared before the demonstration.

The live pipeline reads local data instead of depending on external geographic APIs during the demo.

Pipeline Stages

Stage 1 — Risk Agent

Input

The Risk Agent receives:

Rainfall rate in mm/hr for a ward

Elevation profile

GHMC hotspot proximity

GHMC hotspot category

Ward information

Processing

The risk score is calculated using a weighted deterministic formula.

Conceptually:

Risk =
    Rainfall Contribution
  + Elevation Contribution
  + Hotspot Proximity Contribution
  + Hotspot Severity Contribution

The implementation should normalize the result to:

0.0 <= risk_score <= 1.0

Output

{
  "ward_id": "ward-001",
  "risk_score": 0.84,
  "category": "high"
}

Requirements

Deterministic

Reproducible

Fast

Explainable

Same input produces same output

Stage 2 — Timing Agent

Input

The Timing Agent receives the historical risk score sequence for a ward.

Example:

t0 -> 0.32
t1 -> 0.41
t2 -> 0.53
t3 -> 0.64
t4 -> 0.74

Processing

The agent estimates the rate at which risk is increasing and projects the approximate time until the ward reaches the defined critical threshold.

Possible approaches:

Linear extrapolation

Smoothed trend estimation

Category-weighted risk progression

Output

{
  "ward_id": "ward-001",
  "eta_minutes_to_critical": 18,
  "trend": "increasing"
}

Requirements

The estimate should:

Be stable across consecutive readings

Avoid visible oscillation

Provide a monotonic-feeling progression

Remain computationally lightweight

Avoid claiming hydraulic-simulation accuracy

Stage 3 — Impact Agent

Input

The Impact Agent receives:

Wards flagged by Stage 2

Cached OSM infrastructure data

Processing

This stage performs data lookup and spatial filtering.

It does not attempt to simulate flooding.

The system identifies infrastructure and population information located within or associated with the affected wards.

Output

{
  "ward_id": "ward-001",
  "population_estimate": 45000,
  "hospitals": [
    "Hospital A",
    "Hospital B"
  ],
  "major_roads": [
    "Road A",
    "Road B"
  ],
  "schools": [
    "School A"
  ]
}

Requirements

Use real OSM-derived data for the selected wards

Cache the data before the demonstration

Avoid live Overpass dependency during the demo

Keep the lookup deterministic

Stage 4 — Action Agent

The Action Agent is the only LLM-based stage.

Input

The Action Agent receives the complete Stage 3 output.

Processing

A single structured LLM request is made using the upstream JSON.

The prompt constrains the model to the supported action vocabulary.

Output

{
  "ward_id": "ward-001",
  "actions": [
    "dispatch team",
    "close road",
    "issue alert"
  ],
  "summary_sentence": "Ward 001 is approaching critical flood risk and requires immediate response preparation."
}

Requirements

Structured JSON output

Fixed action vocabulary

One human-readable summary sentence

No frontend-side interpretation of free-form text

Clear relationship between impact data and recommended actions

Historical Event Replay

Historical replay is one of the central demonstration features of ResQ.

The system should contain a sourced historical Hyderabad rainfall/flood event with:

Event date

Rainfall figures

Affected ward or location

Documented impact

Supporting source information

The replay engine should feed the historical readings through the same pipeline used by the normal application.

Replay Flow

Select Historical Event
        |
        v
Load Historical Rainfall
        |
        v
Advance Replay Clock
        |
        v
Calculate Risk
        |
        v
Estimate Time-to-Critical
        |
        v
Identify Impact
        |
        v
Generate Action
        |
        v
Update Dashboard

Why Replay Matters

The historical replay provides a concrete validation mechanism.

Rather than demonstrating only a synthetic scenario, ResQ can show that its pipeline identifies a location that actually experienced flooding.

The demo should clearly distinguish:

Real historical data

Cached geographic data

Simplified risk calculations

AI-generated recommendations

This keeps the demonstration technically honest.

Data Sources and Processing

Rainfall Data

Rainfall is the primary dynamic input.

The system supports:

Live rainfall input

Historical rainfall data for replay

Historical rainfall should be prepared before the demo and stored locally.

Elevation Data

Elevation information is used as an input to the risk model.

The project uses SRTM-based elevation data.

Elevation processing is handled using:

rasterio

elevation

The objective is to derive relative elevation information for the selected wards rather than perform full hydraulic modeling.

GHMC Waterlogging Hotspots

GHMC's known waterlogging locations are converted into a structured geographic dataset.

The dataset includes:

Location

Ward association

Severity category

Geographic coordinates

The hotspot information is filtered to the selected 3–5 wards.

OpenStreetMap Infrastructure

OSM data is used for impact analysis.

The project uses osmnx to obtain relevant geographic information.

Target infrastructure includes:

Hospitals

Major roads

Schools

Population proxies where available

The data is downloaded and cached before the live demo.

Tech Stack

Backend

Python — Core backend and data-processing language

FastAPI — REST API framework

SQLite / JSON — Lightweight local storage

Pydantic / structured models — Validation of API and pipeline data

Direct Anthropic API — Stage 4 LLM request

Geospatial and Elevation

rasterio — Raster and elevation data processing

elevation — SRTM elevation data acquisition

osmnx — OpenStreetMap geographic data access

OpenStreetMap — Map and infrastructure data

Frontend

React — User interface framework

Vite — Frontend development and build tooling

Leaflet.js — Interactive map

OSM Tiles — Map visualization

Communication

REST APIs — Backend/frontend communication

Polling — Primary live-update mechanism

WebSocket — Optional only if proven reliable during the dry run

Infrastructure

Localhost — Primary demonstration environment

Explicitly Excluded

The project intentionally does not depend on:

LangChain

LangGraph

CrewAI

AutoGen

Docker

Kubernetes

Microservices

These technologies are excluded because they introduce additional setup and failure points without providing a necessary benefit for the scoped demonstration.

Project Structure

A recommended modular structure is:

ResQ/
|
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── rainfall.py
│   │   │   │   ├── wards.py
│   │   │   │   ├── replay.py
│   │   │   │   └── pipeline.py
│   │   │   └── dependencies.py
│   │   │
│   │   ├── agents/
│   │   │   ├── risk_agent.py
│   │   │   ├── timing_agent.py
│   │   │   ├── impact_agent.py
│   │   │   └── action_agent.py
│   │   │
│   │   ├── pipeline/
│   │   │   ├── orchestrator.py
│   │   │   ├── models.py
│   │   │   └── validators.py
│   │   │
│   │   ├── data/
│   │   │   ├── rainfall/
│   │   │   ├── elevation/
│   │   │   ├── hotspots/
│   │   │   ├── osm/
│   │   │   └── historical_events/
│   │   │
│   │   ├── services/
│   │   │   ├── rainfall_service.py
│   │   │   ├── elevation_service.py
│   │   │   ├── osm_service.py
│   │   │   └── replay_service.py
│   │   │
│   │   ├── storage/
│   │   │   └── database.py
│   │   │
│   │   └── config.py
│   │
│   ├── tests/
│   │   ├── test_risk.py
│   │   ├── test_timing.py
│   │   ├── test_impact.py
│   │   └── test_pipeline.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   ├── RiskPanel/
│   │   │   ├── ReasoningTrace/
│   │   │   ├── ReplayControls/
│   │   │   ├── WardDetails/
│   │   │   └── ActionPanel/
│   │   │
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── hooks/
│   │   │   └── usePipeline.js
│   │   │
│   │   ├── utils/
│   │   │   └── risk.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
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

The exact filenames can be adjusted during implementation, but the architecture should preserve separation between data ingestion, deterministic agents, LLM reasoning, API routes, and frontend presentation.

Data Flow

A typical ward evaluation follows this sequence:

1. Rainfall Input
      |
      v
2. Ward Mapping
      |
      v
3. Elevation Lookup
      |
      v
4. GHMC Hotspot Lookup
      |
      v
5. Risk Calculation
      |
      v
6. Risk History Update
      |
      v
7. Time-to-Critical Estimation
      |
      v
8. Impact Lookup
      |
      v
9. Structured LLM Action Planning
      |
      v
10. API Response
      |
      v
11. Dashboard Update

A complete pipeline result can conceptually contain:

{
  "ward_id": "ward-001",
  "rainfall": {
    "rate_mm_hr": 85
  },
  "risk": {
    "score": 0.84,
    "category": "high"
  },
  "timing": {
    "eta_minutes_to_critical": 18,
    "trend": "increasing"
  },
  "impact": {
    "population_estimate": 45000,
    "hospitals": [],
    "major_roads": [],
    "schools": []
  },
  "action": {
    "actions": [
      "dispatch team",
      "close road",
      "issue alert"
    ],
    "summary_sentence": "Immediate response preparation is recommended for the affected ward."
  }
}

The exact values depend on the selected ward, rainfall event, cached geographic data, and implementation.

Functional Requirements

Risk Agent

The system must:

Accept rainfall rate per ward.

Use elevation information.

Use GHMC hotspot proximity.

Use hotspot category.

Produce a 0–1 risk score.

Produce a risk category.

Produce deterministic results.

Timing Agent

The system must:

Accept a sequence of historical risk readings.

Estimate time-to-critical.

Report the direction of risk movement.

Maintain stable estimates across similar consecutive inputs.

Avoid unnecessary complexity.

Impact Agent

The system must:

Identify wards approaching critical conditions.

Query locally cached OSM information.

Return population estimates or population proxies.

Identify hospitals.

Identify major roads.

Identify schools.

Action Agent

The system must:

Receive structured Stage 3 data.

Make one direct LLM request.

Produce structured JSON.

Use a fixed emergency-action vocabulary.

Return a human-readable summary sentence.

Dashboard

The frontend must:

Display selected wards.

Display current risk state.

Visualize risk on a map.

Show pipeline progress.

Show intermediate reasoning outputs.

Show affected infrastructure.

Show recommended actions.

Provide historical replay controls.

Replay System

The replay system must:

Load a predefined historical event.

Advance through rainfall readings.

Run the same pipeline used for normal processing.

Update the dashboard as the event progresses.

Produce a final action recommendation.

Non-Functional Requirements

Requirement

Target

Full pipeline runtime

Under 5 seconds per ward

Demo network dependency

Zero for cached data

Reproducibility

Same replay produces the same Stage 1–3 outputs

Codebase complexity

Small enough for the entire team to explain

Data availability

All demo-critical geographic data cached locally

LLM reliability

Structured output validated before display

UI responsiveness

Reasoning trace should visibly update during pipeline execution

Dashboard and User Experience

The dashboard should be optimized for a live demonstration.

Main Map

The map should show:

Selected wards

Relative risk state

Flood-prone locations

Important infrastructure

Geographic context

Risk visualization should make it easy to identify the most critical ward immediately.

Ward Risk Panel

The panel should provide:

Ward name/identifier

Rainfall rate

Risk score

Risk category

Trend

Estimated time-to-critical

Impact Panel

The impact section should display:

Population estimate

Hospitals

Major roads

Schools

This answers the question:

What is actually at risk?

Action Panel

The final panel should display:

Recommended response actions

AI-generated summary sentence

A clear indication of urgency

This answers:

What should the response team do next?

Reasoning Trace

The reasoning trace should expose the pipeline sequence.

Example:

[12:01:02] Rainfall input received
[12:01:02] Evaluating Ward A
[12:01:03] Risk score calculated: 0.72
[12:01:03] Risk trend: increasing
[12:01:03] Estimated critical time: 24 minutes
[12:01:04] Impact data loaded
[12:01:04] Hospitals identified: 2
[12:01:04] Major roads identified: 3
[12:01:05] Action recommendation generated

The trace is a high-value part of the interface because it makes the system's internal stages visible rather than presenting an unexplained final answer.

Setup Instructions

Prerequisites

Install the following before starting:

Python 3.x

Node.js

npm

Git

The project is designed to run locally.

1. Clone the Repository

git clone <repository-url>
cd ResQ

Replace <repository-url> with the repository URL used by the team.

2. Backend Setup

Move into the backend directory:

cd backend

Create a virtual environment:

python -m venv venv

Activate it on Windows:

venv\Scripts\Activate.ps1

Activate it on macOS/Linux:

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

3. Configure Backend Environment

Create:

backend/.env

Use the project's environment example as the template.

The configuration should contain the credentials required for the Stage 4 LLM integration and any live rainfall provider used by the implementation.

Example:

ANTHROPIC_API_KEY=<your-api-key>
RAINFALL_API_URL=<rainfall-api-url>

Do not commit real credentials to Git.

4. Prepare Geographic Data

Before the live demonstration, prepare and cache:

Selected ward boundaries

SRTM elevation data

GHMC hotspot data

OSM infrastructure data

The live demo should read these prepared datasets locally.

This is particularly important for OSM/Overpass data because the application should not depend on a live Overpass request during the demonstration.

5. Start the Backend

From the backend directory:

uvicorn app.main:app --reload --port 8000

The backend should then be available at:

http://localhost:8000

If API documentation is enabled through FastAPI, it can normally be accessed from the backend's documentation endpoint.

6. Frontend Setup

Open another terminal and move into the frontend directory:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The Vite development server will provide the local dashboard URL shown in the terminal.

Environment Configuration

The final implementation may require environment variables for:

ANTHROPIC_API_KEY=<your-api-key>
RAINFALL_API_URL=<rainfall-provider-url>

Additional variables can be added if required by the implementation.

Environment files containing credentials should never be committed.

Recommended files:

.env
.env.example

The .env.example file should contain placeholders only.

Running the Application

A typical local development workflow is:

Terminal 1 — Backend

cd ResQ/backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

Terminal 2 — Frontend

cd ResQ/frontend
npm install
npm run dev

Then open the local frontend URL provided by Vite.

Development Workflow

The project should be built incrementally.

The recommended implementation order is:

Data Preparation
      ↓
Risk Agent
      ↓
Timing Agent
      ↓
End-to-End Pipeline
      ↓
Impact Agent
      ↓
Action Agent
      ↓
Map Dashboard
      ↓
Live Trace
      ↓
Historical Replay
      ↓
Full Demo Validation

This order protects the critical path.

The complete pipeline must work before spending significant time on visual polish.

Build Plan

The original project scope is designed around approximately 36 hours of development with a four-person team.

Task

Time Window

Deliverable

Scope lock

Hour 0–1

Wards, event, pitch line

Rainfall data

Hour 1–4

Live input + historical data

Elevation

Hour 1–4

SRTM data for selected wards

Hotspot dataset

Hour 1–4

Structured GHMC hotspot data

OSM data

Hour 4–8

Cached infrastructure data

Risk Agent

Hour 6–10

Tested risk calculation

Timing Agent

Hour 8–12

Time-to-critical calculation

Pipeline integration

Hour 10–14

Risk-to-timing pipeline

Impact Agent

Hour 12–16

Infrastructure impact lookup

Action Agent

Hour 14–18

Structured LLM output

Full backend pipeline

Hour 16–20

Historical event replay works end-to-end

Map skeleton

Hour 14–20

Static ward map

Dashboard integration

Hour 18–24

Live risk visualization

Reasoning trace

Hour 20–26

Visible pipeline trace

Replay control

Hour 24–28

Live historical replay

Dry run 1

Hour 26–30

Full demo-machine test

Bug triage

Hour 28–30

Demo-critical fixes

Pitch deck

Hour 30–32

Final presentation

Demo script

Hour 30–33

Timed demonstration

Dry run 2

Hour 32–34

Timed demo + Q&A

Final polish

Hour 34–35

UI and reliability polish

Freeze

Hour 35–36

No new features

Protected Development Path

Two milestones are non-negotiable:

End-to-end historical replay

Live replay demonstration

Features that do not directly contribute to these milestones should be deprioritized when the team is behind schedule.

Demo Strategy

The demonstration should tell a simple operational story.

Step 1 — Establish the Problem

Show that Hyderabad has known waterlogging hotspots and that heavy rainfall can create rapidly changing conditions.

Step 2 — Start the System

Display the ResQ dashboard with the selected wards.

Show rainfall input entering the system.

Step 3 — Risk Detection

Allow the Risk Agent to evaluate the wards.

Show:

Rainfall

Risk score

Risk category

Map state

Step 4 — Time-to-Critical

Show the risk trend increasing.

The Timing Agent estimates how long the ward has before reaching critical conditions.

Step 5 — Impact Analysis

The Impact Agent identifies:

Population

Hospitals

Major roads

Schools

This changes the narrative from:

"Flood risk is high."

to:

"These specific people and infrastructure could be affected."

Step 6 — AI Action Recommendation

The Action Agent receives the structured impact data.

The dashboard displays the recommended actions and summary sentence.

The action should be specific rather than a generic warning.

Step 7 — Historical Replay

Run the real historical Hyderabad event.

The system processes the event step-by-step while the audience watches the risk and response recommendation evolve.

Step 8 — Explain the Engineering

If asked why only one stage uses an LLM, the answer should be:

The first three stages are intentionally deterministic because they are data and calculation problems. The final stage uses an LLM because converting structured impact information into a human-readable operational recommendation is where language reasoning provides value.

This is a deliberate architectural decision.

Risks and Mitigations

Risk

Mitigation

Overpass API unavailable during demo

Cache all required OSM data before the demo

Overpass API rate limiting

Do not make live Overpass calls during the demo

LLM response is slow

Keep the prompt and output structured and minimal

LLM response is malformed

Validate structured output and prepare a replay fallback

Venue Wi-Fi fails

Run the demonstration locally with cached data

Risk model behaves unpredictably

Keep Stages 1–3 deterministic

Timing estimate jumps between ticks

Smooth or constrain the trend calculation

Scope expands too far

Keep the project limited to 3–5 wards

Team adds unnecessary agent frameworks

Preserve the sequential architecture

Demo path breaks

Test repeatedly on the actual demonstration machine

Judges challenge accuracy

Clearly state that the model is an intelligence layer, not a hydraulic simulation

Historical event lacks evidence

Select an event with sourced rainfall figures and documented impact before implementation freeze

Scope and Non-Goals

ResQ intentionally does not attempt to solve every aspect of urban flooding.

Not a Hydraulic Simulator

ResQ does not physically model:

Drainage networks

Nala capacity

Water flow through individual drains

Hydraulic propagation

Detailed fluid dynamics

The project does not claim hydraulic-simulation-grade accuracy.

Not Civil Infrastructure Planning

ResQ does not solve:

Drain redevelopment

Nala construction

Permeable surface planning

City drainage capacity

Long-term infrastructure investment

It is an intelligence and emergency-response layer.

Not City-Wide

The hackathon implementation is limited to approximately 3–5 selected wards.

This allows the team to maintain deeper and more verifiable data quality.

Not a Production ERP or Command System

The hackathon version does not include:

Multi-user authentication

Enterprise authorization

Production persistence

Large-scale user management

Full operational deployment

Not a General-Purpose AI Agent Framework

ResQ does not require:

Multi-agent negotiation

Agent graphs

Autonomous agent loops

Agent orchestration frameworks

The architecture remains intentionally small and explainable.

Future Enhancements

The current scope is intentionally constrained. A future production-oriented version could expand the system in several directions.

City-Wide Coverage

Expand from 3–5 wards to broader Hyderabad coverage.

This would require:

More geographic datasets

More infrastructure data

Better data management

Scalable processing

Advanced Flood Modeling

Future versions could incorporate more sophisticated:

Hydrological models

Hydraulic simulations

Drainage-network modeling

Water-level sensors

Historical flood-depth data

These should be treated as future improvements rather than assumptions in the current model.

Real-Time Sensor Integration

Future deployments could incorporate:

Rain gauges

Water-level sensors

Road monitoring

IoT infrastructure

Additional weather feeds

This would allow ResQ to move beyond rainfall-driven estimation toward multi-source situational awareness.

Citizen Alerting

A future version could provide an alert channel for residents in affected wards.

Possible channels include:

Mobile notifications

SMS

Public dashboards

Emergency communication systems

Citizen-facing alerting is outside the current hackathon scope.

Advanced Prediction

Future models could learn from historical events to improve:

Risk thresholds

Time-to-critical estimates

Ward-specific patterns

Action prioritization

Any such model should be validated against historical events before being used for operational decision-making.

Production Infrastructure

A production version could introduce:

Authentication

Role-based access

Persistent databases

Cloud deployment

Monitoring

Logging

High availability

API security

Audit trails

These are intentionally excluded from the current hackathon build.

Success Criteria

ResQ is considered complete when the following conditions are satisfied:

1. End-to-End Pipeline

Rainfall input can flow through:

Rainfall
→ Risk
→ Timing
→ Impact
→ Action

for at least one selected ward without manual intervention.

2. Historical Validation

A real historical Hyderabad flood event can be replayed and produce a risk/action result for a ward that actually experienced flooding during that event.

3. Visible Reasoning

Each major pipeline stage is visible in the dashboard rather than showing only the final recommendation.

4. Specific Actions

The final output contains concrete actions such as:

Dispatch team

Close road

Open shelter

Issue alert

rather than generic warnings.

5. Self-Contained Demo

The complete demonstration runs locally without depending on venue network reliability.

6. Technical Honesty

The project clearly distinguishes:

Real data

Cached data

Deterministic calculations

Simplified estimations

LLM-generated recommendations

The system does not claim capabilities that are not implemented.

Design Principles

Reliability Over Complexity

Every feature should be evaluated based on whether it improves the core demonstration.

Explainability Over Black-Box Processing

Stages 1–3 should be understandable from their inputs and formulas.

Determinism Where Possible

Risk, timing, and impact processing should be reproducible.

AI Where It Adds Value

The LLM should be used for the final reasoning and communication layer rather than unnecessarily inserting AI into every stage.

Local-First Demo

Critical demo functionality should continue working without venue internet.

Small, Defensible Scope

A smaller system with real, verifiable data is preferable to a broad system built around unsupported assumptions.

Team Responsibilities

The project can be divided into four primary workstreams.

Data and Backend

Responsibilities:

Rainfall ingestion

Historical event data

SRTM processing

OSM data acquisition

Local caching

API integration

ML and Logic

Responsibilities:

Risk scoring

Timing estimation

Impact processing

Action Agent prompt

Structured LLM output validation

Pipeline testing

Frontend

Responsibilities:

React/Vite dashboard

Leaflet map

Ward visualization

Risk panels

Impact panels

Action panel

Reasoning trace

Replay controls

Pitch and Data Story

Responsibilities:

Historical event sourcing

Problem narrative

Architecture explanation

Demo script

Pitch deck

Technical Q&A preparation

All team members should be able to explain the complete pipeline at a high level.

Demo Reliability Checklist

Before the final demonstration:

Selected wards are finalized.

Historical event is finalized.

Historical rainfall figures are sourced.

Historical impact is documented.

Elevation data is available locally.

GHMC hotspot data is available locally.

OSM data is cached locally.

Risk Agent produces deterministic output.

Timing Agent produces stable output.

Impact Agent reads cached data.

Action Agent produces valid structured output.

LLM fallback is prepared for the replay.

Backend starts successfully on the demo machine.

Frontend starts successfully on the demo machine.

Map renders correctly.

Reasoning trace updates correctly.

Replay controls work.

Full pipeline completes within the target runtime.

Demo has been rehearsed on the actual machine.

No new features are introduced after the final freeze.

Contributing

Contributions are welcome during development.

Before making a change, ensure that it does not unnecessarily expand the locked hackathon scope.

Recommended contribution process:

Create a focused branch.

Make the smallest change necessary.

Test the affected pipeline stage.

Run the complete demo path if the change affects integration.

Keep deterministic stages deterministic.

Avoid adding new frameworks unless they solve a demonstrated project requirement.

Document any change that affects the demo workflow.

License

This project is intended to be distributed under the MIT License.

If a LICENSE file is included in the repository, refer to that file for the complete license text.

Project Summary

ResQ is designed around a simple idea:

Turn rainfall into actionable emergency intelligence before flooding becomes visible.

The system combines deterministic risk analysis, time-to-critical estimation, geographic impact analysis, and AI-assisted action planning into a single, explainable pipeline.

The hackathon implementation prioritizes:

Real data where available

Deterministic processing where possible

AI only where it adds meaningful value

Local reliability

Historical validation

Transparent reasoning

Specific emergency actions

A focused and defensible technical scope

The final objective is not to claim that ResQ can perfectly predict every flood.

The objective is to demonstrate a practical intelligence layer that can transform changing rainfall conditions into a structured understanding of where the risk is, when it may become critical, what could be affected, and what responders should consider doing next.
