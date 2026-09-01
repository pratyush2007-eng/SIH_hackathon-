# ==============================================================================
# LAYER 2: INTELLIGENCE & MULTI-FACTOR RISK ENGINE
# File: backend/app/api/layer2_risk.py
# Goal: Compute normalized risk scores (0.0 to 1.0) across geopolitical,
#       weather hazards, port congestion, and supplier compliance dimensions.
# ==============================================================================

import os
import sqlite3
import logging
from typing import Dict, List, Any, Optional

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Database path resolution
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "data", "maritime_data.db")


def get_db_connection() -> sqlite3.Connection:
    """Returns a connection to the SQLite maritime database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# Known maritime chokepoints and baseline risk weights
CHOKEPOINTS = {
    "red_sea_bab_el_mandeb": {"name": "Bab-el-Mandeb / Red Sea", "geopolitical_risk": 0.85, "active_advisory": True},
    "strait_of_hormuz": {"name": "Strait of Hormuz", "geopolitical_risk": 0.65, "active_advisory": True},
    "malacca_strait": {"name": "Malacca Strait", "geopolitical_risk": 0.20, "active_advisory": False},
    "suez_canal": {"name": "Suez Canal", "geopolitical_risk": 0.60, "active_advisory": True},
    "panama_canal": {"name": "Panama Canal (Draft/Drought)", "geopolitical_risk": 0.45, "active_advisory": False},
    "cape_of_good_hope": {"name": "Cape of Good Hope", "geopolitical_risk": 0.15, "active_advisory": False},
}

# Country baseline stability indices (0.0 = safe, 1.0 = extreme risk)
COUNTRY_RISK_BASELINE = {
    "Australia": 0.05,
    "Brazil": 0.20,
    "South Africa": 0.30,
    "Mozambique": 0.40,
    "India": 0.12,
    "China": 0.18,
    "Indonesia": 0.25,
    "USA": 0.08,
    "Russia": 0.90,
    "Iran": 0.95,
}


def evaluate_supplier_compliance(supplier_name: str) -> Dict[str, Any]:
    """
    Queries supplier directory in SQLite to check financial health and sanctions flags.
    """
    sanctioned = False
    fin_health = 0.85
    reliability = 0.85

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM supplier_directory WHERE UPPER(company_name) LIKE UPPER(?)",
            (f"%{supplier_name.split()[0]}%",)
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            sanctioned = bool(row["sanctions_flag"])
            fin_health = float(row["financial_health_score"])
            reliability = float(row["overall_reliability_score"])
    except Exception as e:
        logging.debug(f"Supplier table lookup fallback: {e}")

    # Explicit compliance overrides for major international miners
    if any(m in supplier_name.upper() for m in ["BHP", "RIO TINTO", "VALE", "ANGLO", "GLENCORE"]):
        sanctioned = False
        fin_health = 0.92
        reliability = 0.94

    risk_penalty = 0.80 if sanctioned else max(0.04, (1.0 - fin_health) * 0.3)

    return {
        "supplier_name": supplier_name,
        "sanctions_flag": sanctioned,
        "financial_health_score": round(fin_health, 2),
        "reliability_score": round(reliability, 2),
        "risk_penalty": round(risk_penalty, 3)
    }


def evaluate_weather_hazards(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> Dict[str, Any]:
    """
    Evaluates weather hazards from SQLite and spatial proximity to tropical storm belts.
    """
    weather_score = 0.15  # Baseline fair weather
    active_signals = []

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM weather_hazards")
        hazard_rows = cursor.fetchall()
        conn.close()

        for h in hazard_rows:
            hazard_flag = bool(h["is_high_risk_hazard"])
            wind_knots = float(h["wind_speed_knots"])
            desc = h["hazard_condition"]
            loc = h["location_name"]

            if hazard_flag:
                weather_score = max(weather_score, 0.40)
                active_signals.append(f"Marine Alert near {loc}: {desc} ({wind_knots:.1f} kts wind)")
    except Exception as e:
        logging.debug(f"Weather table lookup fallback: {e}")

    # Spatial check: Bay of Bengal (approx lat 10-22, lng 80-95) cyclone season check
    mid_lat = (origin_lat + dest_lat) / 2.0
    mid_lng = (origin_lng + dest_lng) / 2.0
    
    if (10.0 <= dest_lat <= 22.0 and 80.0 <= dest_lng <= 90.0) or (10.0 <= mid_lat <= 22.0 and 80.0 <= mid_lng <= 90.0):
        # Route enters Bay of Bengal
        weather_score = max(weather_score, 0.22)
        active_signals.append("Bay of Bengal Monsoon/Pre-cyclone seasonal sea state monitoring active.")

    return {
        "weather_risk_score": round(min(1.0, weather_score), 3),
        "signals": active_signals[:3]
    }


def evaluate_port_congestion(port_name: str, country: str) -> Dict[str, Any]:
    """
    Evaluates port congestion and berth waiting delay from SQLite port infrastructure table.
    """
    congestion_days = 2.0
    max_draft = 16.5
    discharge_rate = 60000.0

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM port_infrastructure WHERE UPPER(port_name) LIKE UPPER(?) OR UPPER(country) LIKE UPPER(?)",
            (f"%{port_name}%", f"%{country}%")
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            turnaround_hrs = float(row["avg_turnaround_hours"])
            congestion_days = round(turnaround_hrs / 24.0, 1)
            max_draft = float(row["max_draft_meters"])
    except Exception as e:
        logging.debug(f"Port table lookup fallback: {e}")

    # Known congestion defaults for major bulk terminals
    if "Haldia" in port_name:
        congestion_days = 4.2
    elif "Paradip" in port_name:
        congestion_days = 2.4
    elif "Newcastle" in port_name:
        congestion_days = 3.1
    elif "Hedland" in port_name:
        congestion_days = 2.1

    congestion_score = min(0.95, congestion_days / 6.0)

    return {
        "port_name": port_name,
        "congestion_days": congestion_days,
        "congestion_risk_score": round(congestion_score, 3),
        "max_draft_m": max_draft,
        "discharge_rate": discharge_rate
    }


def compute_comprehensive_route_risk(
    origin_port_name: str,
    origin_country: str,
    origin_lat: float,
    origin_lng: float,
    dest_port_name: str,
    dest_country: str,
    dest_lat: float,
    dest_lng: float,
    supplier_name: str = "BHP Minerals",
    transit_days: float = 14.0
) -> Dict[str, Any]:
    """
    Calculates composite normalized risk scores across all 4 key dimensions:
    - Geopolitical (0.0 - 1.0)
    - Weather (0.0 - 1.0)
    - Congestion (0.0 - 1.0)
    - Delay Probability (0.0 - 1.0)
    """
    # 1. Geopolitical Risk Calculation
    origin_geo = COUNTRY_RISK_BASELINE.get(origin_country, 0.25)
    dest_geo = COUNTRY_RISK_BASELINE.get(dest_country, 0.15)
    supplier_eval = evaluate_supplier_compliance(supplier_name)
    
    # Check if route passes through chokepoints
    chokepoint_penalty = 0.0
    risk_signals = []
    
    # Long-haul routes from Brazil or S. Africa passing Cape vs Suez
    if origin_country in ["Brazil", "South Africa", "Mozambique"]:
        chokepoint_penalty = 0.08
        risk_signals.append("Voyage utilizes Cape Route to avoid Red Sea / Bab-el-Mandeb conflict corridor.")
    elif origin_country in ["Australia", "Indonesia"]:
        chokepoint_penalty = 0.02
        risk_signals.append("Direct Indian Ocean open transit — minimum geopolitical choke exposure.")

    geopolitical_score = min(1.0, (origin_geo * 0.4) + (dest_geo * 0.2) + (supplier_eval["risk_penalty"] * 0.3) + chokepoint_penalty)

    # 2. Weather Risk Calculation
    weather_eval = evaluate_weather_hazards(origin_lat, origin_lng, dest_lat, dest_lng)
    weather_score = weather_eval["weather_risk_score"]
    risk_signals.extend(weather_eval["signals"])

    # 3. Port Congestion Risk Calculation
    origin_cong = evaluate_port_congestion(origin_port_name, origin_country)
    dest_cong = evaluate_port_congestion(dest_port_name, dest_country)
    congestion_score = min(1.0, (origin_cong["congestion_risk_score"] * 0.4) + (dest_cong["congestion_risk_score"] * 0.6))
    
    if dest_cong["congestion_days"] > 2.5:
        risk_signals.append(f"Destination berth queue elevated at {dest_port_name} (~{dest_cong['congestion_days']:.1f} days waiting time).")

    # 4. Delay Probability (Composite Regression approximation)
    delay_prob = min(0.95, (congestion_score * 0.45) + (weather_score * 0.35) + (geopolitical_score * 0.20))

    # Overall Composite Score (0.0 to 1.0)
    composite_score = round(
        (geopolitical_score * 0.30) +
        (weather_score * 0.25) +
        (congestion_score * 0.25) +
        (delay_prob * 0.20),
        3
    )

    overall_level = "Low"
    if composite_score > 0.55:
        overall_level = "High"
    elif composite_score > 0.30:
        overall_level = "Medium"

    return {
        "geopolitical": round(geopolitical_score, 3),
        "weather": round(weather_score, 3),
        "congestion": round(congestion_score, 3),
        "delayProbability": round(delay_prob, 3),
        "composite_score": composite_score,
        "overallRiskLevel": overall_level,
        "supplier_compliance": supplier_eval,
        "origin_congestion_days": origin_cong["congestion_days"],
        "dest_congestion_days": dest_cong["congestion_days"],
        "risk_signals": risk_signals[:4]
    }


if __name__ == "__main__":
    print("Testing Layer 2 Intelligence & Risk Engine...")
    test_result = compute_comprehensive_route_risk(
        origin_port_name="Port Hedland",
        origin_country="Australia",
        origin_lat=-20.31,
        origin_lng=118.57,
        dest_port_name="Paradip",
        dest_country="India",
        dest_lat=20.26,
        dest_lng=86.67,
        supplier_name="BHP Minerals",
        transit_days=13.5
    )
    print("Layer 2 Risk Output:")
    for k, v in test_result.items():
        print(f"  {k}: {v}")
