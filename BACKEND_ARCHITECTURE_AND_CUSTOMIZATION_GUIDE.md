# 🚢 Maritime Supply Chain & Freight Optimization Engine
## 📘 Complete Backend Architecture, Layer-by-Layer Technical Guide & Customization Roadmap

---

## 📑 Table of Contents
1. [Executive Overview: What is this Project?](#-1-executive-overview-what-is-this-project)
2. [The Real-World Business Problem (Why this was built)](#-2-the-real-world-business-problem)
3. [The 7 Backend Layers: Deep-Dive, Tech Stack, Drawbacks & Customizations](#-3-the-7-backend-layers-deep-dive-tech-stack-drawbacks--customizations)
   - [Layer 1: Data Sources & Ingestion Pipeline](#layer-1-data-sources--ingestion-pipeline)
   - [Layer 2: Intelligence & Multi-Factor Risk Engine](#layer-2-intelligence--multi-factor-risk-engine)
   - [Layer 3: Rate Forecasting & Monte Carlo Scenario Generator](#layer-3-rate-forecasting--monte-carlo-scenario-generator)
   - [Layer 4: Deterministic Specs, Compatibility Rules & Physics Engine](#layer-4-deterministic-specs-compatibility-rules--physics-engine)
   - [Layer 5: Mixed-Integer Linear Programming (MILP) Optimization Engine](#layer-5-mixed-integer-linear-programming-milp-optimization-engine)
   - [Layer 6: Decision Support & Real-Time What-If Simulator](#layer-6-decision-support--real-time-what-if-simulator)
   - [Layer 7: Reporting, Export & Data Catalog Services](#layer-7-reporting-export--data-catalog-services)
4. [Master Backend File Map & Quick Reference](#-4-master-backend-file-map--quick-reference)
5. [How to Run and Test the Backend](#-5-how-to-run-and-test-the-backend)

---

## 🌟 1. Executive Overview: What is this Project?

This project is an **AI-Powered Maritime Freight & Raw Material Supply Chain Decision Engine**.

It is engineered for large-scale industrial enterprises (such as **Steel Authority of India Limited - SAIL**, blast furnace operators, thermal power utilities, and global trading desks) that import multi-million-ton parcels of bulk dry commodities (**Iron Ore Fines/Pellets, Premium Hard Coking Coal, and Thermal Coal**) from international mining origins (**Australia, Brazil, South Africa, Mozambique, Indonesia**) into discharge terminals across India (**Paradip, Visakhapatnam/Vizag, Haldia, Chennai, and JNPT Mumbai**).

The core of this platform is a **7-Layer Backend Decision Engine** that combines **relational data pipelines, multi-factor risk scoring, quantile rate forecasting, marine navigation physics, and Mixed-Integer Linear Programming (MILP)** to calculate the mathematically proven optimal procurement, routing, and chartering plan in **under 250 milliseconds**.

```mermaid
graph LR
    A[🌍 Global Suppliers & Mining Hubs] --> B[⚙️ 7-Layer Decision Engine]
    B --> C[📊 Optimal Landed Cost $/MT]
    B --> D[🛡️ Risk-Minimized Routing]
    B --> E[🌐 Interactive 3D Digital Twin Globe]
```

---

## 🎯 2. The Real-World Business Problem

When an industrial procurement committee needs to import **150,000 Metric Tons of Iron Ore**, manual decision-making using spreadsheets fails because of several competing factors:

1. **FOB Minegate Price vs. Ocean Freight Distance**:
   * Australian ore (e.g., BHP Port Hedland) has low sea transit (10–12 days to Paradip), whereas Brazilian ore (Vale Tubarão) takes 30–35 days around the Cape of Good Hope. However, Brazilian Carajás ore has a higher Fe purity ($65\%$ vs. $62\%$), altering blast furnace productivity.
2. **Vessel Draft vs. Port Channel Depth Limits**:
   * A **Capesize vessel** (180,000 DWT) offers the lowest freight cost per ton through economies of scale, but draws **18.2 meters of draft**. If the destination port is depth-restricted (e.g., **Haldia Dock Complex at 12.2 meters**), a Capesize will run aground! The cargo must either be downsized to a Geared Supramax or transshipped via lighterage.
3. **Bunker Fuel & Charter Rate Volatility**:
   * Very Low Sulphur Fuel Oil (VLSFO) prices fluctuate daily ($550–$750/MT). A ship burning 48 tons/day over a 30-day voyage consumes over **$1,000,000** in fuel alone. Fixing a vessel charter 3 days earlier vs. 5 days later can swing landed costs by millions.
4. **Geopolitical Chokepoints & Marine Hazards**:
   * War-risk insurance premiums in the Red Sea (Bab-el-Mandeb), draft restrictions in the Panama Canal, and cyclone seasons in the Bay of Bengal can cause costly demurrage delays ($20,000–$35,000/day idling at anchor).

**This backend automates this entire trade-off matrix to determine the global optimum of Landed Cost vs. Risk.**

---

## ⚙️ 3. The 7 Backend Layers: Deep-Dive, Tech Stack, Drawbacks & Customizations

Below is the complete engineering breakdown of each backend layer.

---

### Layer 1: Data Sources & Ingestion Pipeline

#### 1. What it Does
* Collects, cleans, standardizes, and stores operational maritime data across 6 core domains:
  1. **Freight & Market Indices**: Baltic Dry Index (BDTI/BDI), Freightos Baltic Container Index (FBX), World Bank Commodity Price Data (`market_freight_data` table).
  2. **Vessel Telemetry & Specs**: Vessel particulars (DWT, loaded draft, cruising speed, daily fuel consumption) (`vessel_particulars` table).
  3. **Port Infrastructure**: Max permissible draft, berth counts, UNCTAD liner connectivity index, historical turnaround times (`port_infrastructure` table).
  4. **Commodity Trade Data**: HS code trade volumes, benchmark FOB prices ($/MT) (`commodity_trade_data` table).
  5. **Weather & Marine Hazards**: Wind speeds (converted from m/s to knots), sea states, tropical storm alerts (`weather_hazards` table).
  6. **Supplier Directory**: Financial health ratings, ESG compliance scores, OFAC/UN sanctions flags (`supplier_directory` table).
* Ingests data into a local relational SQLite database (`backend/data/maritime_data.db`).

#### 2. Tech Stack & Tools
* **Language:** Python 3.13+
* **HTTP Client:** `requests` (with connection timeouts & error handling)
* **Data Wrangling:** `pandas` (type coercion, `.fillna()`, date parsing, duplicate dropping) & `numpy`
* **Database:** `sqlite3` relational database engine
* **Logging:** Standard library `logging`

#### 3. Exact Code Location
* **File:** [`backend/app/api/layer1_data.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer1_data.py)
* **Database:** [`backend/data/maritime_data.db`](file:///c:/Users/Pratyush/Desktop/sih/backend/data/maritime_data.db)
* **Main Functions:** `run_full_ingestion_pipeline()`, `fetch_and_clean_market_freight_data()`, `fetch_and_clean_vessel_data()`, `fetch_and_clean_port_data()`

#### 4. ⚠️ AI-Generated Drawbacks & Limitations
* **Synthetic Fallback Dependency:** When external API keys (Investing.com, MarineTraffic) are not provided in the environment, the script generates randomized mock values. In production, this can give false signals if an API key expires.
* **SQLite Concurrency Bottlenecks:** SQLite uses file-level locking. If multiple processes or background workers write simultaneously, it can throw `database is locked` exceptions.
* **Synchronous Polling:** Ingestion runs as a sequential batch script rather than an asynchronous, event-driven streaming pipeline.
* **Generic Commodities:** The World Bank indicator used (`POILAPSP`) tracks crude oil rather than true Platts 62% Fe Iron Ore Index or Argus Coking Coal daily assessments.

#### 5. 🛠️ Human Customization Roadmap (What you can build yourself)
1. **Migrate to PostgreSQL / TimescaleDB:** Replace SQLite with PostgreSQL for production multi-user concurrency and TimescaleDB extension for time-series rate indexing.
2. **Add Enterprise API Connectors:** Hook up real API integrations for S&P Global Platts, Argus Media, or Baltic Exchange API feeds using authenticated webhooks.
3. **Orchestrate with Celery / Airflow:** Set up cron jobs (e.g., every 6 hours) via Celery + Redis to asynchronously pull weather and AIS vessel positions without blocking the main server.

---

### Layer 2: Intelligence & Multi-Factor Risk Engine

#### 1. What it Does
* Converts qualitative and geopolitical events into normalized, quantifiable mathematical risk scores ranging strictly from **0.0 (Minimal Risk)** to **1.0 (Critical Risk)**.
* Evaluates 4 distinct risk dimensions:
  1. **Geopolitical Risk:** Evaluates origin/destination country baseline stability indices, supplier sanctions compliance, and proximity to maritime chokepoints (Bab-el-Mandeb / Red Sea, Strait of Hormuz, Malacca Strait, Suez Canal, Cape of Good Hope).
  2. **Weather Risk:** Ingests marine alerts from SQLite (`weather_hazards`) and evaluates spatial proximity to seasonal tropical cyclone belts (e.g., Bay of Bengal pre-monsoon/post-monsoon seasons).
  3. **Port Congestion Risk:** Measures historical turnaround hours and active waiting vessel queues at origin loading berths and destination discharge berths.
  4. **Delay Probability:** Computes the statistical likelihood of a voyage experiencing $>3$ days delay.
* Formulates descriptive human-readable audit signals (e.g., *"Voyage utilizes Cape Route to avoid Red Sea conflict corridor"*).

#### 2. Tech Stack & Tools
* **Language:** Python
* **Data Access:** SQLite `sqlite3.Row` dictionary cursor
* **Logic:** Multi-criteria weighted decision scoring algorithms and spatial bounding box evaluations

#### 3. Exact Code Location
* **File:** [`backend/app/api/layer2_risk.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer2_risk.py)
* **Main Functions:** `compute_comprehensive_route_risk()`, `evaluate_supplier_compliance()`, `evaluate_weather_hazards()`, `evaluate_port_congestion()`

#### 4. ⚠️ AI-Generated Drawbacks & Limitations
* **Static Rule Dictionaries:** Country risk scores (e.g., Australia = 0.05, Brazil = 0.20) and chokepoint penalties are hardcoded static numbers rather than dynamically updating from live geopolitical sentiment feeds.
* **Crude Spatial Bounding Boxes:** Weather hazard proximity uses simple rectangular lat/long boundary checks (`10.0 <= lat <= 22.0`) instead of true GIS polygon intersections against live NOAA storm cone shapefiles.
* **Absence of Live War-Risk Insurance Multipliers:** Geopolitical risk is treated as an abstract score rather than translating directly into Hull War Risk Insurance premiums ($/ton surcharge).

#### 5. 🛠️ Human Customization Roadmap (What you can build yourself)
1. **Integrate Real-Time LLM/NLP Event Extraction:** Connect a lightweight NLP pipeline (e.g., LangChain + HuggingFace FinBERT or OpenAI) to parse live maritime news feeds (Lloyd's List, TradeWinds, GDELT) and dynamically adjust supplier/port risk scores.
2. **Implement GeoPandas GIS Collision:** Use `geopandas` and `shapely` to perform exact polygon intersection between the planned vessel route waypoints and live NOAA active storm tracks / cyclone advisories.
3. **Map Risk to Actuarial Insurance Rates:** Formulate a direct monetary equation: $\text{War Risk Surcharge} = \text{Vessel Insured Value} \times \text{Risk Index} \times 0.005$.

---

### Layer 3: Rate Forecasting & Monte Carlo Scenario Generator

#### 1. What it Does
* **Quantile Freight Rate Forecasting:** Generates probabilistic price bands for freight landed cost per metric ton:
  * **$P_{10}$ (Optimistic Low Cost):** 10th percentile best-case rate.
  * **$P_{50}$ (Expected Baseline):** 50th percentile median expected rate.
  * **$P_{90}$ (Pessimistic High Cost):** 90th percentile conservative budget ceiling.
* **Monte Carlo Simulation ($N=50$ Iterations):** Simulates 50 randomized market states with price volatility drift and berth delay distributions to compute:
  * **$95\%$ CVaR (Conditional Value at Risk):** The expected landed cost in the worst $5\%$ market tail scenarios.
  * **On-Time Reliability Percentage:** The statistical probability of cargo arriving within the scheduled laycan window without severe demurrage.
* **Charter Window Optimization:** Analyzes the slope of recent freight indices to advise chartering desks (e.g., *"Immediate Fix within 24–48 hrs"* vs. *"Flexible Float"*).

#### 2. Tech Stack & Tools
* **Language:** Python
* **Math & Statistics:** `numpy` (normal & exponential sampling, percentiles, standard deviation)
* **ML Library:** `scikit-learn`
* **Time Management:** Python `datetime` & `timedelta`

#### 3. Exact Code Location
* **File:** [`backend/app/api/layer3_forecasting.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer3_forecasting.py)
* **Main Functions:** `forecast_freight_quantiles()`, `generate_monte_carlo_scenarios()`, `determine_optimal_charter_window()`

#### 4. ⚠️ AI-Generated Drawbacks & Limitations
* **Parametric Normal Distribution Assumption:** The Monte Carlo engine assumes freight rates follow a standard Gaussian distribution. In reality, maritime freight markets exhibit high kurtosis (fat tails), sudden price spikes, and asymmetric upside risk.
* **Linear Slope for Charter Timing:** The charter window advisor relies on a basic 5-day linear slope calculation rather than Forward Freight Agreement (FFA) paper market futures curves.
* **Missing Exogenous Variables:** Rate forecasting does not yet ingest macro factors like Chinese steel production rates, seasonal Brazilian rainy seasons, or bunker fuel refinery crack spreads.

#### 5. 🛠️ Human Customization Roadmap (What you can build yourself)
1. **Train Quantile Gradient Boosting Regressors:** Replace the parametric formula with `LightGBM` or `HistGradientBoostingRegressor(loss='quantile')` trained on 10+ years of historical Baltic Dry Index time-series data.
2. **Implement Jump-Diffusion / GARCH Volatility Models:** Upgrade the Monte Carlo generator to a Merton Jump-Diffusion or GARCH(1,1) process to capture freight rate spikes and supply chain shocks accurately.
3. **Incorporate FFA Derivatives Curves:** Ingest Forward Freight Agreement (FFA) forward curves for Capesize (C5 route: West Australia $\to$ Qingdao/India) to determine the exact financial cost of delaying charter fixtures.

---

### Layer 4: Deterministic Specs, Compatibility Rules & Physics Engine

#### 1. What it Does
* Applies hard engineering and physical laws to prune out physically impossible routes before sending data to the optimization solver:
  * **Draft & Depth Compatibility Rule:** $\text{Vessel Loaded Draft} \le (\text{Port Permissible Max Depth} - 0.2\text{m safety margin})$.
  * **Cargo & Vessel Compatibility:** Matches parcel size against vessel Deadweight Tonnage (Capesize 180k DWT, Panamax 82k DWT, Supramax 61k DWT, Handysize 38k DWT).
* **Marine Navigation Physics:**
  * Calculates nautical distance between GPS coordinates using spherical Great Circle trigonometry (Haversine formula with an empirical $1.18\times$ detour factor for sea lanes).
  * Computes voyage duration: $\text{TransitDays} = \frac{\text{Distance NM}}{24 \times \text{Speed Knots}}$.
  * Computes bunker fuel consumption: $\text{Fuel MT} = \text{TransitDays} \times \text{Daily Fuel Burn MT/day}$.
  * Calculates full cost breakdown ($/MT): Material FOB price, Time Charter rate, Bunker Fuel cost, Port Tariffs, and Marine Insurance.

#### 2. Tech Stack & Tools
* **Language:** Python
* **Trigonometry:** Python standard `math` library (`sin`, `cos`, `atan2`, `radians`)
* **Data Structures:** Python typed dictionaries & lists

#### 3. Exact Code Location
* **File:** [`backend/app/api/layer4_rules.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer4_rules.py)
* **Main Functions:** `check_vessel_port_compatibility()`, `haversine_nautical_miles()`, `generate_candidate_routes_pool()`

#### 4. ⚠️ AI-Generated Drawbacks & Limitations
* **Static Draft Checks (Ignoring Tides & River Salinity):** Draft compatibility is evaluated as a static number. In real ports like Haldia or Paradip, tidal variation ($+1.5\text{m}$ to $+3.5\text{m}$ at high tide) and brackish water density (Fresh Water vs. Salt Water draft allowances) dictate whether a ship can berth.
* **Haversine Distance vs. True Sea Lanes:** Great Circle distance with a $1.18\times$ multiplier is an approximation; it does not follow exact nautical waypoints through straits (e.g., Singapore Strait, Sunda Strait, Malacca, Lombok Strait).
* **Constant Fuel Consumption:** Assumes fuel burn is linear. In maritime architecture, fuel consumption follows the **Admiralty Law of Power**: $\text{Fuel Consumption} \propto (\text{Speed})^3$. Slow-steaming from 14 knots to 11 knots reduces fuel burn by up to $40\%$.

#### 5. 🛠️ Human Customization Roadmap (What you can build yourself)
1. **Integrate True Nautical Routing Engine (`searoute-py`):** Replace the Haversine formula with `searoute-py` or an A* graph search over maritime routing networks to obtain exact nautical mileages avoiding shallow straits and landmasses.
2. **Add Dynamic Tidal & Salinity Windows:** Add tidal table lookups for Indian ports and apply the Fresh Water Allowance (FWA) formula: $\text{FWA (mm)} = \frac{\Delta \text{ (Displacement)}}{4 \times \text{TPC}}$.
3. **Implement Non-Linear Speed Optimization (Slow-Steaming Model):** Allow the optimizer to select vessel cruising speed as a decision variable to trade off fuel savings against delivery delay penalties.

---

### Layer 5: Mixed-Integer Linear Programming (MILP) Optimization Engine

#### 1. What it Does
* Formulates and solves the mathematical optimization problem using **PuLP** and the **COIN-OR CBC** solver.
* **Mathematical Formulation:**
  $$\min \sum_{i \in \text{Routes}} x_i \cdot \Big(\text{TotalLandedCostUSDPerMT}_i + (1 - \text{RiskTolerance}) \cdot \$45.00 \cdot \text{CompositeRiskScore}_i\Big)$$
* **Subject to Constraints:**
  1. $\sum x_i = 1$ (Select exactly one optimal primary shipment plan; binary variable $x_i \in \{0, 1\}$).
  2. $\sum x_i \cdot \text{TotalShipmentCost}_i \le \text{Max Budget Ceiling}$ (Budget constraint).
  3. $\sum x_i \cdot (\text{TransitDays}_i + \text{CongestionDays}_i) \le \text{Delivery Window Days}$ (Schedule feasibility).
* **Top-N Plan Generation:** Solves for Rank #1 (Global Optimal), Rank #2 (Runner-Up Cost Leader), and Rank #3 (Resilient Low-Risk Alternative).
* **Explainability Engine:** Generates specific audit bullet points explaining why the winning plan was chosen, identifying binding constraints and cost drivers.

#### 2. Tech Stack & Tools
* **Language:** Python
* **Optimization Framework:** `pulp`
* **Underlying Math Solver:** `PULP_CBC_CMD` (COIN-OR Branch-and-Cut solver)

#### 3. Exact Code Location
* **File:** [`backend/app/api/layer5_milp.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer5_milp.py)
* **Main Functions:** `run_milp_optimization()`

#### 4. ⚠️ AI-Generated Drawbacks & Limitations
* **Single-Shipment Scope (No Multi-Period Fleet Scheduling):** The current model solves for one discrete cargo parcel at a time. Industrial steelmakers operate on Annual Delivery Programs (ADP) where 12 to 24 shipments must be scheduled across multiple quarters.
* **Missing Raw Material Blending Constraints:** The model does not formulate metallurgical blending constraints (e.g., blending $60\%$ Australian high-phosphorus ore with $40\%$ Brazilian low-alumina ore to achieve target blast furnace chemical specifications: $\text{Fe} \ge 63.5\%, \text{Al}_2\text{O}_3 \le 1.8\%$).
* **Linear Risk Penalty:** Risk is incorporated as a linear objective weighting term rather than a formal stochastic constraint with piecewise linear CVaR bounds.

#### 5. 🛠️ Human Customization Roadmap (What you can build yourself)
1. **Add Metallurgical Chemical Blending Constraints:** Add linear constraints for chemical constituents:
   $$\sum_{s} y_s \cdot \text{Fe\_Grade}_s \ge \text{Target\_Fe}, \quad \sum_{s} y_s \cdot \text{Alumina}_s \le \text{Max\_Alumina}$$
2. **Upgrade to Multi-Period Horizon Scheduling:** Expand the decision variables to $x_{i, t}$ (Route $i$ dispatched in Week $t$) with inventory balance constraints at the steel plant stockyard.
3. **Upgrade Solver to HiGHS or Gurobi:** Replace CBC with the modern `HiGHS` solver (`pulp.HiGHS()`) or Gurobi for $10\times$ faster solving on multi-vessel fleet matrices.

---

### Layer 6: Decision Support & Real-Time What-If Simulator

#### 1. What it Does
* Exposes high-performance REST API endpoints for user interaction and real-time parameter overrides:
  * **`POST /api/v1/optimize`**: Receives shipment parameters (commodity, tonnage, destination port, budget, delivery window, risk tolerance) and runs the entire 7-layer pipeline.
  * **`POST /api/v1/optimize/what-if`**: Receives dynamic slider overrides from the frontend (bunker fuel price shift $\pm\%$, charter timing shift $\pm\text{days}$, port congestion multiplier) and re-solves the MILP model in **$<200\text{ms}$**.

#### 2. Tech Stack & Tools
* **Framework:** `fastapi`
* **Schema Validation:** `pydantic` (`BaseModel`, `Field` validation)
* **Server:** `uvicorn`

#### 3. Exact Code Location
* **File:** [`backend/app/api/layer6_simulator.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer6_simulator.py)
* **Main Endpoints:** `POST /api/v1/optimize`, `POST /api/v1/optimize/what-if`

#### 4. ⚠️ AI-Generated Drawbacks & Limitations
* **In-Memory Compute Without Caching:** Every What-If slider movement triggers a fresh solver run. If identical parameters are submitted repeatedly, it recalculates rather than returning a cached response.
* **Limited Simulation Dimensions:** The What-If simulator currently supports 3 sliders (Fuel Price, Charter Shift, Congestion). It does not yet support simulating sudden canal closures (e.g., Suez blocked), custom carbon taxes (IMO CII / EU ETS carbon levies), or supplier force majeure events.

#### 5. 🛠️ Human Customization Roadmap (What you can build yourself)
1. **Implement Redis / LRU Response Caching:** Add `@functools.lru_cache` or a Redis key-value store to cache solved optimization matrices for instant sub-10ms What-If responses.
2. **Add Carbon Tax & Disruption Simulation Scenarios:** Add sliders for IMO Carbon Intensity Indicator (CII) tax ($/ton of $\text{CO}_2$ emitted per ton-mile) and toggle switches for maritime chokepoint closures.

---

### Layer 7: Reporting, Export & Data Catalog Services

#### 1. What it Does
* Serves static master data catalogs for frontend modals and dynamic inspectors:
  * **`GET /api/v1/ports`**: Returns the complete catalog of 13 bulk terminals with max drafts, coordinates, and discharge rates.
  * **`GET /api/v1/vessels`**: Returns 4 standard bulk vessel classes (Capesize, Panamax, Supramax, Handysize) with daily charter rates and fuel consumptions.
  * **`GET /api/v1/commodities`**: Returns raw material specifications (Iron Ore, Coking Coal, Thermal Coal).
* **`POST /api/v1/report/export`**: Generates a structured Markdown / JSON Procurement Decision Memorandum for audit boards.

#### 2. Tech Stack & Tools
* **Framework:** `fastapi`
* **Formatting:** Python string templating & Markdown generation

#### 3. Exact Code Location
* **File:** [`backend/app/api/layer7_export.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer7_export.py)
* **Master App Server:** [`backend/main.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/main.py)
* **Main Endpoints:** `GET /api/v1/ports`, `GET /api/v1/vessels`, `GET /api/v1/commodities`, `POST /api/v1/report/export`

#### 4. ⚠️ AI-Generated Drawbacks & Limitations
* **Markdown Text Output Only:** The export service returns Markdown text and JSON; it does not natively render formatted, print-ready PDF documents or Excel workbooks.
* **No Role-Based Access Control (RBAC):** There is no authentication or permission layer to distinguish between a Junior Procurement Analyst, a Chartering Desk Trader, and a Board Approver.

#### 5. 🛠️ Human Customization Roadmap (What you can build yourself)
1. **Add PDF & Excel Generation (`WeasyPrint` / `OpenPyXL`):** Implement automated PDF generation using `WeasyPrint` (HTML to PDF with company branding and signature blocks) and multi-tab Excel workbooks (`openpyxl`) with embedded formulas.
2. **Implement JWT Authentication & Audit Logging:** Add `fastapi-jwt-auth` and an immutable SQLite/PostgreSQL audit table recording every procurement decision, timestamp, and user ID.

---

## 📂 4. Master Backend File Map & Quick Reference

| Layer | Responsibility | File Path | Key Functions / Classes |
| :--- | :--- | :--- | :--- |
| **Layer 1** | Data Ingestion & Storage | [`backend/app/api/layer1_data.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer1_data.py) | `run_full_ingestion_pipeline()`, `fetch_and_clean_market_freight_data()`, `get_db_connection()` |
| **Layer 2** | Risk & Intelligence | [`backend/app/api/layer2_risk.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer2_risk.py) | `compute_comprehensive_route_risk()`, `evaluate_supplier_compliance()`, `evaluate_weather_hazards()` |
| **Layer 3** | Rate Forecasting & Scenarios | [`backend/app/api/layer3_forecasting.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer3_forecasting.py) | `forecast_freight_quantiles()`, `generate_monte_carlo_scenarios()`, `determine_optimal_charter_window()` |
| **Layer 4** | Specs, Rules & Physics | [`backend/app/api/layer4_rules.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer4_rules.py) | `check_vessel_port_compatibility()`, `haversine_nautical_miles()`, `generate_candidate_routes_pool()` |
| **Layer 5** | PuLP MILP Solver | [`backend/app/api/layer5_milp.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer5_milp.py) | `run_milp_optimization()` |
| **Layer 6** | What-If Simulator API | [`backend/app/api/layer6_simulator.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer6_simulator.py) | `optimize_shipment()`, `simulate_what_if_scenario()`, `OptimizationRequest`, `WhatIfRequest` |
| **Layer 7** | Catalogs & Reporting | [`backend/app/api/layer7_export.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/app/api/layer7_export.py) | `get_ports_catalog()`, `get_vessels_catalog()`, `export_procurement_memo()` |
| **Server** | Master FastAPI App | [`backend/main.py`](file:///c:/Users/Pratyush/Desktop/sih/backend/main.py) | `app = FastAPI(...)`, router mounting, CORS configuration |

---

## 🧪 5. How to Run and Test the Backend

### 1. Run the Complete Math & Physics Verification Suite
```bash
python backend/test_pipeline.py
```
* **What it verifies:** Checks Layer 2 risk scores ($[0.0, 1.0]$), Layer 3 quantile monotonicity ($P_{10} < P_{50} < P_{90}$), Layer 4 draft violations (Capesize at Haldia rejected), Layer 5 MILP solver optimality, and Layer 7 memo generation.

### 2. Run the FastAPI REST Endpoints Verification Suite
```bash
python backend/test_api_endpoints.py
```
* **What it verifies:** Sends HTTP requests to all endpoints (`/`, `/api/v1/ports`, `/api/v1/vessels`, `/api/v1/optimize`, `/api/v1/optimize/what-if`) and validates HTTP 200 OK responses.

### 3. Launch the Live FastAPI Backend Server
```bash
python backend/main.py
```
* **Interactive OpenAPI Swagger Docs:** Open your browser at **`http://127.0.0.1:8000/docs`**
* **Root Health Check:** **`http://127.0.0.1:8000/`**

---

*Document compiled and verified autonomously by Antigravity IDE.*
