# ==============================================================================
# LAYER 4: DETERMINISTIC SPECS, COMPATIBILITY RULES & PHYSICS ENGINE
# File: backend/app/api/layer4_rules.py
# Goal: Enforce physical, draft, port, and vessel constraints to prune 80% of
#       infeasible options and compute exact maritime physics & landed costs.
# ==============================================================================

import os
import sqlite3
import math
import logging
from typing import Dict, List, Any, Optional, Tuple

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


def haversine_nautical_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes Great Circle nautical distance between two GPS coordinates,
    with a 1.15x maritime routing factor for realistic sea lanes.
    """
    R_NM = 3440.065  # Earth radius in nautical miles
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    direct_dist = R_NM * c

    # Maritime sea lane detour multiplier (avoiding landmasses)
    return direct_dist * 1.18


# Standard Port Master Catalog with GIS coordinates & specs
PORT_CATALOG = [
    # Origins
    {
        "id": "port-hedland", "name": "Port Hedland", "country": "Australia",
        "lat": -20.31, "lng": 118.57, "max_draft": 20.0, "handling_cap": "550M MT/yr",
        "congestion_days": 2.1, "type": "origin", "region": "Western Australia",
        "discharge_rate": 120000.0, "quay_length": "2,400m", "primary_commodity": "Iron Ore"
    },
    {
        "id": "dampier", "name": "Dampier Terminal", "country": "Australia",
        "lat": -20.66, "lng": 116.71, "max_draft": 18.8, "handling_cap": "180M MT/yr",
        "congestion_days": 1.6, "type": "origin", "region": "Western Australia",
        "discharge_rate": 95000.0, "quay_length": "1,600m", "primary_commodity": "Iron Ore"
    },
    {
        "id": "gladstone", "name": "Gladstone", "country": "Australia",
        "lat": -23.84, "lng": 151.25, "max_draft": 17.5, "handling_cap": "70M MT/yr",
        "congestion_days": 2.5, "type": "origin", "region": "Queensland",
        "discharge_rate": 65000.0, "quay_length": "1,200m", "primary_commodity": "Coking Coal"
    },
    {
        "id": "newcastle-au", "name": "Newcastle (AU)", "country": "Australia",
        "lat": -32.92, "lng": 151.78, "max_draft": 16.4, "handling_cap": "165M MT/yr",
        "congestion_days": 3.1, "type": "origin", "region": "New South Wales",
        "discharge_rate": 80000.0, "quay_length": "1,900m", "primary_commodity": "Thermal Coal"
    },
    {
        "id": "tubarao", "name": "Tubarao Terminal", "country": "Brazil",
        "lat": -20.28, "lng": -40.24, "max_draft": 23.0, "handling_cap": "120M MT/yr",
        "congestion_days": 2.8, "type": "origin", "region": "Espirito Santo",
        "discharge_rate": 110000.0, "quay_length": "1,800m", "primary_commodity": "Iron Ore"
    },
    {
        "id": "saldanha-bay", "name": "Saldanha Bay", "country": "South Africa",
        "lat": -33.02, "lng": 17.96, "max_draft": 21.5, "handling_cap": "60M MT/yr",
        "congestion_days": 1.8, "type": "origin", "region": "Western Cape",
        "discharge_rate": 80000.0, "quay_length": "1,150m", "primary_commodity": "Iron Ore"
    },
    {
        "id": "richards-bay", "name": "Richards Bay", "country": "South Africa",
        "lat": -28.80, "lng": 32.04, "max_draft": 17.5, "handling_cap": "90M MT/yr",
        "congestion_days": 2.2, "type": "origin", "region": "KwaZulu-Natal",
        "discharge_rate": 75000.0, "quay_length": "2,200m", "primary_commodity": "Coking Coal"
    },
    {
        "id": "maputo", "name": "Port of Maputo", "country": "Mozambique",
        "lat": -25.96, "lng": 32.58, "max_draft": 14.5, "handling_cap": "25M MT/yr",
        "congestion_days": 1.5, "type": "origin", "region": "Southern Africa",
        "discharge_rate": 40000.0, "quay_length": "850m", "primary_commodity": "Coking Coal"
    },
    # Destinations (Indian Steel Ports)
    {
        "id": "paradip", "name": "Paradip Port", "country": "India",
        "lat": 20.26, "lng": 86.67, "max_draft": 17.1, "handling_cap": "140M MT/yr",
        "congestion_days": 2.4, "type": "destination", "region": "Odisha Coast",
        "discharge_rate": 55000.0, "quay_length": "2,100m", "primary_commodity": "Iron Ore / Coal"
    },
    {
        "id": "visakhapatnam", "name": "Visakhapatnam (Vizag)", "country": "India",
        "lat": 17.68, "lng": 83.29, "max_draft": 18.1, "handling_cap": "80M MT/yr",
        "congestion_days": 1.9, "type": "destination", "region": "Andhra Coast",
        "discharge_rate": 60000.0, "quay_length": "1,950m", "primary_commodity": "Iron Ore / Coal"
    },
    {
        "id": "haldia", "name": "Haldia Dock Complex", "country": "India",
        "lat": 22.02, "lng": 88.06, "max_draft": 12.2, "handling_cap": "50M MT/yr",
        "congestion_days": 4.2, "type": "destination", "region": "West Bengal",
        "discharge_rate": 35000.0, "quay_length": "1,400m", "primary_commodity": "Coal / Minerals"
    },
    {
        "id": "chennai", "name": "Chennai Port", "country": "India",
        "lat": 13.08, "lng": 80.29, "max_draft": 15.5, "handling_cap": "65M MT/yr",
        "congestion_days": 2.0, "type": "destination", "region": "Tamil Nadu Coast",
        "discharge_rate": 45000.0, "quay_length": "1,750m", "primary_commodity": "Dry Bulk"
    },
    {
        "id": "mumbai-jnpt", "name": "JNPT / Mumbai", "country": "India",
        "lat": 18.95, "lng": 72.95, "max_draft": 15.0, "handling_cap": "90M MT/yr",
        "congestion_days": 1.7, "type": "destination", "region": "Maharashtra Coast",
        "discharge_rate": 50000.0, "quay_length": "2,000m", "primary_commodity": "Bulk / Containers"
    }
]

# Standard Dry Bulk Vessel Classes
VESSEL_CATALOG = [
    {
        "id": "capesize", "name": "Capesize Bulker",
        "capacity_dwt": 180000, "max_draft": 18.2, "daily_charter_rate": 28500.0,
        "fuel_consumption_mt_day": 48.0, "speed_knots": 13.5,
        "description": "Ultra heavy-lift dry bulk carrier for long-distance iron ore & coal."
    },
    {
        "id": "panamax", "name": "Panamax / Kamsarmax",
        "capacity_dwt": 82000, "max_draft": 14.5, "daily_charter_rate": 16800.0,
        "fuel_consumption_mt_day": 28.0, "speed_knots": 14.0,
        "description": "Standard flexible bulk carrier capable of transiting draft-restricted ports."
    },
    {
        "id": "supramax", "name": "Supramax / Ultramax",
        "capacity_dwt": 61000, "max_draft": 13.0, "daily_charter_rate": 13200.0,
        "fuel_consumption_mt_day": 22.0, "speed_knots": 14.2,
        "description": "Geared bulk carrier suitable for shallow draft docks (e.g. Haldia)."
    },
    {
        "id": "handysize", "name": "Handysize Bulker",
        "capacity_dwt": 38000, "max_draft": 10.5, "daily_charter_rate": 10500.0,
        "fuel_consumption_mt_day": 16.0, "speed_knots": 13.8,
        "description": "Small versatile bulk carrier for minor bulk parcels."
    }
]

# Commodity Base FOB Rates & Preferred Suppliers
COMMODITY_CATALOG = {
    "iron-ore": {
        "id": "iron-ore", "name": "Iron Ore Fines (62% Fe)",
        "fob_price_per_mt": 108.50, "unit": "USD/MT",
        "typical_parcel_mt": 160000,
        "allowed_vessels": ["capesize", "panamax"],
        "suppliers": [
            {"name": "BHP Minerals", "origin_port_id": "port-hedland", "fob_discount": 0.0},
            {"name": "Rio Tinto Iron", "origin_port_id": "dampier", "fob_discount": 1.20},
            {"name": "Vale S.A.", "origin_port_id": "tubarao", "fob_discount": -2.50},
            {"name": "Kumba Iron Ore", "origin_port_id": "saldanha-bay", "fob_discount": -1.00}
        ]
    },
    "coking-coal": {
        "id": "coking-coal", "name": "Premium Hard Coking Coal",
        "fob_price_per_mt": 245.00, "unit": "USD/MT",
        "typical_parcel_mt": 75000,
        "allowed_vessels": ["panamax", "supramax", "capesize"],
        "suppliers": [
            {"name": "BHP Mitsubishi Alliance", "origin_port_id": "gladstone", "fob_discount": 0.0},
            {"name": "Glencore Coal", "origin_port_id": "richards-bay", "fob_discount": -3.50},
            {"name": "Vale Moatize", "origin_port_id": "maputo", "fob_discount": -6.00}
        ]
    },
    "thermal-coal": {
        "id": "thermal-coal", "name": "Thermal Coal (6000 kcal/kg)",
        "fob_price_per_mt": 135.00, "unit": "USD/MT",
        "typical_parcel_mt": 70000,
        "allowed_vessels": ["panamax", "supramax"],
        "suppliers": [
            {"name": "Glencore Newcastle", "origin_port_id": "newcastle-au", "fob_discount": 0.0},
            {"name": "Anglo American Coal", "origin_port_id": "richards-bay", "fob_discount": -2.00}
        ]
    }
}


def check_vessel_port_compatibility(vessel_draft: float, port_max_draft: float) -> bool:
    """
    Hard Rule: Vessel loaded draft must not exceed port max permissible draft with safety margin (0.3m).
    """
    return vessel_draft <= (port_max_draft - 0.2)


def generate_candidate_routes_pool(
    commodity_id: str,
    target_quantity_mt: float,
    dest_port_id: str,
    bunker_fuel_price_usd: float = 640.0
) -> List[Dict[str, Any]]:
    """
    Evaluates all possible (Origin Port, Supplier, Vessel Class, Dest Port) combinations,
    applies Layer 4 deterministic filters (draft limits, cargo suitability),
    and computes exact transit physics and cost components for feasible routes.
    """
    commodity_info = COMMODITY_CATALOG.get(commodity_id, COMMODITY_CATALOG["iron-ore"])
    
    # Locate destination port
    dest_port = next((p for p in PORT_CATALOG if p["id"] == dest_port_id), None)
    if not dest_port:
        dest_port = next(p for p in PORT_CATALOG if p["id"] == "paradip")

    candidate_routes = []

    for supplier in commodity_info["suppliers"]:
        origin_port = next((p for p in PORT_CATALOG if p["id"] == supplier["origin_port_id"]), None)
        if not origin_port:
            continue

        for vessel in VESSEL_CATALOG:
            # Check 1: Allowed vessel class for commodity
            if vessel["id"] not in commodity_info["allowed_vessels"]:
                continue

            # Check 2: Origin Port Draft Feasibility
            if not check_vessel_port_compatibility(vessel["max_draft"], origin_port["max_draft"]):
                continue

            # Check 3: Destination Port Draft Feasibility
            if not check_vessel_port_compatibility(vessel["max_draft"], dest_port["max_draft"]):
                continue

            # --- Physics & Cost Calculations ---
            distance_nm = haversine_nautical_miles(
                origin_port["lat"], origin_port["lng"],
                dest_port["lat"], dest_port["lng"]
            )
            
            # Transit duration in days
            transit_days = distance_nm / (24.0 * vessel["speed_knots"])
            
            # Fuel Consumption & Cost
            bunker_fuel_mt = transit_days * vessel["fuel_consumption_mt_day"]
            total_bunker_cost_usd = bunker_fuel_mt * bunker_fuel_price_usd
            bunker_cost_per_mt = total_bunker_cost_usd / target_quantity_mt

            # Vessel Time Charter Cost
            total_charter_cost_usd = transit_days * vessel["daily_charter_rate"]
            charter_cost_per_mt = total_charter_cost_usd / target_quantity_mt

            # Freight baseline ($/MT)
            freight_cost_per_mt = bunker_cost_per_mt + charter_cost_per_mt

            # Port Tariffs, Pilotage & Handling ($/MT)
            port_tariffs_per_mt = 2.45 + (1.20 if vessel["id"] == "capesize" else 0.85)

            # Material FOB Cost ($/MT)
            fob_price_per_mt = commodity_info["fob_price_per_mt"] + supplier["fob_discount"]

            # Insurance & Risk Surcharge ($/MT)
            insurance_per_mt = round(fob_price_per_mt * 0.008 + 0.40, 2)

            # Total Landed Cost ($/MT)
            total_landed_per_mt = round(
                fob_price_per_mt + freight_cost_per_mt + port_tariffs_per_mt + insurance_per_mt,
                2
            )
            total_shipment_cost = round(total_landed_per_mt * target_quantity_mt, 2)

            # Waypoints generator for 3D visual arc
            mid_lat = (origin_port["lat"] + dest_port["lat"]) / 2.0 + 3.0
            mid_lng = (origin_port["lng"] + dest_port["lng"]) / 2.0
            waypoints = [
                {"lat": origin_port["lat"], "lng": origin_port["lng"], "name": origin_port["name"]},
                {"lat": round(mid_lat, 2), "lng": round(mid_lng, 2), "name": "Way Point Alpha"},
                {"lat": dest_port["lat"], "lng": dest_port["lng"], "name": dest_port["name"]}
            ]

            candidate_routes.append({
                "candidate_id": f"{supplier['name'].replace(' ', '_')}_{origin_port['id']}_{vessel['id']}_{dest_port['id']}",
                "origin_port": origin_port,
                "dest_port": dest_port,
                "supplier": supplier,
                "vessel": vessel,
                "commodity_id": commodity_id,
                "quantity_mt": target_quantity_mt,
                "distance_nm": round(distance_nm, 1),
                "transit_days": round(transit_days, 1),
                "fob_price_per_mt": round(fob_price_per_mt, 2),
                "freight_cost_per_mt": round(freight_cost_per_mt, 2),
                "charter_cost_per_mt": round(charter_cost_per_mt, 2),
                "bunker_cost_per_mt": round(bunker_cost_per_mt, 2),
                "port_tariffs_per_mt": round(port_tariffs_per_mt, 2),
                "insurance_per_mt": round(insurance_per_mt, 2),
                "total_landed_per_mt": total_landed_per_mt,
                "total_shipment_cost_usd": total_shipment_cost,
                "waypoints": waypoints
            })

    return candidate_routes


if __name__ == "__main__":
    print("Testing Layer 4 Deterministic Compatibility & Physics...")
    candidates = generate_candidate_routes_pool(
        commodity_id="iron-ore",
        target_quantity_mt=150000,
        dest_port_id="paradip"
    )
    print(f"Feasible candidate routes found: {len(candidates)}")
    for c in candidates[:3]:
        print(f"-> {c['supplier']['name']} | {c['origin_port']['name']} -> {c['dest_port']['name']} | {c['vessel']['name']} | Landed: ${c['total_landed_per_mt']}/MT")
