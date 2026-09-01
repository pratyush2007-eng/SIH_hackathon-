import React, { useState } from 'react';
import type { RoutePlan } from '../data/mockData';
import { Sliders, RefreshCw, X, Fuel, Clock, AlertTriangle } from 'lucide-react';

interface WhatIfSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: RoutePlan;
  onReoptimize: (updatedParams: {
    charterShiftDays: number;
    fuelPriceShiftPct: number;
    congestionFactor: number;
  }) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  isOpen,
  onClose,
  currentPlan,
  onReoptimize
}) => {
  const [charterShiftDays, setCharterShiftDays] = useState<number>(0);
  const [fuelPriceShiftPct, setFuelPriceShiftPct] = useState<number>(0);
  const [congestionFactor, setCongestionFactor] = useState<number>(1.0);

  if (!isOpen) return null;

  const simulatedLandedCost = (
    currentPlan.totalLandedCostUSDPerMT +
    (charterShiftDays * 0.45) +
    (fuelPriceShiftPct * 0.18) +
    ((congestionFactor - 1.0) * 2.80)
  ).toFixed(2);

  const handleApply = () => {
    onReoptimize({
      charterShiftDays,
      fuelPriceShiftPct,
      congestionFactor
    });
  };

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-full max-w-md p-4 pt-16 flex flex-col justify-center pointer-events-none">
      <div
        className="pointer-events-auto rounded-2xl p-5 overflow-y-auto max-h-[calc(100vh-5rem)] no-scrollbar space-y-4 font-mono"
        style={{
          background: 'linear-gradient(135deg, rgba(2,20,35,0.96) 0%, rgba(4,35,55,0.92) 50%, rgba(2,15,28,0.97) 100%)',
          backdropFilter: 'blur(28px) saturate(200%)',
          border: '1px solid rgba(45,212,232,0.28)',
          boxShadow: '0 0 60px rgba(45,212,232,0.18), 0 20px 60px rgba(0,0,0,0.65)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2DD4E8]/20 border border-[#2DD4E8] flex items-center justify-center text-[#2DD4E8]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2DD4E8]">WHAT-IF SCENARIO SIMULATOR</h3>
              <p className="text-[10px] text-gray-400">Stress test parameters & recalculate landed cost</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulation Preview Card */}
        <div className="bg-[#0D1220] p-3.5 rounded-xl border border-[#2DD4E8]/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400">PROJECTED SIMULATED COST</span>
            <p className="text-2xl font-bold text-[#2DD4E8] mt-0.5">
              ${simulatedLandedCost}<span className="text-xs text-gray-400">/MT</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400">BASE COST</span>
            <p className="text-xs text-gray-300 font-bold mt-0.5">
              ${currentPlan.totalLandedCostUSDPerMT.toFixed(2)}/MT
            </p>
            <span className={`text-[10px] font-bold ${
              Number(simulatedLandedCost) <= currentPlan.totalLandedCostUSDPerMT ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {Number(simulatedLandedCost) <= currentPlan.totalLandedCostUSDPerMT ? '▼ Savings' : '▲ Premium'}
            </span>
          </div>
        </div>

        {/* Slider 1: Charter Timing Shift */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2DD4E8]" /> CHARTER FIX DATE DELAY
            </span>
            <span className="text-[#2DD4E8] font-bold">
              {charterShiftDays > 0 ? `+${charterShiftDays}` : charterShiftDays} Days
            </span>
          </div>
          <input
            type="range"
            min={-7}
            max={14}
            step={1}
            value={charterShiftDays}
            onChange={(e) => setCharterShiftDays(Number(e.target.value))}
            className="w-full accent-[#2DD4E8]"
          />
          <p className="text-[10px] text-gray-400">Simulates market spot charter rate inflation over waiting time.</p>
        </div>

        {/* Slider 2: Fuel Price Variance */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-[#2DD4E8]" /> VLSFO BUNKER FUEL PRICE SHIFT
            </span>
            <span className="text-[#2DD4E8] font-bold">
              {fuelPriceShiftPct > 0 ? `+${fuelPriceShiftPct}` : fuelPriceShiftPct}%
            </span>
          </div>
          <input
            type="range"
            min={-20}
            max={30}
            step={5}
            value={fuelPriceShiftPct}
            onChange={(e) => setFuelPriceShiftPct(Number(e.target.value))}
            className="w-full accent-[#2DD4E8]"
          />
          <p className="text-[10px] text-gray-400">Adjusts marine bunker fuel price curve ($612/MT base).</p>
        </div>

        {/* Slider 3: Port Congestion Factor */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#2DD4E8]" /> BERTH CONGESTION MULTIPLIER
            </span>
            <span className="text-[#2DD4E8] font-bold">{congestionFactor.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={congestionFactor}
            onChange={(e) => setCongestionFactor(Number(e.target.value))}
            className="w-full accent-[#2DD4E8]"
          />
          <p className="text-[10px] text-gray-400">Simulates weather monsoon delays & queue demurrage.</p>
        </div>

        {/* Re-optimize Button */}
        <button
          onClick={handleApply}
          className="w-full py-3 rounded-xl font-bold bg-[#2DD4E8] text-[#0A0E17] hover:brightness-110 shadow-[0_0_20px_rgba(45,212,232,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>RE-RUN OPTIMIZER WITH SCENARIO</span>
        </button>
      </div>
    </div>
  );
};
