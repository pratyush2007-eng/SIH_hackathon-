# ==============================================================================
# FASTAPI ENDPOINTS VERIFICATION SUITE
# File: backend/test_api_endpoints.py
# ==============================================================================

import os
import sys
from starlette.testclient import TestClient

# Ensure backend directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)


def test_health_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Online"
    print("[PASS] Root Health Check: 200 OK")


def test_ports_catalog():
    response = client.get("/api/v1/ports")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    print(f"[PASS] Ports Catalog: 200 OK ({data['total']} ports available)")


def test_vessels_catalog():
    response = client.get("/api/v1/vessels")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 4
    print(f"[PASS] Vessels Catalog: 200 OK ({data['total']} vessel classes)")


def test_optimization_endpoint():
    payload = {
        "commodity_id": "iron-ore",
        "quantity_mt": 150000.0,
        "dest_port_id": "paradip",
        "delivery_window_days": 30,
        "max_budget_usd": 35000000.0,
        "risk_tolerance": 0.5
    }
    response = client.post("/api/v1/optimize", json=payload)
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert data["status"] == "Optimal"
    assert len(data["plans"]) >= 2
    rec = data["recommended_plan"]
    assert rec["isRecommended"] is True
    print(f"[PASS] Optimization Endpoint: 200 OK -> Recommended Plan: {rec['originPort']['name']} -> {rec['destinationPort']['name']} (${rec['totalLandedCostUSDPerMT']}/MT)")


def test_what_if_endpoint():
    payload = {
        "commodity_id": "iron-ore",
        "quantity_mt": 150000.0,
        "dest_port_id": "paradip",
        "charter_shift_days": 3,
        "fuel_price_shift_pct": 25.0,  # +25% fuel price surge
        "congestion_factor": 1.5,
        "risk_tolerance": 0.5
    }
    response = client.post("/api/v1/optimize/what-if", json=payload)
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert data["status"] == "Optimal"
    rec = data["recommended_plan"]
    print(f"[PASS] What-If Simulation (+25% fuel): 200 OK -> Updated Landed Cost: ${rec['totalLandedCostUSDPerMT']}/MT")


if __name__ == "__main__":
    print("==========================================================")
    print("  RUNNING FASTAPI REST API VERIFICATION SUITE")
    print("==========================================================")
    test_health_root()
    test_ports_catalog()
    test_vessels_catalog()
    test_optimization_endpoint()
    test_what_if_endpoint()
    print("\n==========================================================")
    print("  ALL API ENDPOINTS FUNCTIONING PERFECTLY!")
    print("==========================================================")
