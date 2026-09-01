import React, { useState } from 'react';
import type { RoutePlan } from '../data/mockData';
import { Eye, Trophy, Globe2 } from 'lucide-react';

interface TopNComparisonProps {
  plans: RoutePlan[];
  /** Which plan ID the globe is currently highlighting (camera + arc focus) */
  focusedPlanId: string;
  /** Tell App to change globe focus — does NOT affect the right-side RecommendedPlan panel */
  onFocusPlan: (planId: string) => void;
}

export const TopNComparison: React.FC<TopNComparisonProps> = ({ plans, focusedPlanId, onFocusPlan }) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 pointer-events-none">
      <div className="pointer-events-auto brutalist-panel p-4 brutalist-data">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333] pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#ff2a2a]" />
            <h3 className="font-bold text-xs tracking-wider text-white">
              TOP-3 FEASIBLE ROUTE STRATEGIES
            </h3>
            <span className="text-[10px] px-2 py-0.5 border border-[#333] text-[#999] bg-[#111]">
              Click card to focus globe
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(['cards', 'table'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-2.5 py-1 text-[10px] transition-colors cursor-pointer hover-glitch"
                style={{
                  color: viewMode === mode ? '#ff2a2a' : '#999',
                  background: viewMode === mode ? 'rgba(255,42,42,0.1)' : 'transparent',
                  border: viewMode === mode ? '1px solid #ff2a2a' : '1px solid #333',
                }}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Cards View */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {plans.map(plan => {
              const isFocused = plan.id === focusedPlanId;
              const isRec = plan.isRecommended;
              return (
                <div
                  key={plan.id}
                  className={`p-3 cursor-pointer transition-colors border ${isFocused ? 'bg-[#ff2a2a]/10 border-[#ff2a2a]' : 'bg-[#111] border-[#333] hover:border-[#ff2a2a]/50'}`}
                  onClick={() => onFocusPlan(plan.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold border ${isRec ? 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]' : 'bg-[#222] text-[#999] border-[#444]'}`}
                    >
                      #{plan.rank} {isRec ? '✓ RECOMMENDED' : 'ALTERNATIVE'}
                    </span>
                    <span className="font-bold text-sm text-[#ff2a2a] hover-glitch">
                      ${plan.totalLandedCostUSDPerMT.toFixed(2)}<span className="text-[#666] text-[10px]">/MT</span>
                    </span>
                  </div>

                  <p className="font-bold text-white text-[11px] truncate uppercase brutalist-heading">
                    {plan.originPort.name} → <span className="animate-flicker text-[#ff2a2a]">{plan.destinationPort.name}</span>
                  </p>
                  <p className="text-[10px] mt-0.5 text-[#999]">
                    {plan.vesselClass.name} · {plan.transitDays} days
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#333] flex justify-between items-center text-[10px]">
                    <span className="text-[#4ADE80] font-semibold">{plan.onTimeReliabilityPct}% On-Time</span>
                    <button
                      onClick={e => { e.stopPropagation(); onFocusPlan(plan.id); }}
                      className={`flex items-center gap-1 font-bold cursor-pointer transition-opacity hover-glitch ${isFocused ? 'text-[#ff2a2a]' : 'text-[#666]'}`}
                    >
                      {isFocused
                        ? <><Globe2 className="w-3 h-3" /> FOCUSED</>
                        : <><Eye className="w-3 h-3" /> FOCUS GLOBE</>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse brutalist-data">
              <thead>
                <tr className="border-b border-[#333] text-[#999] text-[10px]">
                  {['RANK', 'ROUTE', 'VESSEL', 'LANDED COST', 'CHARTER WINDOW', 'RELIABILITY', 'FOCUS'].map(h => (
                    <th key={h} className="py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {plans.map(plan => (
                  <tr
                    key={plan.id}
                    className="hover:bg-[#222] transition-colors cursor-pointer"
                    style={{ background: plan.id === focusedPlanId ? 'rgba(255,42,42,0.1)' : '' }}
                    onClick={() => onFocusPlan(plan.id)}
                  >
                    <td className="py-2 px-3 font-bold text-white">#{plan.rank}</td>
                    <td className="py-2 px-3 font-semibold text-white">
                      {plan.originPort.name} → <span className="animate-flicker text-[#ff2a2a]">{plan.destinationPort.name}</span>
                    </td>
                    <td className="py-2 px-3 text-[#999]">{plan.vesselClass.name}</td>
                    <td className="py-2 px-3 font-bold text-[#ff2a2a] hover-glitch">${plan.totalLandedCostUSDPerMT.toFixed(2)}/MT</td>
                    <td className="py-2 px-3 text-[#4ADE80]">{plan.charterTimingWindow}</td>
                    <td className="py-2 px-3 text-[#999]">{plan.onTimeReliabilityPct}%</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={e => { e.stopPropagation(); onFocusPlan(plan.id); }}
                        className={`px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border hover-glitch ${plan.id === focusedPlanId ? 'bg-[#ff2a2a]/20 text-[#ff2a2a] border-[#ff2a2a]' : 'bg-[#222] text-[#999] border-[#444]'}`}
                      >
                        <Eye className="w-3 h-3" />
                        {plan.id === focusedPlanId ? 'FOCUSED' : 'VIEW'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
