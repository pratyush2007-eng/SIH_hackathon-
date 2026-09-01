import React, { useState } from 'react';
import type { Port, RoutePlan } from '../data/mockData';
import {
  X, Anchor, AlertTriangle, ShieldAlert, Wind, Navigation2,
  Clock, ChevronDown, ChevronRight, TrendingUp, Zap, MapPin,
  CheckCircle2, Waves, Building2, BarChart3
} from 'lucide-react';

// ── Per-port threat scenario data ─────────────────────────────────────────────
const PORT_THREATS: Record<string, Array<{
  type: 'weather' | 'geopolitical' | 'congestion' | 'infrastructure';
  severity: 'Low' | 'Medium' | 'High';
  title: string;
  desc: string;
  delayP50: number; delayP95: number;
  costPerMT: number; probability: number;
  mitigation: string;
}>> = {
  'port-hedland': [
    { type: 'weather', severity: 'Medium', title: 'Tropical Cyclone Season (Nov–Apr)', desc: 'Category 2+ cyclones trigger mandatory terminal evacuation. Average 2–3 events per season affect loading schedules.', delayP50: 2.8, delayP95: 7.2, costPerMT: 1.80, probability: 0.12, mitigation: 'Charter before 1 Nov or after 30 Apr to avoid peak window.' },
    { type: 'congestion', severity: 'Low', title: 'Berth Queue — Q3 Steel Surge', desc: 'Aug–Sep steel production uplift causes 1–5 vessel queue at Berth 2 and 3. Nomination lead-time critical.', delayP50: 1.2, delayP95: 4.8, costPerMT: 0.85, probability: 0.22, mitigation: 'Reserve berth slot 7 days ahead via Port Hedland Port Authority.' },
    { type: 'infrastructure', severity: 'Low', title: 'Capesize Tidal Window', desc: 'Vessels drawing >17m restricted to 4-hour departure window around high tide. One departure slot per tide cycle.', delayP50: 0.5, delayP95: 1.2, costPerMT: 0.30, probability: 0.45, mitigation: 'Pre-schedule tide-window departure with 24h advance booking.' },
  ],
  'paradip': [
    { type: 'weather', severity: 'High', title: 'Bay of Bengal Cyclone (Oct–Dec)', desc: 'Outer anchorage exposed to 4–6m swell during cyclone events. Port suspends operations for 2–5 days per event.', delayP50: 2.4, delayP95: 8.5, costPerMT: 2.20, probability: 0.18, mitigation: 'Schedule arrival before October or after December to avoid cyclone season.' },
    { type: 'congestion', severity: 'Medium', title: 'Pre-Monsoon Steel Rush (May–Jun)', desc: 'SAIL plant stockpiling creates 4–6 vessel queue at outer anchorage. Waiting times spike 200% above average.', delayP50: 2.9, delayP95: 6.1, costPerMT: 1.60, probability: 0.28, mitigation: 'Nominate ETA 5+ days early via vessel agent for berth priority slot.' },
    { type: 'infrastructure', severity: 'Medium', title: 'Post-Monsoon Siltation', desc: 'Hooghly delta silt reduces operational draft from 16.0m to 14.5m for 6–8 weeks post-monsoon (Sep–Oct).', delayP50: 0.8, delayP95: 2.5, costPerMT: 0.95, probability: 0.35, mitigation: 'Use +1.8m high-water tide window. Capesize can transit at tidal peak.' },
    { type: 'geopolitical', severity: 'Low', title: 'Port Labour Dispute', desc: 'Historical record: 2 port strikes in last 5 years. Each caused 12–36h operational halt on all berths.', delayP50: 0.6, delayP95: 1.8, costPerMT: 0.40, probability: 0.08, mitigation: 'Monitor Indian Port Association labour bulletins 14 days before ETA.' },
  ],
  'saldanha-bay': [
    { type: 'weather', severity: 'High', title: 'Southern Ocean Winter Storms (Jun–Aug)', desc: 'Southern Annular Mode generates 8–10m swells off Cape of Good Hope. Capesize routing affected for 3–5 day windows.', delayP50: 2.2, delayP95: 5.8, costPerMT: 2.80, probability: 0.32, mitigation: 'Route via Lombok Strait instead of Cape: adds 1.5 days but avoids storm risk.' },
    { type: 'geopolitical', severity: 'Medium', title: 'Mozambique Channel Piracy Risk', desc: 'Residual piracy activity reported north of Madagascar (Comoros–Mozambique corridor). IMO advisory active.', delayP50: 0, delayP95: 0, costPerMT: 1.20, probability: 0.14, mitigation: 'Register with MSCHOA and join naval convoy escort for Indian Ocean transit.' },
    { type: 'congestion', severity: 'Low', title: 'Single-Berth Loading Bottleneck', desc: 'Saldanha Bay Iron Ore Jetty has 1 active Capesize berth. Simultaneous CVRD export conflict possible.', delayP50: 1.8, delayP95: 3.5, costPerMT: 0.70, probability: 0.20, mitigation: 'Confirm exclusive berth booking with Transnet Port Terminals 10 days prior.' },
  ],
  'gladstone': [
    { type: 'weather', severity: 'Medium', title: 'Torres Strait Seasonal Swell (Dec–Mar)', desc: 'Northwest monsoon creates 3–4m beam swell through Torres Strait, restricting Panamax/Capesize transit windows.', delayP50: 1.2, delayP95: 3.2, costPerMT: 0.80, probability: 0.25, mitigation: 'Schedule Q4 loadings to avoid monsoon-affected strait transit.' },
    { type: 'congestion', severity: 'Low', title: 'Coal Export Priority Queue', desc: 'Gladstone Port prioritizes DBCT coal export slots. Iron ore vessels may face 1–2 day wait for berth assignment.', delayP50: 1.0, delayP95: 2.8, costPerMT: 0.55, probability: 0.18, mitigation: 'Request priority nomination via Gladstone Ports Corporation vessel agent.' },
  ],
  'visakhapatnam': [
    { type: 'congestion', severity: 'Medium', title: 'Inner Harbor Draft Limitation', desc: 'Vizag outer anchorage limited to 16.5m. Steel berth #5 requires 24h tide coordination for Capesize vessels.', delayP50: 1.5, delayP95: 3.0, costPerMT: 0.90, probability: 0.30, mitigation: 'Pre-arrange tidal pilot from VSPA at least 48h before vessel arrival.' },
    { type: 'weather', severity: 'Medium', title: 'Andhra Pradesh Cyclone Coast (Oct–Nov)', desc: 'AP coast historically receives 2–3 cyclones per decade. Direct hits force 2–5 day port closure.', delayP50: 1.8, delayP95: 5.5, costPerMT: 1.50, probability: 0.15, mitigation: 'Avoid Oct–Nov arrival scheduling. Monitor IMD cyclone track bulletins.' },
  ],
  'haldia': [
    { type: 'infrastructure', severity: 'High', title: 'Hooghly River Shoaling (Critical)', desc: 'Chronic siltation restricts Haldia to max 11.5m draft during pre-monsoon. Panamax vessels may lighten cargo.', delayP50: 2.0, delayP95: 5.0, costPerMT: 2.80, probability: 0.55, mitigation: 'Switch to Supramax class (max draft 12.8m). Multiple split parcels recommended.' },
    { type: 'congestion', severity: 'High', title: 'Chronic Berth Queue (4+ Days Avg)', desc: 'Single approach channel creates chronic 4.1-day average wait. Peak Jul–Sep during pre-monsoon rush.', delayP50: 4.1, delayP95: 9.2, costPerMT: 3.50, probability: 0.65, mitigation: 'Route to Paradip as primary port. Use Haldia only for steel mill proximity advantage.' },
  ],
};

