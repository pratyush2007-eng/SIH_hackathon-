// ==============================================================================
// MARITIME FREIGHT IQ - FASTAPI BACKEND API CLIENT
// File: frontend/src/services/api.ts
// Connects React UI directly to Python FastAPI MILP Engine & Data Pipelines
// ==============================================================================

import type { RoutePlan, Port, VesselClass } from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface OptimizationRequestPayload {
  commodity_id: string;
  quantity_mt: number;
  dest_port_id: string;
  delivery_window_days: number;
  max_budget_usd: number;
  risk_tolerance: number; // 0.0 (cautious) to 1.0 (aggressive)
}

export interface WhatIfRequestPayload {
  commodity_id: string;
  quantity_mt: number;
  dest_port_id: string;
  charter_shift_days: number;
  fuel_price_shift_pct: number;
  congestion_factor: number;
  risk_tolerance: number;
}

export interface OptimizationApiResponse {
  status: string;
  solver_status: string;
  plans: RoutePlan[];
  recommended_plan: RoutePlan;
  input_parameters: Record<string, any>;
  scenario_deltas?: Record<string, any>;
}

/**
 * Check if the Python FastAPI backend server is online and reachable.
 */
export async function checkBackendHealth(): Promise<{ online: boolean; platform?: string; version?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { online: true, platform: data.platform, version: 'v2.0' };
    }
    return { online: false };
  } catch (_err) {
    return { online: false };
  }
}

/**
 * Run Layer 5 MILP Freight Optimization via FastAPI
 */
export async function runOptimization(payload: OptimizationRequestPayload): Promise<OptimizationApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Optimization API failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Run Layer 6 Real-Time What-If Parameter Re-Optimization
 */
export async function runWhatIfSimulation(payload: WhatIfRequestPayload): Promise<OptimizationApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/optimize/what-if`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`What-If Simulation API failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Fetch Ports Catalog from Layer 7 API
 */
export async function fetchPortsCatalog(): Promise<Port[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ports`);
  if (!response.ok) throw new Error('Failed to fetch ports catalog');
  const data = await response.json();
  return data.ports;
}

/**
 * Fetch Vessel Classes Catalog from Layer 7 API
 */
export async function fetchVesselsCatalog(): Promise<VesselClass[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/vessels`);
  if (!response.ok) throw new Error('Failed to fetch vessels catalog');
  const data = await response.json();
  return data.vessels;
}

/**
 * Fetch Database summary from Layer 1 API
 */
export async function fetchDatabaseSummary(): Promise<Record<string, number>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/data/summary`);
  if (!response.ok) throw new Error('Failed to fetch database summary');
  const data = await response.json();
  return data.tables;
}
