# 🚢 Complete System Architecture, File Directory & Frontend-Backend Connection Guide

---

## 📑 Table of Contents
1. [Executive Summary & High-Level Architecture](#1-executive-summary--high-level-architecture)
2. [The Bridge: How Frontend & Backend Connect](#2-the-bridge-how-frontend--backend-connect)
3. [Backend File Directory & Detailed Function Reference](#3-backend-file-directory--detailed-function-reference)
4. [Frontend File Directory & Detailed Component Reference](#4-frontend-file-directory--detailed-component-reference)
5. [Data Flow Sequence (From User Click to MILP Result)](#5-data-flow-sequence-from-user-click-to-milp-result)
6. [How Backend Changes Impact the Frontend](#6-how-backend-changes-impact-the-frontend)
7. [Running & Testing the Entire Stack](#7-running--testing-the-entire-stack)

---

## 1. 🌐 Executive Summary & High-Level Architecture

The **Antigravity Maritime Supply Chain Optimization Platform** is a full-stack decision-support system designed for bulk maritime freight procurement (e.g. SAIL iron ore and coking coal procurement).

It is cleanly split into two distinct subsystems:
* **Frontend (React + Vite + TypeScript + Three.js + Tailwind CSS)**: An interactive command-center dashboard featuring a 3D Earth globe, shipment parameter modals, live telemetry ticker, What-If simulation sliders, and exportable procurement memos.
* **Backend (Python 3.10+ + FastAPI + SQLite + PuLP MILP Solver + Open-Meteo)**: A 7-layer data and mathematical optimization pipeline that ingests marine weather and port data, models multi-factor risks, computes quantile freight rate forecasts, enforces physical draft physics, and solves mixed-integer linear programs (MILP).

```
                      ┌────────────────────────────────────────────────────────┐
                      │              REACT FRONTEND (Port 5173)                │
                      │                                                        │
                      │  [3D Globe]   [Header Ticker]   [Recommended Plan]     │
                      │  [Shipment Form]  [What-If Simulator]  [Risk Panel]    │
                      └──────────────────────────┬─────────────────────────────┘
                                                 │
                                                 │ HTTP POST / JSON (REST API)
                                                 ▼
                      ┌────────────────────────────────────────────────────────┐
                      │           API CLIENT: src/services/api.ts              │
                      └──────────────────────────┬─────────────────────────────┘
                                                 │
                                                 │ http://127.0.0.1:8000
                                                 ▼
                      ┌────────────────────────────────────────────────────────┐
                      │              FASTAPI BACKEND (Port 8000)               │
                      │                   (backend/main.py)                    │
                      └────────┬────────────┬────────────┬───────────┬─────────┘
                               │            │            │           │
                 ┌─────────────┴───┐  ┌─────┴──────┐  ┌──┴─────────┐ │
                 │ Layer 1: Data   │  │ Layer 2:   │  │ Layer 3:   │ │
                 │ Ingestion (ETL) │  │ Risk Model │  │ Forecast   │ │
                 │  & SQLite DB    │  │ Geopol/Wx  │  │ MonteCarlo │ │
                 └─────────────────┘  └────────────┘  └────────────┘ │
                                                                     │
                 ┌───────────────────────────────────────────────────┴─────────┐
                 │ Layer 4: Physical Feasibility & Draft Filtering             │
                 │ Layer 5: Mixed-Integer Linear Program (PuLP MILP Solver)    │
                 │ Layer 6: Real-Time What-If Scenario Simulator (<200ms)      │
                 │ Layer 7: Procurement Approval Memo & Data Catalogs          │
                 └─────────────────────────────────────────────────────────────┘
```

---

## 2. 🔗 The Bridge: How Frontend & Backend Connect

Communication between the user interface and the Python optimization engine is handled via **asynchronous RESTful JSON APIs** enabled with Cross-Origin Resource Sharing (CORS).

### The Core Connection Points:

1. **[`frontend/src/services/api.ts`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/services/api.ts)**:
   * Acts as the single network gateway for the React application.
   * `runOptimization(payload)`: Serializes form inputs into JSON and sends a `POST` request to `http://127.0.0.1:8000/api/v1/optimize`.
   * `runWhatIfSimulation(payload)`: Sends dynamic parameter override adjustments to `http://127.0.0.1:8000/api/v1/optimize/what-if`.
   * `checkBackendHealth()`: Probes `http://127.0.0.1:8000/` to verify server connectivity.

2. **[`frontend/src/App.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/App.tsx#L44-L145)**:
   * Imports the methods from `api.ts`.
   * When the user clicks **"EXECUTE OPTIMIZATION"**, `handleStartOptimization()` calls the FastAPI solver asynchronously and stores the resulting Top-3 ranked plans directly into React state (`currentPlans` and `recommendedPlan`).
   * Contains safety fallback logic: If the Python backend is ever offline, the UI falls back seamlessly to simulated data without crashing.

3. **[`backend/main.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/main.py#L26-L37)**:
   * Enables CORS with `allow_origins=["*"]`, permitting the browser on `localhost:5173` to make cross-origin requests to `127.0.0.1:8000`.

4. **[`frontend/vite.config.ts`](file:///c:/Users/Pratyush/Desktop/sih/frontend/vite.config.ts)**:
   * Configures a local proxy so `/api` calls can be transparently routed to `http://127.0.0.1:8000`.

---

## 3. ⚙️ Backend File Directory & Detailed Function Reference

All backend code resides in the `backend/` directory.

### Summary Table

| File | Layer / Purpose | Key Functions / Responsibilities |
| :--- | :--- | :--- |
| **[`backend/main.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/main.py)** | FastAPI Entrypoint | Runs Uvicorn server on port 8000, configures CORS, registers Layer 6 & Layer 7 routers, provides root health check `/`. |
| **[`backend/app/api/layer1_data.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer1_data.py)** | Layer 1: Data Ingestion | Builds SQLite schema, fetches Open-Meteo marine wave/wind data, seeds static port/vessel catalogs, runs full ETL pipeline. |
| **[`backend/app/api/layer2_risk.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer2_risk.py)** | Layer 2: Risk Intelligence | Computes multi-factor composite risk (0.0 to 1.0) combining geopolitical risk, monsoon/cyclone weather hazards, and port congestion. |
| **[`backend/app/api/layer3_forecasting.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer3_forecasting.py)** | Layer 3: Rate Forecasting | Calculates freight quantiles (P10/P50/P90), runs 1,000-trial Monte Carlo transit simulations, determines optimal charter laycan windows. |
| **[`backend/app/api/layer4_rules.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer4_rules.py)** | Layer 4: Physics & Draft Rules | Computes Haversine nautical mile distances, validates vessel draft vs. port quay depths, prunes infeasible routes before optimization. |
| **[`backend/app/api/layer5_milp.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer5_milp.py)** | Layer 5: MILP Optimization | Formulates and solves the PuLP mathematical optimization model to find the Top-3 optimal route plans (Rank 1 Recommended, Rank 2 Runner-up, Rank 3 Resilient). |
| **[`backend/app/api/layer6_simulator.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer6_simulator.py)** | Layer 6: Simulator Router | Exposes `POST /api/v1/optimize` and `POST /api/v1/optimize/what-if` for sub-200ms parameter overrides. |
| **[`backend/app/api/layer7_export.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer7_export.py)** | Layer 7: Catalogs & Export | Exposes `GET /api/v1/ports`, `GET /api/v1/vessels`, and `POST /api/v1/export/procurement-memo` for board approval reports. |
| **[`backend/data/maritime_data.db`](file:///c:/Users/Pratyush/Desktop/sih/backend/data/maritime_data.db)** | SQLite Database | Persistent store containing tables: `ports`, `vessel_classes`, `suppliers`, `weather_telemetry`, `commodity_benchmarks`. |
| **[`backend/test_api_endpoints.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/test_api_endpoints.py)** | REST API Test Suite | Automated verification script testing all API endpoints for 200 OK status and correct response schemas. |
| **[`backend/test_pipeline.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/test_pipeline.py)** | Layer Pipeline Test Suite | Unit tests verifying individual mathematical outputs across Layers 1 to 5. |

---

## 4. 🎨 Frontend File Directory & Detailed Component Reference

All frontend user interface code resides in the `frontend/` directory.

### Summary Table

| File | Purpose / Role | Key Features & Responsibilities |
| :--- | :--- | :--- |
| **[`frontend/src/services/api.ts`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/services/api.ts)** | API Service Gateway | Handles all network requests (`fetch`) to FastAPI backend with error handling and health checking. |
| **[`frontend/src/App.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/App.tsx)** | Root Application Component | Orchestrates application state, handles modal states, monitors backend health, triggers optimization workflows. |
| **[`frontend/src/components/HeaderTicker.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/components/HeaderTicker.tsx)** | Top Telemetry Bar | Displays live UTC time, market marquee ticker (BDI, Bunker, Iron Ore), and live `🟢 FASTAPI BACKEND: CONNECTED` indicator badge. |
| **[`frontend/src/components/GlobeView.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/components/GlobeView.tsx)** | 3D Interactive Earth | WebGL/Three.js interactive globe showing geodesic vessel transit arcs, port depth rings, and animated cargo ship beacons. |
| **[`frontend/src/components/ShipmentForm.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/components/ShipmentForm.tsx)** | Optimizer Input Modal | Form allowing user to configure commodity, shipment tonnage (e.g. 150,000 MT), discharge port, laycan deadline, and risk tolerance. |
| **[`frontend/src/components/OptimizationModal.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/components/OptimizationModal.tsx)** | Solver Animation Overlay | Visual progress animation demonstrating mathematical solver steps (Draft Feasibility → Monte Carlo → PuLP MILP). |
| **[`frontend/src/components/RecommendedPlan.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/components/RecommendedPlan.tsx)** | Decision Support Panel | Right-hand drawer displaying Rank #1 plan, landed cost breakdown ($/MT), optimal charter date, explainability cards, and export button. |
| **[`frontend/src/components/TopNComparison.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/components/TopNComparison.tsx)** | Route Comparison Carousel | Bottom carousel comparing Top-3 plans (Optimal vs Runner-Up vs Resilient). Clicking any card focuses the 3D globe camera. |
| **[`frontend/src/components/RiskAnalysisPanel.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/components/RiskAnalysisPanel.tsx)** | Risk Breakdown Drawer | Radar chart and metrics detailing Geopolitical, Weather, Congestion, and Delay Probability scores. |
| **[`frontend/src/components/WhatIfSimulator.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/components/WhatIfSimulator.tsx)** | Real-Time Simulator | Interactive sliders for laycan window shifts (+/- 15 days), bunker price shifts (+/- 50%), and congestion multipliers. |
| **[`frontend/src/components/PortDetailModal.tsx`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/components/PortDetailModal.tsx)** | Port Deep-Dive Modal | Displays port specifications (max draft, quay length, discharge rate, historical congestion) when clicking any port on the globe. |
| **[`frontend/src/data/mockData.ts`](file:///c:/Users/Pratyush/Desktop/sih/frontend/src/data/mockData.ts)** | Type Definitions & Fallback Data | TypeScript interfaces (`RoutePlan`, `Port`, `VesselClass`, `Commodity`) and offline baseline data. |
| **[`frontend/vite.config.ts`](file:///c:/Users/Pratyush/Desktop/sih/frontend/vite.config.ts)** | Vite Configuration | Sets dev server port to 5173, enables TailwindCSS, and sets up `/api` reverse proxy. |

---

## 5. 🔄 Data Flow Sequence (From User Click to MILP Result)

Here is the exact lifecycle of an optimization request:

```text
1. USER CLICKS "INITIALIZE OPTIMIZER"
   └─► User selects Iron Ore, 150,000 MT to Paradip in `ShipmentForm.tsx`.
   └─► `App.tsx` calls `runOptimization()` in `api.ts`.

2. FASTAPI RECEIVES REQUEST (`main.py` -> `layer6_simulator.py`)
   └─► Validates JSON payload using Pydantic `OptimizationRequest`.

3. LAYER 4: PHYSICAL PRUNING (`layer4_rules.py`)
   └─► Calculates distances from all origin export terminals to Paradip.
   └─► Checks vessel max draft against Paradip's 17.1m quay limit.
   └─► Filters out infeasible vessels and builds candidate pool.

4. LAYER 2 & LAYER 3: ENRICHMENT (`layer2_risk.py` & `layer3_forecasting.py`)
   └─► Evaluates weather hazards (Bay of Bengal / Indian Ocean) and geopolitical risks.
   └─► Computes P10/P50/P90 quantile freight forecasts and 1,000-trial Monte Carlo variance.

5. LAYER 5: MILP SOLVER (`layer5_milp.py`)
   └─► PuLP formulates the objective function: Minimize (Landed Cost + Risk Penalty).
   └─► Applies budget, schedule, and parcel size constraints.
   └─► PuLP CBC solver finds the mathematical optimum.
   └─► Sorts candidates and builds Top-3 structured plans.

6. FASTAPI RETURNS JSON RESPONSE (Status: 200 OK)
   └─► Returns JSON containing `plans`, `recommended_plan`, and `input_parameters`.

7. REACT FRONTEND UPDATES UI (`App.tsx`)
   └─► `currentPlans` state updates with live backend results.
   └─► 3D Globe camera smoothly rotates to focus on the optimal origin-destination arc.
   └─► Cost breakdown, charter timing date, and risk metrics update in real-time.
```

---

## 6. 🛠️ How Backend Changes Impact the Frontend

Because the backend runs with Uvicorn **hot-reloading (`reload=True`)**, any changes made in Python take effect immediately without restarting:

* **Customizing Risk Formulas in [`layer2_risk.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer2_risk.py)**: The updated composite risk score will immediately reflect in the **Risk Monitor** modal in the UI.
* **Modifying Vessel Specs or Ports in [`layer4_rules.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer4_rules.py)**: Directly alters which shipping routes pass physical draft checks.
* **Changing PuLP Weights in [`layer5_milp.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer5_milp.py)**: Adjusting the risk penalty multiplier changes which route is ranked as **#1 (Recommended Plan)**.
* **Adding New Data to SQLite [`maritime_data.db`](file:///c:/Users/Pratyush/Desktop/sih/backend/data/maritime_data.db)**: New ports and suppliers will dynamically appear on the 3D globe and in data catalogs.

---

## 7. 🚀 Running & Testing the Entire Stack

### Starting the Services:

**Terminal 1 — Start the Python FastAPI Backend:**
```bash
python backend/main.py
```
*Backend runs at: `http://127.0.0.1:8000` (Interactive API documentation at: `http://127.0.0.1:8000/docs`)*

**Terminal 2 — Start the React Frontend:**
```bash
cd frontend
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

### Running Automated Test Verification:

**To test all REST API endpoints:**
```bash
python backend/test_api_endpoints.py
```

**To test individual layer algorithms (MILP, Risk, Forecasting):**
```bash
python backend/test_pipeline.py
```