// ── Transit waypoints per plan ──────────────────────────────────────────────
const PLAN_WAYPOINTS: Record<string, Array<{ day: number; location: string; note: string; status: 'clear' | 'caution' | 'ok' }>> = {
  'plan-1': [
    { day: 0, location: 'Port Hedland (Berth #2)', note: 'Iron ore cargo loaded — Capesize 180K DWT departs', status: 'ok' },
    { day: 3.2, location: 'Sunda Strait Passage', note: 'Geopolitical check: Zero sanctions flags detected', status: 'clear' },
    { day: 5.8, location: 'Andaman Sea Channel', note: 'Weather: 1.2m swell, 15 kt winds — Favourable', status: 'clear' },
    { day: 11.5, location: 'Bay of Bengal Approach', note: 'Entering SAIL Paradip approach corridor — AIS active', status: 'ok' },
    { day: 14.5, location: 'Paradip (SAIL Berth #2)', note: 'Berth arrival — discharge at 45,000 MT/day', status: 'ok' },
  ],
  'plan-2': [
    { day: 0, location: 'Gladstone (Terminal B)', note: 'Cargo loaded — Panamax 75K DWT departs', status: 'ok' },
    { day: 2.5, location: 'Torres Strait', note: '2.8m swell advisory active — Panamax transit approved', status: 'caution' },
    { day: 7.0, location: 'Andaman Sea', note: 'AIS tracking active — clear shipping corridor', status: 'clear' },
    { day: 12.0, location: 'Bay of Bengal', note: 'Approaching East India coast — pilot booked', status: 'ok' },
    { day: 16.2, location: 'Paradip (SAIL)', note: 'Berth #2 — 1.5 day queue expected on arrival', status: 'caution' },
  ],
  'plan-3': [
    { day: 0, location: 'Saldanha Bay (Iron Ore Jetty)', note: 'Cargo loaded — Capesize 180K DWT departs via Cape', status: 'ok' },
    { day: 4.5, location: 'Cape of Good Hope', note: 'Winter storm advisory — 4m swell, 40 kt winds — Southern detour active', status: 'caution' },
    { day: 10.0, location: 'South Madagascar Passage', note: 'Indian Ocean crossing — Piracy advisory cleared', status: 'ok' },
    { day: 16.0, location: 'Southern Sri Lanka Transit', note: 'IMO convoy joined — navigational clearance confirmed', status: 'clear' },
    { day: 21.0, location: 'Paradip (SAIL Berth #2)', note: 'Reserved berth — discharge commences', status: 'ok' },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const FLAG: Record<string, string> = {
  'Australia': '🇦🇺', 'South Africa': '🇿🇦', 'Brazil': '🇧🇷',
  'Mozambique': '🇲🇿', 'India': '🇮🇳', 'China': '🇨🇳',
  'Netherlands': '🇳🇱', 'United States': '🇺🇸',
};
const severityColor = (s: string) =>
  s === 'High' ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
  : s === 'Medium' ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
  : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
const threatIcon = (t: string) =>
  t === 'weather' ? Wind : t === 'geopolitical' ? ShieldAlert : t === 'congestion' ? BarChart3 : Building2;
const statusColor = (s: string) =>
  s === 'clear' ? '#4ADE80' : s === 'caution' ? '#FBBF24' : '#2DD4E8';

// ── Component ─────────────────────────────────────────────────────────────────
interface PortDetailModalProps {
  port: Port | null;
  allPlans: RoutePlan[];
  onClose: () => void;
}

export const PortDetailModal: React.FC<PortDetailModalProps> = ({ port, allPlans, onClose }) => {
  const [expandedThreat, setExpandedThreat] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'route' | 'risk' | 'threats'>('route');

  if (!port) return null;

  const threats = PORT_THREATS[port.id] || [
    { type: 'weather', severity: 'Low' as const, title: 'Seasonal Weather Variance', desc: 'Standard seasonal weather patterns may cause minor delays.', delayP50: 0.8, delayP95: 2.5, costPerMT: 0.50, probability: 0.15, mitigation: 'Monitor 7-day forecast before departure.' },
    { type: 'congestion', severity: 'Low' as const, title: 'Port Congestion Risk', desc: 'Standard port congestion during peak trade seasons.', delayP50: 1.0, delayP95: 3.0, costPerMT: 0.70, probability: 0.20, mitigation: 'Pre-arrange berth via port agent 5 days prior.' },
  ];

  // Which plans involve this port?
  const relevantPlans = allPlans.filter(p =>
    p.originPort.id === port.id || p.destinationPort.id === port.id
  );
  const portRole = relevantPlans[0]?.originPort.id === port.id ? 'ORIGIN TERMINAL'
    : relevantPlans[0]?.destinationPort.id === port.id ? 'DESTINATION BERTH'
    : 'WAYPOINT';

  const primaryPlan = relevantPlans.find(p => p.isRecommended) || relevantPlans[0];
  const waypoints = primaryPlan ? (PLAN_WAYPOINTS[primaryPlan.id] || []) : [];


  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pr-4 pt-14 pb-4 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-xl flex flex-col rounded-2xl overflow-hidden h-full"
        style={{
          background: 'linear-gradient(160deg, rgba(2,18,32,0.97) 0%, rgba(3,25,45,0.96) 60%, rgba(2,15,28,0.98) 100%)',
          backdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(45,212,232,0.28)',
          boxShadow: '0 0 80px rgba(45,212,232,0.18), -20px 0 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="shrink-0 p-5 border-b border-white/10"
          style={{ background: 'linear-gradient(135deg, rgba(45,212,232,0.06) 0%, transparent 60%)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(45,212,232,0.12)', border: '1px solid rgba(45,212,232,0.4)' }}>
                <Anchor className="w-5 h-5" style={{ color: '#2DD4E8' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#E0F7FA', textShadow: '0 0 20px rgba(45,212,232,0.5)' }}>
                    {FLAG[port.country] || '🌐'} {port.name.toUpperCase()}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border"
                    style={{ background: portRole === 'ORIGIN TERMINAL' ? 'rgba(74,222,128,0.15)' : 'rgba(56,189,248,0.15)', borderColor: portRole === 'ORIGIN TERMINAL' ? 'rgba(74,222,128,0.4)' : 'rgba(56,189,248,0.4)', color: portRole === 'ORIGIN TERMINAL' ? '#4ADE80' : '#38BDF8', fontFamily: "'JetBrains Mono', monospace" }}>
                    {portRole}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(165,243,252,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {port.region} · {port.country} · {Math.abs(port.lat).toFixed(2)}°{port.lat > 0 ? 'N' : 'S'} {Math.abs(port.lng).toFixed(2)}°{port.lng > 0 ? 'E' : 'W'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" style={{ color: '#94A3B8' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Port Specs Grid */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: 'MAX DRAFT', value: `${port.maxDraft}m` },
              { label: 'ANNUAL CAP', value: port.handlingCap },
              { label: 'DISCHARGE', value: port.dischargeRate },
              { label: 'AVG QUEUE', value: `${port.congestionAvgDays}d` },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2 text-center" style={{ background: 'rgba(45,212,232,0.05)', border: '1px solid rgba(45,212,232,0.12)' }}>
                <div className="text-[9px] font-bold mb-1" style={{ color: 'rgba(165,243,252,0.5)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>{item.label}</div>
                <div className="text-xs font-bold" style={{ color: '#2DD4E8', fontFamily: "'JetBrains Mono', monospace", textShadow: '0 0 8px rgba(45,212,232,0.4)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Bar ──────────────────────────────────────────────────── */}
        <div className="shrink-0 flex border-b border-white/10" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {[
            { id: 'route', label: 'SEA ROUTE', icon: Navigation2 },
            { id: 'risk', label: 'RISK MATRIX', icon: BarChart3 },
            { id: 'threats', label: 'WORST-CASE SCENARIOS', icon: AlertTriangle },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id as any;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex-1 py-2.5 px-2 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                style={{
                  color: active ? '#2DD4E8' : 'rgba(148,163,184,0.7)',
                  borderBottom: active ? '2px solid #2DD4E8' : '2px solid transparent',
                  background: active ? 'rgba(45,212,232,0.06)' : 'transparent',
                  textShadow: active ? '0 0 10px rgba(45,212,232,0.5)' : 'none',
                }}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">

          {/* ── ROUTE TAB ────────────────────────────────────────────── */}
          {activeTab === 'route' && (
            <>
              {primaryPlan ? (
                <>
                  {/* Route Header Card */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(45,212,232,0.06)', border: '1px solid rgba(45,212,232,0.18)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                        <span className="font-bold text-xs" style={{ color: '#E0F7FA', fontFamily: "'Space Grotesk', sans-serif" }}>
                          {primaryPlan.originPort.name} → {primaryPlan.destinationPort.name}
                        </span>
                      </div>
                      {primaryPlan.isRecommended && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: 'rgba(74,222,128,0.2)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
                          ✓ OPTIMAL ROUTE
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {[
                        { label: 'TRANSIT', value: `${primaryPlan.transitDays}d` },
                        { label: 'DISTANCE', value: `${primaryPlan.distanceNauticalMiles.toLocaleString()} NM` },
                        { label: 'VESSEL', value: primaryPlan.vesselClass.name },
                        { label: 'COST', value: `$${primaryPlan.totalLandedCostUSDPerMT}/MT` },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="text-[9px] font-bold mb-0.5" style={{ color: 'rgba(165,243,252,0.5)' }}>{item.label}</div>
                          <div className="text-xs font-bold" style={{ color: '#2DD4E8' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transit SVG Timeline */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(2,10,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-3.5 h-3.5" style={{ color: '#2DD4E8' }} />
                      <span className="text-[11px] font-bold tracking-wider" style={{ color: '#2DD4E8', fontFamily: "'JetBrains Mono', monospace" }}>
                        TRANSIT TIMELINE — {primaryPlan.transitDays} DAYS
                      </span>
                    </div>

                    {/* Visual Route Line */}
                    <div className="relative mb-4">
                      <div className="h-0.5 w-full rounded-full" style={{ background: 'linear-gradient(90deg, #4ADE80, #2DD4E8 50%, #38BDF8)' }} />
                      <div className="flex justify-between mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <span className="text-[10px] font-bold" style={{ color: '#4ADE80' }}>DAY 0</span>
                        <span className="text-[10px] font-bold" style={{ color: '#38BDF8' }}>DAY {primaryPlan.transitDays}</span>
                      </div>
                    </div>

                    {/* Waypoint List */}
                    <div className="space-y-2.5">
                      {waypoints.map((wp, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(wp.status), boxShadow: `0 0 6px ${statusColor(wp.status)}` }} />
                            {idx < waypoints.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(45,212,232,0.15)', minHeight: 20 }} />}
                          </div>
                          <div className="pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold" style={{ color: '#2DD4E8', fontFamily: "'JetBrains Mono', monospace" }}>Day {wp.day}</span>
                              <span className="text-[11px] font-semibold" style={{ color: '#E0F7FA', fontFamily: "'Space Grotesk', sans-serif" }}>{wp.location}</span>
                            </div>
                            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(165,243,252,0.55)', fontFamily: "'JetBrains Mono', monospace" }}>{wp.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Other plans via this port */}
                  {relevantPlans.length > 1 && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(2,10,20,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-bold mb-2 tracking-wider" style={{ color: 'rgba(165,243,252,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>ALTERNATIVE PLANS VIA THIS PORT</p>
                      {relevantPlans.filter(p => !p.isRecommended).map(plan => (
                        <div key={plan.id} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                          <span className="text-xs" style={{ color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>#{plan.rank} {plan.originPort.name} → {plan.destinationPort.name}</span>
                          <span className="text-xs font-bold" style={{ color: '#FBBF24' }}>${plan.totalLandedCostUSDPerMT.toFixed(2)}/MT · {plan.transitDays}d</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8" style={{ color: 'rgba(165,243,252,0.4)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                  No active routes configured for this port.
                </div>
              )}
            </>
          )}

          {/* ── RISK MATRIX TAB ────────────────────────────────────────── */}
          {activeTab === 'risk' && primaryPlan && (
            <>
              {[
                { label: 'GEOPOLITICAL RISK', val: primaryPlan.riskScores.geopolitical, desc: 'Sanctions, conflict zones, flag-state restrictions' },
                { label: 'WEATHER / MONSOON', val: primaryPlan.riskScores.weather, desc: 'Cyclone probability, swell height, seasonal conditions' },
                { label: 'PORT CONGESTION', val: primaryPlan.riskScores.congestion, desc: 'Vessel queue depth, berth availability, discharge capacity' },
                { label: 'DELAY PROBABILITY', val: primaryPlan.riskScores.delayProbability, desc: 'Combined P(arrival > ETA + 48h)' },
              ].map((gauge, idx) => {
                const pct = Math.round(gauge.val * 100);
                const color = gauge.val < 0.25 ? '#4ADE80' : gauge.val < 0.45 ? '#FBBF24' : '#F87171';
                const label = gauge.val < 0.25 ? 'LOW' : gauge.val < 0.45 ? 'MEDIUM' : 'HIGH';
                return (
                  <div key={idx} className="rounded-xl p-3.5" style={{ background: 'rgba(2,10,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold tracking-wider" style={{ color: 'rgba(165,243,252,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>{gauge.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color, fontFamily: "'JetBrains Mono', monospace", textShadow: `0 0 10px ${color}66` }}>{pct}%</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ color, borderColor: `${color}50`, background: `${color}18`, fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 8px ${color}80` }} />
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: 'rgba(165,243,252,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>{gauge.desc}</p>
                  </div>
                );
              })}

              {/* Live Intelligence Feed */}
              <div className="rounded-xl p-3.5" style={{ background: 'rgba(2,10,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5" style={{ color: '#2DD4E8' }} />
                  <span className="text-[10px] font-bold tracking-wider" style={{ color: 'rgba(165,243,252,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>ROUTE INTELLIGENCE SIGNALS</span>
                </div>
                <div className="space-y-1.5">
                  {primaryPlan.riskSignals.map((signal, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[10px] p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', fontFamily: "'JetBrains Mono', monospace" }}>
                      <span>{signal.startsWith('✓') ? '✓' : '⚠'}</span>
                      <span style={{ color: signal.startsWith('✓') ? '#4ADE80' : '#FBBF24' }}>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── WORST-CASE SCENARIOS TAB ────────────────────────────────── */}
          {activeTab === 'threats' && (
            <>
              {/* Summary Banner */}
              <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#FBBF24' }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: '#FBBF24', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {threats.filter(t => t.severity !== 'Low').length} MEDIUM/HIGH RISK SCENARIOS ACTIVE
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(251,191,36,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
                    P95 worst-case additional cost: +${threats.reduce((s, t) => s + t.costPerMT, 0).toFixed(2)}/MT
                  </p>
                </div>
              </div>

              {/* Threat Cards */}
              {threats.map((threat, idx) => {
                const Icon = threatIcon(threat.type);
                const isExpanded = expandedThreat === idx;
                return (
                  <div key={idx} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${threat.severity === 'High' ? 'rgba(248,113,113,0.2)' : threat.severity === 'Medium' ? 'rgba(251,191,36,0.18)' : 'rgba(45,212,232,0.12)'}` }}>
                    <button
                      onClick={() => setExpandedThreat(isExpanded ? null : idx)}
                      className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-white/5 transition-colors"
                      style={{ background: isExpanded ? 'rgba(255,255,255,0.04)' : 'rgba(2,10,20,0.6)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${severityColor(threat.severity).split(' ').slice(1).join(' ')}`}
                          style={{ border: 'none' }}>
                          <Icon className="w-4 h-4" style={{ color: threat.severity === 'High' ? '#F87171' : threat.severity === 'Medium' ? '#FBBF24' : '#4ADE80' }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#E0F7FA', fontFamily: "'Space Grotesk', sans-serif" }}>{threat.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${severityColor(threat.severity)}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {threat.severity.toUpperCase()}
                            </span>
                            <span className="text-[10px]" style={{ color: 'rgba(165,243,252,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
                              P(event): {(threat.probability * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold" style={{ color: '#FBBF24', fontFamily: "'JetBrains Mono', monospace" }}>
                          +{threat.delayP50}d typical
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4 mt-1 ml-auto" style={{ color: '#94A3B8' }} /> : <ChevronRight className="w-4 h-4 mt-1 ml-auto" style={{ color: '#94A3B8' }} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <p className="text-[11px]" style={{ color: 'rgba(165,243,252,0.7)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                          {threat.desc}
                        </p>

                        {/* Impact Metrics */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'DELAY (P50)', value: `+${threat.delayP50}d`, color: '#FBBF24' },
                            { label: 'DELAY (P95)', value: `+${threat.delayP95}d`, color: '#F87171' },
                            { label: 'COST IMPACT', value: `+$${threat.costPerMT}/MT`, color: '#F87171' },
                          ].map(item => (
                            <div key={item.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="text-[9px] mb-0.5" style={{ color: 'rgba(165,243,252,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>{item.label}</div>
                              <div className="font-bold text-xs" style={{ color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Mitigation */}
                        <div className="rounded-lg p-2.5" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)' }}>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#4ADE80' }} />
                            <div>
                              <span className="text-[9px] font-bold block mb-0.5" style={{ color: '#4ADE80', fontFamily: "'JetBrains Mono', monospace" }}>MITIGATION STRATEGY</span>
                              <span className="text-[10px]" style={{ color: 'rgba(165,243,252,0.65)', fontFamily: "'JetBrains Mono', monospace', lineHeight: 1.5" }}>{threat.mitigation}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Worst-Case Total Impact */}
              <div className="rounded-xl p-3.5" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" style={{ color: '#F87171' }} />
                  <span className="text-[10px] font-bold" style={{ color: '#F87171', fontFamily: "'JetBrains Mono', monospace" }}>COMBINED WORST-CASE EXPOSURE</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {[
                    { label: 'MAX DELAY', value: `${threats.reduce((s,t) => s + t.delayP95, 0).toFixed(1)}d` },
                    { label: 'COST IMPACT', value: `+$${threats.reduce((s,t) => s + t.costPerMT, 0).toFixed(2)}/MT` },
                    { label: 'JOINT P(RISK)', value: `${(Math.min(99, threats.reduce((s,t) => s + t.probability*100, 0))).toFixed(0)}%` },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-[9px] mb-0.5" style={{ color: 'rgba(248,113,113,0.6)' }}>{item.label}</div>
                      <div className="font-bold text-sm" style={{ color: '#F87171' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] mt-2.5 text-center" style={{ color: 'rgba(248,113,113,0.5)' }}>
                  Note: Scenarios are largely independent — joint occurrence is rare but modelled here for stress testing.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="shrink-0 p-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)', fontFamily: "'JetBrains Mono', monospace" }}>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(165,243,252,0.4)' }}>
            <Waves className="w-3 h-3" style={{ color: '#2DD4E8' }} />
            <span>MARITIME.AI Intelligence Layer · Port ID: {port.id}</span>
          </div>
          <button onClick={onClose} className="text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            style={{ background: 'rgba(45,212,232,0.12)', border: '1px solid rgba(45,212,232,0.3)', color: '#2DD4E8' }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
