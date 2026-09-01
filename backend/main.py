# ==============================================================================
# MARITIME OPTIMIZATION ENGINE - FASTAPI BACKEND ENTRYPOINT
# File: backend/main.py
# ==============================================================================

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add backend directory to Python system path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import Layer Modules
from app.api.layer1_data import run_full_ingestion_pipeline, get_db_connection
from app.api.layer6_simulator import router as optimization_router
from app.api.layer7_export import router as catalog_export_router

# Create FastAPI Server App instance
app = FastAPI(
    title="Maritime Supply Chain Optimization Platform API",
    description="End-to-end backend service: Layer 1 (Ingestion), Layer 2 (Risk Intelligence), Layer 3 (Quantile Forecasting), Layer 4 (Physics & Rules), Layer 5 (PuLP MILP Solver), Layer 6 (What-If Simulator), Layer 7 (Data Catalogs & Reports).",
    version="2.0.0"
)

# Enable CORS for React Frontend (Vite on port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(optimization_router)
app.include_router(catalog_export_router)


@app.get("/")
def read_root():
    """Health check endpoint confirming backend server and layer statuses."""
    return {
        "status": "Online",
        "platform": "Antigravity Maritime Supply Chain Optimization Platform",
        "active_layers": [
            "Layer 1: Data Sources & SQLite DB",
            "Layer 2: Multi-Factor Risk Scoring",
            "Layer 3: Quantile Freight Forecasting & Monte Carlo",
            "Layer 4: Deterministic Draft & Physics Engine",
            "Layer 5: Mixed-Integer Linear Programming (PuLP MILP)",
            "Layer 6: Real-Time What-If Scenario Simulator",
            "Layer 7: Data Catalogs & Procurement Memo Export"
        ],
        "documentation_url": "/docs"
    }


@app.post("/api/v1/data/ingest")
def trigger_data_ingestion():
    """Trigger Layer 1 pipeline to re-fetch and refresh all maritime tables in SQLite."""
    run_full_ingestion_pipeline()
    return {"status": "Success", "message": "Layer 1 Data Ingestion Pipeline executed successfully."}


@app.get("/api/v1/data/summary")
def get_database_summary():
    """Returns total row counts across all SQLite backend tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    summary = {}
    for t in tables:
        tname = t[0]
        count = cursor.execute(f"SELECT COUNT(*) FROM {tname}").fetchone()[0]
        summary[tname] = count
    conn.close()
    return {"database": "maritime_data.db", "tables": summary}


if __name__ == "__main__":
    import uvicorn
    # Run backend web server on http://localhost:8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
