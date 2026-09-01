# ==============================================================================
# LAYER 7: EXPORT SERVICES, PROCUREMENT REPORTING & DATA CATALOG APIS
# File: backend/app/api/layer7_export.py
# Goal: Expose endpoints for port/vessel catalogs and generate structured
#       procurement decision reports (Markdown, JSON, HTML).
# ==============================================================================

import logging
from typing import Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.layer4_rules import PORT_CATALOG, VESSEL_CATALOG, COMMODITY_CATALOG

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Create API router
router = APIRouter(prefix="/api/v1", tags=["Layer 7 Catalogs & Reporting"])


class ExportReportRequest(BaseModel):
    plan_id: str
    commodity_name: str
    quantity_mt: float
    total_landed_cost_usd_per_mt: float
    total_shipment_cost_usd: float
    origin_port_name: str
    dest_port_name: str
    vessel_class_name: str
    charter_window: str
    optimal_charter_date: str
    transit_days: float
    risk_level: str
    why_this_plan: List[str]
    risk_signals: List[str]


@router.get("/ports", summary="Get Master Port & Infrastructure Catalog")
def get_ports_catalog():
    """Returns list of active bulk origin and destination ports with draft & specs."""
    return {"total": len(PORT_CATALOG), "ports": PORT_CATALOG}


@router.get("/vessels", summary="Get Dry Bulk Vessel Class Catalog")
def get_vessels_catalog():
    """Returns list of vessel classes (Capesize, Panamax, Supramax, Handysize) with draft & rates."""
    return {"total": len(VESSEL_CATALOG), "vessels": VESSEL_CATALOG}


@router.get("/commodities", summary="Get Supported Raw Material Commodities")
def get_commodities_catalog():
    """Returns list of commodities (Iron Ore, Coking Coal, Thermal Coal) with default FOB prices."""
    return {"total": len(COMMODITY_CATALOG), "commodities": list(COMMODITY_CATALOG.values())}


@router.post("/report/export", summary="Generate Executive Procurement Memo")
def export_procurement_memo(payload: ExportReportRequest):
    """
    Generates a structured Procurement Audit & Decision Memo for Board Approval.
    """
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    why_list_md = "\n".join([f"- {w}" for w in payload.why_this_plan])
    signals_list_md = "\n".join([f"- {s}" for s in payload.risk_signals])

    memo_markdown = f"""# 🚢 MARITIME FREIGHT PROCUREMENT DECISION MEMORANDUM
**Date:** {now_str}  
**Audit Reference:** {payload.plan_id.upper()}  
**Target Cargo:** {payload.commodity_name} | {payload.quantity_mt:,.0f} Metric Tons  

---

## 1. Executive Summary & Recommended Allocation
* **Optimal Route:** {payload.origin_port_name} ➔ {payload.dest_port_name}
* **Assigned Vessel Class:** {payload.vessel_class_name}
* **Total Landed Cost:** **${payload.total_landed_cost_usd_per_mt:.2f} / MT**
* **Total Shipment Expenditure:** **${payload.total_shipment_cost_usd:,.2f} USD**
* **Charter Fixing Window:** {payload.charter_window} (Target: {payload.optimal_charter_date})
* **Estimated Sea Transit:** {payload.transit_days:.1f} Days
* **Overall Composite Risk:** **{payload.risk_level.upper()}**

---

## 2. Decision Rationale & Key Cost Drivers
{why_list_md}

---

## 3. Operational & Geopolitical Risk Surveillance
{signals_list_md}

---
*Generated autonomously by Antigravity Maritime Supply Chain Optimization Engine.*
"""

    return {
        "status": "Success",
        "generated_at": now_str,
        "plan_id": payload.plan_id,
        "memo_markdown": memo_markdown,
        "summary": {
            "origin": payload.origin_port_name,
            "destination": payload.dest_port_name,
            "landed_cost_per_mt": payload.total_landed_cost_usd_per_mt,
            "total_cost_usd": payload.total_shipment_cost_usd,
            "risk_level": payload.risk_level
        }
    }
