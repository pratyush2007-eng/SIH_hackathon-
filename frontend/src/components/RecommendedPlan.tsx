import React, { useState } from 'react';
import type { RoutePlan } from '../data/mockData';
import { Anchor, Ship, Calendar, DollarSign, ShieldCheck, ChevronDown, ChevronUp, Download, Sliders, Info, CheckCircle2 } from 'lucide-react';

interface RecommendedPlanProps {
  plan: RoutePlan;
  onOpenWhatIf: () => void;
  onExportReport: () => void;
}

export const RecommendedPlan: React.FC<RecommendedPlanProps> = ({
  plan,
  onOpenWhatIf,
  onExportReport
}) => {
  const [showWhy, setShowWhy] = useState<boolean>(false);
  const [showCost, setShowCost] = useState<boolean>(false);

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full max-w-md p-4 pt-16 flex flex-col justify-center pointer-events-none">
      <div className="pointer-events-auto brutalist-panel p-5 overflow-y-auto max-h-[calc(100vh-5rem)] no-scrollbar space-y-4">
        {/* Recommended Badge Header */}
        <div className="flex items-center justify-between border-b border-[#333] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#4ADE80] animate-ping" />
            <span className="brutalist-data text-[10px] bg-[#4ADE80]/10 text-[#4ADE80] px-2 py-1 border border-[#4ADE80]/30 hover-glitch">
              OPTIMAL PLAN #1 RECOMMENDED
            </span>
          </div>
          <span className="brutalist-data text-[10px] text-[#999]">Score: 98.4/100</span>
        </div>

        {/* Primary Key Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 brutalist-data">
          <div className="bg-[#111] p-3 border border-[#333] hover:border-[#ff2a2a] transition-colors">
            <p className="text-[10px] text-[#999] flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#ff2a2a]" /> LANDED COST
            </p>
            <p className="text-xl font-bold text-white mt-0.5 hover-glitch">${plan.totalLandedCostUSDPerMT.toFixed(2)}<span className="text-[10px] text-[#666]">/MT</span></p>
            <p className="text-[10px] text-[#666] mt-1">Total: ${(plan.totalShipmentCostUSD / 1000000).toFixed(2)}M USD</p>
          </div>

          <div className="bg-[#111] p-3 border border-[#333] hover:border-[#4ADE80] transition-colors">
            <p className="text-[10px] text-[#999] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#4ADE80]" /> CHARTER TIMING
            </p>
            <p className="text-sm font-bold text-[#4ADE80] mt-1 hover-glitch">{plan.charterTimingWindow}</p>
            <p className="text-[10px] text-[#666] mt-1">Optimal: {plan.optimalCharterDate}</p>
          </div>
        </div>

        {/* Route Details Matrix */}
        <div className="bg-[#111] border border-[#333] p-4 text-[11px] space-y-3">
          <div className="flex items-center justify-between border-b border-[#333] pb-2">
            <span className="text-[#999] flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-[#4ADE80]" /> ORIGIN SOURCING
            </span>
            <span className="font-semibold text-white">{plan.originPort.name}</span>
          </div>

          <div className="flex items-center justify-between border-b border-[#333] pb-2">
            <span className="text-[#999] flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-[#ff2a2a]" /> DESTINATION BERTH
            </span>
            <span className="font-bold text-[#ff2a2a] animate-flicker text-xs">{plan.destinationPort.name}</span>
          </div>

          <div className="flex items-center justify-between border-b border-[#333] pb-2">
            <span className="text-[#999] flex items-center gap-1.5">
              <Ship className="w-3.5 h-3.5 text-white" /> VESSEL MATCH
            </span>
            <span className="font-semibold text-white">{plan.vesselClass.name} ({plan.vesselClass.capacityDWT.toLocaleString()} DWT)</span>
          </div>

          <div className="flex items-center justify-between border-b border-[#333] pb-2">
            <span className="text-[#999]">TRANSIT TIME & DISTANCE</span>
            <span className="font-semibold text-white">{plan.transitDays} Days ({plan.distanceNauticalMiles} NM)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#999] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" /> RELIABILITY & RISK
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#4ADE80] font-bold">{plan.onTimeReliabilityPct}%</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#111] text-[#4ADE80] border border-[#4ADE80]">
                {plan.overallRiskLevel} Risk
              </span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Accordion — COLLAPSED by default */}
        <div className="bg-[#111] border border-[#333] overflow-hidden brutalist-data text-[11px]">
          <button
            onClick={() => setShowCost(!showCost)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-[#222] transition-colors cursor-pointer border-none"
          >
            <span className="font-bold flex items-center gap-2 text-[#e5e5e5]">
              <DollarSign className="w-3.5 h-3.5 text-[#ff2a2a]" /> LANDED COST BREAKDOWN
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#ff2a2a]">${plan.totalLandedCostUSDPerMT.toFixed(2)}/MT</span>
              {showCost ? <ChevronUp className="w-3.5 h-3.5 text-[#666]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#666]" />}
            </div>
          </button>

          {showCost && (
            <div className="px-3 pb-3 space-y-1.5 border-t border-[#333]">
              {[
                { label: 'Material FOB Price', val: plan.materialFobPriceUSD, color: '#e5e5e5' },
                { label: 'Ocean Freight Rate', val: plan.freightCostUSDPerMT, color: '#e5e5e5' },
                { label: 'Vessel Charter Share', val: plan.vesselCharterCostUSDPerMT, color: '#e5e5e5' },
                { label: 'Bunkering Fuel (VLSFO)', val: plan.bunkeringFuelCostUSDPerMT, color: '#e5e5e5' },
                { label: 'Port Tariffs & Handling', val: plan.portTariffsUSDPerMT, color: '#e5e5e5' },
                { label: 'Insurance & Risk Premium', val: plan.insuranceRiskUSDPerMT || 0, color: '#ff2a2a' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-1 border-b border-[#333] last:border-0">
                  <span className="text-[#999]">{item.label}:</span>
                  <span className="font-semibold" style={{ color: item.color }}>${item.val.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1.5 mt-1 border-t border-[#555]">
                <span className="font-bold text-[#e5e5e5]">TOTAL LANDED COST:</span>
                <span className="font-bold text-[#ff2a2a] hover-glitch">${plan.totalLandedCostUSDPerMT.toFixed(2)}/MT</span>
              </div>
            </div>
          )}
        </div>

        {/* Expandable "Why this plan?" Explainability */}
        <div className="bg-[#111] border border-[#ff2a2a] overflow-hidden brutalist-data text-[11px]">
          <button
            onClick={() => setShowWhy(!showWhy)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-[#ff2a2a]/10 transition-colors cursor-pointer border-none"
          >
            <span className="font-bold text-[#ff2a2a] flex items-center gap-2">
              <Info className="w-4 h-4" /> AI EXPLAINABILITY LOG
            </span>
            {showWhy ? <ChevronUp className="w-4 h-4 text-[#ff2a2a]" /> : <ChevronDown className="w-4 h-4 text-[#ff2a2a]" />}
          </button>

          {showWhy && (
            <div className="p-3 pt-0 space-y-2 border-t border-[#ff2a2a]/30 text-[#e5e5e5] leading-relaxed">
              {plan.whyThisPlan.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ff2a2a] shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 brutalist-data text-xs pt-1">
          <button
            onClick={onOpenWhatIf}
            className="py-2.5 px-3 bg-[#111] hover:bg-[#222] border border-[#333] text-white font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer hover-glitch"
          >
            <Sliders className="w-3.5 h-3.5 text-[#ff2a2a]" />
            <span>WHAT-IF SIMULATOR</span>
          </button>

          <button
            onClick={onExportReport}
            className="py-2.5 px-3 bg-[#ff2a2a]/10 hover:bg-[#ff2a2a]/20 border border-[#ff2a2a]/40 text-[#ff2a2a] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer hover-glitch"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT REPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
