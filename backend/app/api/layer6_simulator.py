# ==============================================================================
# LAYER 6: FASTAPI OPTIMIZATION & REAL-TIME WHAT-IF SIMULATOR ROUTER
# File: backend/app/api/layer6_simulator.py
# Goal: Expose high-performance decision endpoints for full MILP optimization
#       and dynamic parameter override simulations (<200ms response).
# ==============================================================================

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.layer5_milp import run_milp_optimization

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Create dedicated API router for Layer 6
router = APIRouter(prefix="/api/v1/optimize", tags=["Layer 5-6 Optimization & Simulator"])


# --- Request & Response Data Models ---

class OptimizationRequest(BaseModel):
    commodity_id: str = Field(default="iron-ore", description="Commodity identifier (e.g. iron-ore, coking-coal, thermal-coal)")
    quantity_mt: float = Field(default=150000.0, ge=1000.0, description="Target shipment quantity in Metric Tons")
    dest_port_id: str = Field(default="paradip", description="Destination discharge port ID")
    delivery_window_days: int = Field(default=30, ge=5, le=120, description="Maximum allowable delivery window in days")
    max_budget_usd: float = Field(default=35000000.0, ge=10000.0, description="Maximum total procurement and logistics budget (USD)")
    risk_tolerance: float = Field(default=0.5, ge=0.0, le=1.0, description="User risk tolerance (0.0 = ultra safe, 1.0 = cost-aggressive)")


class WhatIfRequest(BaseModel):
    commodity_id: str = Field(default="iron-ore", description="Commodity identifier")
    quantity_mt: float = Field(default=150000.0, ge=1000.0, description="Shipment quantity in Metric Tons")
    dest_port_id: str = Field(default="paradip", description="Destination port ID")
    charter_shift_days: int = Field(default=0, ge=-15, le=30, description="Shift charter timing window by +/- N days")
    fuel_price_shift_pct: float = Field(default=0.0, ge=-50.0, le=150.0, description="Percentage shift in bunker fuel price (+/- %)")
    congestion_factor: float = Field(default=1.0, ge=0.2, le=5.0, description="Multiplier for destination/origin port congestion delay")
    risk_tolerance: float = Field(default=0.5, ge=0.0, le=1.0, description="User risk tolerance")


# --- Endpoints ---

@router.post("", summary="Run Complete Multi-Layer MILP Freight Optimization")
def optimize_shipment(payload: OptimizationRequest):
    """
    Executes the full pipeline:
    1. Layer 4: Prunes infeasible draft and port combinations.
    2. Layer 2: Evaluates geopolitical, weather, and congestion risk.
    3. Layer 3: Calculates rate forecasting quantiles (P10/P50/P90) and Monte Carlo distributions.
    4. Layer 5: Solves PuLP Mixed-Integer Linear Program for Top-N optimal plans.
    """
    try:
        logging.info(f"Running optimization for {payload.commodity_id}, {payload.quantity_mt:,.0f} MT to {payload.dest_port_id}")
        result = run_milp_optimization(
            commodity_id=payload.commodity_id,
            quantity_mt=payload.quantity_mt,
            dest_port_id=payload.dest_port_id,
            delivery_window_days=payload.delivery_window_days,
            max_budget_usd=payload.max_budget_usd,
            risk_tolerance=payload.risk_tolerance
        )
        return result
    except Exception as e:
        logging.error(f"Optimization error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/what-if", summary="Real-Time What-If Parameter Re-Optimization (<200ms)")
def simulate_what_if_scenario(payload: WhatIfRequest):
    """
    Instantly re-optimizes the freight allocation model with dynamic parameter overrides:
    - Spiked / discounted bunker fuel price
    - Delayed / advanced charter laycan window
    - Port congestion shocks
    """
    try:
        # Base bunker fuel price is $640/MT
        base_bunker = 640.0
        adjusted_bunker = base_bunker * (1.0 + (payload.fuel_price_shift_pct / 100.0))

        logging.info(
            f"Simulating What-If: Fuel Shift={payload.fuel_price_shift_pct}% (${adjusted_bunker:.1f}/MT), "
            f"Charter Shift={payload.charter_shift_days} days, Congestion x{payload.congestion_factor}"
        )

        result = run_milp_optimization(
            commodity_id=payload.commodity_id,
            quantity_mt=payload.quantity_mt,
            dest_port_id=payload.dest_port_id,
            risk_tolerance=payload.risk_tolerance,
            fuel_price_override=adjusted_bunker,
            charter_shift_days=payload.charter_shift_days,
            congestion_factor=payload.congestion_factor
        )

        # Attach What-If Scenario Metadata
        result["scenario_deltas"] = {
            "applied_fuel_price_usd": round(adjusted_bunker, 2),
            "applied_fuel_shift_pct": payload.fuel_price_shift_pct,
            "applied_charter_shift_days": payload.charter_shift_days,
            "applied_congestion_factor": payload.congestion_factor
        }

        return result
    except Exception as e:
        logging.error(f"What-If Simulation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
