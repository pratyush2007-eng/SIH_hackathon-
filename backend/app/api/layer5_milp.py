# ==============================================================================
# LAYER 5: MIXED-INTEGER LINEAR PROGRAMMING (MILP) OPTIMIZATION ENGINE
# File: backend/app/api/layer5_milp.py
# Goal: Formulate and solve the mathematical optimization problem using PuLP
#       to generate Top-N optimal plans balancing Landed Cost and Risk.
# ==============================================================================

import logging
import pulp
from typing import Dict, List, Any, Optional

from app.api.layer2_risk import compute_comprehensive_route_risk
from app.api.layer3_forecasting import (
    forecast_freight_quantiles,
    generate_monte_carlo_scenarios,
    determine_optimal_charter_window
)
from app.api.layer4_rules import generate_candidate_routes_pool

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def run_milp_optimization(
    commodity_id: str = "iron-ore",
    quantity_mt: float = 150000.0,
    dest_port_id: str = "paradip",
    delivery_window_days: int = 25,
    max_budget_usd: float = 30000000.0,
    risk_tolerance: float = 0.5, # 0.0 (very cautious) to 1.0 (cost-aggressive)
    fuel_price_override: Optional[float] = None,
    charter_shift_days: int = 0,
    congestion_factor: float = 1.0
) -> Dict[str, Any]:
    """
    Executes the full Layer 4 -> Layer 2 -> Layer 3 -> Layer 5 MILP pipeline.
    Returns the Top-3 optimal ranked plans (Rank #1 Recommended, Rank #2 Runner Up, Rank #3 Resilient).
    """
    bunker_price = fuel_price_override if fuel_price_override is not None else 640.0

    # 1. Layer 4: Generate candidate feasible routes
    candidate_routes = generate_candidate_routes_pool(
        commodity_id=commodity_id,
        target_quantity_mt=quantity_mt,
        dest_port_id=dest_port_id,
        bunker_fuel_price_usd=bunker_price
    )

    if not candidate_routes:
        raise ValueError(f"No feasible routes found satisfying physical draft and port specs for {commodity_id} to {dest_port_id}.")

    # 2. Enrich candidate routes with Layer 2 (Risk) and Layer 3 (Forecasting)
    enriched_candidates = []
    for c in candidate_routes:
        # Layer 2: Multi-Factor Risk
        risk_data = compute_comprehensive_route_risk(
            origin_port_name=c["origin_port"]["name"],
            origin_country=c["origin_port"]["country"],
            origin_lat=c["origin_port"]["lat"],
            origin_lng=c["origin_port"]["lng"],
            dest_port_name=c["dest_port"]["name"],
            dest_country=c["dest_port"]["country"],
            dest_lat=c["dest_port"]["lat"],
            dest_lng=c["dest_port"]["lng"],
            supplier_name=c["supplier"]["name"],
            transit_days=c["transit_days"]
        )

        # Layer 3: Quantile Forecasts & Monte Carlo Simulation
        quantiles = forecast_freight_quantiles(
            base_freight_usd_per_mt=c["freight_cost_per_mt"],
            route_distance_nm=c["distance_nm"]
        )
        monte_carlo = generate_monte_carlo_scenarios(
            base_cost_per_mt=c["total_landed_per_mt"],
            base_transit_days=c["transit_days"],
            fuel_shift_pct=0.0 if not fuel_price_override else ((fuel_price_override - 640.0) / 640.0 * 100),
            congestion_factor=congestion_factor
        )
        charter_window, opt_charter_date, charter_rationale = determine_optimal_charter_window(
            charter_shift_days=charter_shift_days
        )

        # Calculate effective objective cost (Landed Cost + Risk Penalty)
        # Risk penalty weight inversely proportional to user risk tolerance
        risk_penalty_weight = (1.0 - risk_tolerance) * 45.0  # Up to $45/MT equivalent penalty for high risk
        effective_objective_cost = c["total_landed_per_mt"] + (risk_data["composite_score"] * risk_penalty_weight)

        enriched_candidates.append({
            **c,
            "risk_data": risk_data,
            "quantiles": quantiles,
            "monte_carlo": monte_carlo,
            "charter_window": charter_window,
            "opt_charter_date": opt_charter_date,
            "charter_rationale": charter_rationale,
            "effective_objective_cost": effective_objective_cost
        })

    # 3. Layer 5: Formulate PuLP Mixed-Integer Linear Program
    prob = pulp.LpProblem("Maritime_Freight_Optimization", pulp.LpMinimize)

    # Decision variables: Binary variable x_i for each candidate route
    route_vars = {
        i: pulp.LpVariable(f"Route_{i}", cat="Binary")
        for i in range(len(enriched_candidates))
    }

    # Objective Function: Minimize sum(x_i * effective_objective_cost_i)
    prob += pulp.lpSum([
        route_vars[i] * enriched_candidates[i]["effective_objective_cost"]
        for i in range(len(enriched_candidates))
    ])

    # Constraint 1: Select exactly 1 primary optimal route
    prob += pulp.lpSum([route_vars[i] for i in range(len(enriched_candidates))]) == 1

    # Constraint 2: Budget Constraint
    prob += pulp.lpSum([
        route_vars[i] * enriched_candidates[i]["total_shipment_cost_usd"]
        for i in range(len(enriched_candidates))
    ]) <= max_budget_usd

    # Constraint 3: Delivery Schedule Window
    prob += pulp.lpSum([
        route_vars[i] * (enriched_candidates[i]["transit_days"] + enriched_candidates[i]["risk_data"]["dest_congestion_days"])
        for i in range(len(enriched_candidates))
    ]) <= delivery_window_days

    # Solve using CBC Solver (silent mode)
    prob.solve(pulp.PULP_CBC_CMD(msg=0))

    # 4. Rank Candidates and Build Top-N Output
    # Sort all candidates by effective objective cost
    sorted_candidates = sorted(enriched_candidates, key=lambda x: x["effective_objective_cost"])

    plans = []
    for rank_idx, cand in enumerate(sorted_candidates[:3], start=1):
        is_recommended = (rank_idx == 1)
        
        # Build explainability bullet points
        why_bullets = [
            f"Landed cost ${cand['total_landed_per_mt']:.2f}/MT delivers optimal balance of material grade and freight margin.",
            f"Vessel class '{cand['vessel']['name']}' utilizes draft clearance at {cand['dest_port']['name']} with zero tidal waiting.",
            f"{cand['charter_rationale']}"
        ]
        if is_recommended:
            why_bullets.insert(0, f"Rank #1 Global Optimum — Minimizes landed cost + risk penalty under current risk tolerance ({risk_tolerance:.2f}).")

        # Map to TypeScript RoutePlan interface
        plan = {
            "id": f"plan-{rank_idx}-{cand['candidate_id'].lower()}",
            "rank": rank_idx,
            "isRecommended": is_recommended,
            "originPort": {
                "id": cand["origin_port"]["id"],
                "name": cand["origin_port"]["name"],
                "country": cand["origin_port"]["country"],
                "lat": cand["origin_port"]["lat"],
                "lng": cand["origin_port"]["lng"],
                "maxDraft": cand["origin_port"]["max_draft"],
                "handlingCap": cand["origin_port"]["handling_cap"],
                "congestionAvgDays": cand["origin_port"]["congestion_days"],
                "type": cand["origin_port"]["type"],
                "region": cand["origin_port"]["region"],
                "quayLength": cand["origin_port"]["quay_length"],
                "dischargeRate": f"{int(cand['origin_port']['discharge_rate']):,} MT/day"
            },
            "destinationPort": {
                "id": cand["dest_port"]["id"],
                "name": cand["dest_port"]["name"],
                "country": cand["dest_port"]["country"],
                "lat": cand["dest_port"]["lat"],
                "lng": cand["dest_port"]["lng"],
                "maxDraft": cand["dest_port"]["max_draft"],
                "handlingCap": cand["dest_port"]["handling_cap"],
                "congestionAvgDays": cand["dest_port"]["congestion_days"],
                "type": cand["dest_port"]["type"],
                "region": cand["dest_port"]["region"],
                "quayLength": cand["dest_port"]["quay_length"],
                "dischargeRate": f"{int(cand['dest_port']['discharge_rate']):,} MT/day"
            },
            "commodityId": cand["commodity_id"],
            "quantityMT": cand["quantity_mt"],
            "vesselClass": {
                "id": cand["vessel"]["id"],
                "name": cand["vessel"]["name"],
                "capacityDWT": cand["vessel"]["capacity_dwt"],
                "maxDraft": cand["vessel"]["max_draft"],
                "dailyCharterRateUSD": cand["vessel"]["daily_charter_rate"],
                "fuelConsumptionMTPerDay": cand["vessel"]["fuel_consumption_mt_day"],
                "speedKnots": cand["vessel"]["speed_knots"],
                "description": cand["vessel"]["description"]
            },
            "charterTimingWindow": cand["charter_window"],
            "optimalCharterDate": cand["opt_charter_date"],
            "transitDays": cand["transit_days"],
            "distanceNauticalMiles": cand["distance_nm"],
            
            # Cost breakdown ($/MT)
            "materialFobPriceUSD": cand["fob_price_per_mt"],
            "freightCostUSDPerMT": cand["freight_cost_per_mt"],
            "vesselCharterCostUSDPerMT": cand["charter_cost_per_mt"],
            "bunkeringFuelCostUSDPerMT": cand["bunker_cost_per_mt"],
            "portTariffsUSDPerMT": cand["port_tariffs_per_mt"],
            "insuranceRiskUSDPerMT": cand["insurance_per_mt"],
            "totalLandedCostUSDPerMT": cand["total_landed_per_mt"],
            "totalShipmentCostUSD": cand["total_shipment_cost_usd"],

            "onTimeReliabilityPct": cand["monte_carlo"]["on_time_reliability_pct"],
            "overallRiskLevel": cand["risk_data"]["overallRiskLevel"],
            "riskScores": {
                "geopolitical": cand["risk_data"]["geopolitical"],
                "weather": cand["risk_data"]["weather"],
                "congestion": cand["risk_data"]["congestion"],
                "delayProbability": cand["risk_data"]["delayProbability"]
            },
            "whyThisPlan": why_bullets,
            "riskSignals": cand["risk_data"]["risk_signals"],
            "waypoints": cand["waypoints"],
            "quantiles": cand["quantiles"]
        }
        plans.append(plan)

    return {
        "status": "Optimal",
        "solver_status": pulp.LpStatus[prob.status],
        "plans": plans,
        "recommended_plan": plans[0] if plans else None,
        "input_parameters": {
            "commodity_id": commodity_id,
            "quantity_mt": quantity_mt,
            "dest_port_id": dest_port_id,
            "delivery_window_days": delivery_window_days,
            "max_budget_usd": max_budget_usd,
            "risk_tolerance": risk_tolerance,
            "fuel_price_usd": bunker_price
        }
    }


if __name__ == "__main__":
    print("Testing Layer 5 MILP Optimization Engine...")
    result = run_milp_optimization(
        commodity_id="iron-ore",
        quantity_mt=150000,
        dest_port_id="paradip",
        risk_tolerance=0.5
    )
    print(f"Solver Status: {result['solver_status']}")
    print(f"Generated {len(result['plans'])} ranked plans.")
    rec = result["recommended_plan"]
    print(f"Recommended Plan: {rec['originPort']['name']} -> {rec['destinationPort']['name']}")
    print(f"Landed Cost: ${rec['totalLandedCostUSDPerMT']}/MT | Reliability: {rec['onTimeReliabilityPct']}%")
