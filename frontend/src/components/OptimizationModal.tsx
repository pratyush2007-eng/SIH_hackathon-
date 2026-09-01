import React from 'react';
import { Cpu, Zap } from 'lucide-react';
import type { RoutePlan } from '../data/mockData';

interface OptimizationModalProps {
  isOptimizing: boolean;
  step: number;
  candidatePlans: RoutePlan[];
  onComplete?: () => void;
}

export const OptimizationModal: React.FC<OptimizationModalProps> = ({
  isOptimizing,
  step,
  candidatePlans
}) => {
  const optimizationStages = [
    { label: 'DISCOVERING CANDIDATE ORIGINS & TERMINALS', desc: 'Evaluating 6 global bulk loading ports (Port Hedland, Gladstone, Saldanha Bay, Tubarão)...' },
    { label: 'FORECASTING BDI & FREIGHT CHARTER CURVES', desc: 'Running Capesize / Panamax spot & forward curve prediction models (14-day horizon)...' },
    { label: 'VERIFYING DRAFT & BERTH CONSTRAINTS', desc: 'Simulating tide tables, discharge rates & berth draft limits for East Coast India...' },
    { label: 'SOLVING MILP LANDED COST MINIMIZATION', desc: 'Selected: Port Hedland -> Paradip | Capesize Vessel ($108.20/MT Landed)' }
  ];

  if (!isOptimizing) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-6">
      {/* Top Banner */}
      <div
        className="mx-auto px-6 py-3 rounded-2xl flex items-center gap-4 text-white font-mono pointer-events-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(2,18,30,0.95) 0%, rgba(4,30,50,0.90) 100%)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(45,212,232,0.40)',
          boxShadow: '0 0 50px rgba(45,212,232,0.25), 0 8px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-[#2DD4E8] flex items-center justify-center text-[#2DD4E8] animate-pulse">
          <Cpu className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#2DD4E8]">AI SOLVER ENGAGED</span>
            <span className="text-[10px] bg-[#2DD4E8]/20 px-2 py-0.5 rounded text-white border border-[#2DD4E8]/30">
              STEP {step + 1} / 4
            </span>
          </div>
          <p className="text-xs text-gray-300 font-semibold">{optimizationStages[step]?.label}</p>
        </div>
      </div>

      {/* Center Dynamic Metric Overlay Cards */}
      <div
        className="mx-auto my-auto max-w-xl w-full rounded-2xl p-5 font-mono text-white pointer-events-auto space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(2,18,30,0.90) 0%, rgba(4,30,50,0.85) 100%)',
          backdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(45,212,232,0.28)',
          boxShadow: '0 0 70px rgba(45,212,232,0.18), 0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#2DD4E8]" /> EVALUATING ROUTE CANDIDATES
          </span>
          <span className="text-[#2DD4E8] animate-pulse">LIVE SOLVER MATH...</span>
        </div>

        <div className="space-y-2">
          {candidatePlans.map((plan, idx) => {
            const isWinner = plan.isRecommended && step >= 3;
            const isEvaluating = step >= 1;

            return (
              <div
                key={plan.id}
                className={`p-3 rounded-xl border transition-all duration-500 flex items-center justify-between ${
                  isWinner
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(74,222,128,0.3)] scale-[1.02]'
                    : isEvaluating
                    ? 'bg-[#0D1220] border-[#2DD4E8]/20 text-gray-300'
                    : 'bg-white/5 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isWinner ? 'bg-emerald-400 text-black' : 'bg-cyan-500/20 text-[#2DD4E8]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-xs">
                      {plan.originPort.name} → {plan.destinationPort.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {plan.vesselClass.name} Carrier · {plan.transitDays} Days Transit
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-xs font-mono text-[#2DD4E8]">
                    ${isWinner ? plan.totalLandedCostUSDPerMT : (plan.totalLandedCostUSDPerMT + (Math.random() * 2 - 1)).toFixed(2)}/MT
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Reliability: {plan.onTimeReliabilityPct}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-gray-400 text-center font-mono">
          {optimizationStages[step]?.desc}
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="max-w-md mx-auto w-full bg-[#0A0E17]/90 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center font-mono text-xs pointer-events-auto">
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-2">
          <div
            className="bg-gradient-to-r from-[#2DD4E8] to-emerald-400 h-full transition-all duration-700 ease-out"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>
        <span className="text-gray-300">
          Optimization in progress... {((step + 1) * 25)}%
        </span>
      </div>
    </div>
  );
};
