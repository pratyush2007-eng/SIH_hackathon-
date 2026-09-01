# ==============================================================================
# MARITIME BACKEND PIPELINE COMPREHENSIVE VERIFICATION SUITE
# File: backend/test_pipeline.py
# ==============================================================================

import os
import sys
import time

# Ensure backend directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.api.layer2_risk import compute_comprehensive_route_risk, evaluate_supplier_compliance
from app.api.layer3_forecasting import (
    forecast_freight_quantiles,
    generate_monte_carlo_scenarios,
    determine_optimal_charter_window
)
from app.api.layer4_rules import (
    generate_candidate_routes_pool,
    check_vessel_port_compatibility,
    PORT_CATALOG,
    VESSEL_CATALOG
)
from app.api.layer5_milp import run_milp_optimization
from app.api.layer7_export import export_procurement_memo, ExportReportRequest


def test_layer2_risk():
    print("\n--- [TEST] Layer 2: Intelligence & Risk Engine ---")
    res = compute_comprehensive_route_risk(
        origin_port_name="Port Hedland",
        origin_country="Australia",
        origin_lat=-20.31,
        origin_lng=118.57,
        dest_port_name="Paradip",
        dest_country="India",
        dest_lat=20.26,
        dest_lng=86.67,
        supplier_name="BHP Minerals"
    )
    assert 0.0 <= res["composite_score"] <= 1.0, "Composite risk score out of range [0, 1]"
    assert 0.0 <= res["geopolitical"] <= 1.0, "Geopolitical risk out of range"
    assert 0.0 <= res["weather"] <= 1.0, "Weather risk out of range"
    assert 0.0 <= res["congestion"] <= 1.0, "Congestion risk out of range"
    assert res["overallRiskLevel"] in ["Low", "Medium", "High"], "Invalid risk category"
    print(f"[PASS] Layer 2 Passed: Composite Risk = {res['composite_score']} ({res['overallRiskLevel']}) | Geopolitical={res['geopolitical']}, Weather={res['weather']}")


def test_layer3_forecasting():
    print("\n--- [TEST] Layer 3: Quantile Forecasting & Monte Carlo ---")
    q = forecast_freight_quantiles(base_freight_usd_per_mt=18.50, route_distance_nm=3600)
    assert q["p10_low_usd_per_mt"] < q["p50_expected_usd_per_mt"] < q["p90_high_usd_per_mt"], "Quantile monotonicity violated"
    
    mc = generate_monte_carlo_scenarios(base_cost_per_mt=118.50, base_transit_days=13.5, num_scenarios=50)
    assert 0.0 <= mc["on_time_reliability_pct"] <= 100.0, "Invalid on-time reliability percentage"
    assert mc["cvar_95_cost_per_mt"] >= mc["mean_scenario_cost_per_mt"], "CVaR 95 should be >= mean cost"
    
    window, opt_date, rationale = determine_optimal_charter_window()
    assert len(window) > 0 and len(opt_date) > 0
    print(f"[PASS] Layer 3 Passed: P10=${q['p10_low_usd_per_mt']} < P50=${q['p50_expected_usd_per_mt']} < P90=${q['p90_high_usd_per_mt']} | Reliability={mc['on_time_reliability_pct']}% | Window='{window}'")


def test_layer4_physics_rules():
    print("\n--- [TEST] Layer 4: Deterministic Compatibility & Physics ---")
    # Draft check: Capesize (18.2m) at Haldia (12.2m) should be rejected
    assert not check_vessel_port_compatibility(18.2, 12.2), "Draft violation check failed (Capesize at Haldia should be False)"
    # Draft check: Capesize (18.2m) at Tubarao (23.0m) should be accepted
    assert check_vessel_port_compatibility(18.2, 23.0), "Draft check failed (Capesize at Tubarao should be True)"

    candidates = generate_candidate_routes_pool(commodity_id="iron-ore", target_quantity_mt=150000, dest_port_id="paradip")
    assert len(candidates) > 0, "No candidate routes generated"
    first = candidates[0]
    assert first["transit_days"] > 0, "Transit days must be positive"
    assert first["total_landed_per_mt"] > first["fob_price_per_mt"], "Landed cost must exceed raw FOB"
    print(f"[PASS] Layer 4 Passed: {len(candidates)} viable routes generated. Sample route: {first['origin_port']['name']} -> {first['dest_port']['name']} ({first['transit_days']:.1f} days, Landed=${first['total_landed_per_mt']}/MT)")


def test_layer5_milp():
    print("\n--- [TEST] Layer 5: PuLP Mixed-Integer Linear Programming Engine ---")
    t0 = time.time()
    result = run_milp_optimization(
        commodity_id="iron-ore",
        quantity_mt=150000.0,
        dest_port_id="paradip",
        risk_tolerance=0.5
    )
    duration_ms = (time.time() - t0) * 1000
    assert result["solver_status"] == "Optimal", f"Solver failed: {result['solver_status']}"
    assert len(result["plans"]) >= 2, "Expected at least 2 ranked candidate plans"
    rec = result["recommended_plan"]
    assert rec["isRecommended"] is True, "Recommended plan flag not set"
    assert rec["totalLandedCostUSDPerMT"] > 0
    print(f"[PASS] Layer 5 Passed: Solved in {duration_ms:.1f}ms! Optimal Route: {rec['originPort']['name']} -> {rec['destinationPort']['name']} | Landed: ${rec['totalLandedCostUSDPerMT']}/MT | Risk: {rec['overallRiskLevel']}")


def test_layer7_export():
    print("\n--- [TEST] Layer 7: Decision Memo Generation ---")
    req = ExportReportRequest(
        plan_id="plan-1-test",
        commodity_name="Iron Ore Fines",
        quantity_mt=150000,
        total_landed_cost_usd_per_mt=124.50,
        total_shipment_cost_usd=18675000,
        origin_port_name="Port Hedland",
        dest_port_name="Paradip",
        vessel_class_name="Capesize Bulker",
        charter_window="Optimal Window (3-5 days)",
        optimal_charter_date="Sep 05, 2026",
        transit_days=13.5,
        risk_level="Low",
        why_this_plan=["Optimal freight economies of scale"],
        risk_signals=["Direct Indian Ocean route"]
    )
    memo_res = export_procurement_memo(req)
    assert memo_res["status"] == "Success"
    assert "MARITIME FREIGHT PROCUREMENT DECISION MEMORANDUM" in memo_res["memo_markdown"]
    print("[PASS] Layer 7 Passed: Generated executive procurement memo successfully.")


if __name__ == "__main__":
    print("==========================================================")
    print("  RUNNING MARITIME SUPPLY CHAIN BACKEND TEST SUITE")
    print("==========================================================")
    test_layer2_risk()
    test_layer3_forecasting()
    test_layer4_physics_rules()
    test_layer5_milp()
    test_layer7_export()
    print("\n==========================================================")
    print("  ALL TESTS PASSED WITH 100% SUCCESS!")
    print("==========================================================")
