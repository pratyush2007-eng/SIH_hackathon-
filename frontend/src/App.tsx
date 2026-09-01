import { useState, useMemo, useEffect } from 'react';
import { HeaderTicker } from './components/HeaderTicker';
import { GlobeView } from './components/GlobeView';
import { ShipmentForm } from './components/ShipmentForm';
import type { ShipmentFormData } from './components/ShipmentForm';
import { OptimizationModal } from './components/OptimizationModal';
import { RecommendedPlan } from './components/RecommendedPlan';
import { TopNComparison } from './components/TopNComparison';
import { RiskAnalysisPanel } from './components/RiskAnalysisPanel';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { PortDetailModal } from './components/PortDetailModal';
import { MOCK_RECOMMENDED_PLANS } from './data/mockData';
import type { RoutePlan, Port } from './data/mockData';
import { ShieldAlert, CheckCircle2, Settings } from 'lucide-react';
import { checkBackendHealth, runOptimization, runWhatIfSimulation } from './services/api';

export function App() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState(0);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // plans array — can be updated by What-If scenario re-optimization or backend MILP solver
  const [currentPlans, setCurrentPlans] = useState<RoutePlan[]>(MOCK_RECOMMENDED_PLANS.default);

  // Periodically check FastAPI Backend Health
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      const res = await checkBackendHealth();
      if (isMounted) {
        setBackendOnline(res.online);
      }
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ── BUG FIX: "recommended" plan is ALWAYS the isRecommended: true plan ──
  // focusedPlanId only controls which route the globe highlights / camera follows.
  // The right-panel (RecommendedPlan) ALWAYS shows the isRecommended plan — never changes on carousel click.
  const recommendedPlan = useMemo(
    () => currentPlans.find(p => p.isRecommended) ?? currentPlans[0],
    [currentPlans]
  );
  const [focusedPlanId, setFocusedPlanId] = useState<string>(
    MOCK_RECOMMENDED_PLANS.default.find(p => p.isRecommended)?.id ?? MOCK_RECOMMENDED_PLANS.default[0].id
  );

  const [isRiskPanelOpen, setIsRiskPanelOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Port detail modal state
  const [clickedPort, setClickedPort] = useState<Port | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleStartOptimization = async (formData: ShipmentFormData) => {
    setIsFormOpen(false);
    setIsOptimizing(true);
    setOptimizationStep(0);

    const stepTimers = [
      setTimeout(() => setOptimizationStep(1), 700),
      setTimeout(() => setOptimizationStep(2), 1400),
      setTimeout(() => setOptimizationStep(3), 2100),
    ];

    const riskToleranceMap: Record<string, number> = {
      'Conservative': 0.2,
      'Balanced': 0.5,
      'Aggressive': 0.8
    };

    try {
      // Call FastAPI MILP solver endpoint
      const response = await runOptimization({
        commodity_id: formData.commodity.id,
        quantity_mt: formData.quantityMT,
        dest_port_id: formData.destinationPort.id,
        delivery_window_days: formData.deliveryWindowDays || 30,
        max_budget_usd: formData.budgetCapUSD || 35000000,
        risk_tolerance: riskToleranceMap[formData.riskTolerance] ?? 0.5,
      });

      // Wait for animation step progress
      setTimeout(() => {
        setIsOptimizing(false);
        if (response.plans && response.plans.length > 0) {
          setCurrentPlans(response.plans);
          const rec = response.recommended_plan || response.plans.find(p => p.isRecommended) || response.plans[0];
          setFocusedPlanId(rec.id);
          triggerToast(`✓ Live FastAPI MILP Engine Solved — Optimal: ${rec.originPort.name} → ${rec.destinationPort.name} ($${rec.totalLandedCostUSDPerMT.toFixed(2)}/MT)`);
        }
      }, 2800);
    } catch (err) {
      console.warn('Backend API unavailable or error, falling back to simulated engine:', err);
      setTimeout(() => {
        setIsOptimizing(false);
        const rec = MOCK_RECOMMENDED_PLANS.default.find(p => p.isRecommended)!;
        setFocusedPlanId(rec.id);
        triggerToast('⚡ Fallback Mode (Backend offline) — Optimal Route: Port Hedland → Paradip');
      }, 2800);
    } finally {
      stepTimers.forEach(t => clearTimeout(t));
    }
  };

  const handleReoptimize = async (params: { charterShiftDays: number; fuelPriceShiftPct: number; congestionFactor: number }) => {
    setIsWhatIfOpen(false);
    setIsOptimizing(true);
    setOptimizationStep(1);

    const stepTimers = [
      setTimeout(() => setOptimizationStep(2), 600),
      setTimeout(() => setOptimizationStep(3), 1100),
    ];

    try {
      // Call FastAPI What-If Simulation endpoint
      const response = await runWhatIfSimulation({
        commodity_id: recommendedPlan.commodityId || 'iron-ore',
        quantity_mt: recommendedPlan.quantityMT || 150000,
        dest_port_id: recommendedPlan.destinationPort.id || 'paradip',
        charter_shift_days: params.charterShiftDays,
        fuel_price_shift_pct: params.fuelPriceShiftPct,
        congestion_factor: params.congestionFactor,
        risk_tolerance: 0.5,
      });

      setTimeout(() => {
        setIsOptimizing(false);
        if (response.plans && response.plans.length > 0) {
          setCurrentPlans(response.plans);
          const newRec = response.recommended_plan || response.plans.find(p => p.isRecommended) || response.plans[0];
          setFocusedPlanId(newRec.id);
          triggerToast(`⚡ Real-Time What-If Recalculated by FastAPI: $${newRec.totalLandedCostUSDPerMT.toFixed(2)}/MT`);
        }
      }, 1500);
    } catch (err) {
      console.warn('Backend What-If API call failed, applying client fallback formula:', err);
      const newPlans = currentPlans.map(plan => {
        const shiftCost =
          params.charterShiftDays * 0.45 +
          params.fuelPriceShiftPct * 0.18 +
          (params.congestionFactor - 1.0) * 2.80;
        const newLanded = parseFloat((plan.totalLandedCostUSDPerMT + shiftCost).toFixed(2));
        return { ...plan, totalLandedCostUSDPerMT: newLanded, totalShipmentCostUSD: Math.round(newLanded * plan.quantityMT) };
      });
      setCurrentPlans(newPlans);
      setTimeout(() => {
        setIsOptimizing(false);
        const newRec = newPlans.find(p => p.isRecommended) ?? newPlans[0];
        setFocusedPlanId(newRec.id);
        triggerToast(`Scenario Re-calculated (Fallback Mode) — Landed: $${newRec.totalLandedCostUSDPerMT.toFixed(2)}/MT`);
      }, 1500);
    } finally {
      stepTimers.forEach(t => clearTimeout(t));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-black">
      <div className="brutalist-bg" />
      
      {/* Brutalist Crosshairs */}
      <div className="crosshair top-8 left-8" />
      <div className="crosshair top-8 right-8" />
      <div className="crosshair bottom-8 left-8" />
      <div className="crosshair bottom-8 right-8" />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <HeaderTicker backendOnline={backendOnline} />

      {/* ── 3D GLOBE ────────────────────────────────────────────── */}
      <GlobeView
        recommendedPlan={recommendedPlan}
        allPlans={currentPlans}
        focusedPlanId={focusedPlanId}
        isOptimizing={isOptimizing}
        optimizationStep={optimizationStep}
        onPortClick={(port: Port) => setClickedPort(port)}
      />

      {/* ── BOTTOM-LEFT CTA BUTTONS ───────────────────────────── */}
      {!isFormOpen && !isOptimizing && (
        <div className="fixed bottom-8 left-8 z-20 flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => setIsFormOpen(true)}
            className="brutalist-panel hover-glitch py-3 px-6 font-bold text-xs tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer brutalist-data"
            style={{
              background: 'var(--accent-red)',
              color: '#fff',
              border: 'none',
              boxShadow: '4px 4px 0 rgba(255,255,255,0.1)'
            }}
          >
            <Settings size={14} className="animate-spin-slow" />
            <span>INITIALIZE OPTIMIZER</span>
          </button>

          {recommendedPlan && (
            <button
              onClick={() => setIsRiskPanelOpen(!isRiskPanelOpen)}
              className="brutalist-panel py-3 px-4 font-bold text-xs tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer brutalist-data"
              style={{
                background: isRiskPanelOpen ? 'var(--text-color)' : 'transparent',
                color: isRiskPanelOpen ? 'var(--bg-color)' : 'var(--text-color)',
              }}
            >
              <ShieldAlert size={14} />
              <span className="hidden sm:inline">RISK MONITOR</span>
            </button>
          )}
        </div>
      )}

      {/* ── PANELS ──────────────────────────────────────────────── */}
      <ShipmentForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleStartOptimization} />
      <OptimizationModal isOptimizing={isOptimizing} step={optimizationStep} candidatePlans={currentPlans} />

      {/* Recommended plan RIGHT panel — ALWAYS shows the isRecommended plan, never changes on carousel clicks */}
      {!isOptimizing && recommendedPlan && !isFormOpen && (
        <RecommendedPlan
          plan={recommendedPlan}
          onOpenWhatIf={() => setIsWhatIfOpen(true)}
          onExportReport={() => triggerToast('📄 Decision Report Exported (PDF/JSON) for SAIL Procurement Board')}
        />
      )}

      {/* TopN carousel — controls globe focus via setFocusedPlanId, NOT the right panel */}
      {!isOptimizing && recommendedPlan && !isFormOpen && (
        <TopNComparison
          plans={currentPlans}
          focusedPlanId={focusedPlanId}
          onFocusPlan={(planId: string) => {
            setFocusedPlanId(planId);
            const plan = currentPlans.find(p => p.id === planId);
            if (plan) triggerToast(`Globe focused on: ${plan.originPort.name} → ${plan.destinationPort.name}`);
          }}
        />
      )}

      {!isOptimizing && recommendedPlan && (
        <RiskAnalysisPanel plan={recommendedPlan} isOpen={isRiskPanelOpen} onClose={() => setIsRiskPanelOpen(false)} />
      )}

      {recommendedPlan && (
        <WhatIfSimulator isOpen={isWhatIfOpen} onClose={() => setIsWhatIfOpen(false)} currentPlan={recommendedPlan} onReoptimize={handleReoptimize} />
      )}

      {/* ── PORT DETAIL MODAL ──────────────────────────────────── */}
      {clickedPort && (
        <PortDetailModal
          port={clickedPort}
          allPlans={currentPlans}
          onClose={() => setClickedPort(null)}
        />
      )}

      {/* ── TOAST ────────────────────────────────────────────────── */}
      {toastMessage && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl flex items-center gap-2.5"
          style={{
            background: 'linear-gradient(135deg, rgba(2,20,35,0.97) 0%, rgba(4,35,55,0.97) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(45,212,232,0.4)',
            boxShadow: '0 0 30px rgba(45,212,232,0.25), 0 8px 32px rgba(0,0,0,0.5)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#A5F3FC',
            whiteSpace: 'nowrap',
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#4ADE80' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
