import React from 'react';
import type { RoutePlan } from '../data/mockData';
import { ShieldAlert, AlertTriangle, Wind, Anchor, Globe, Clock } from 'lucide-react';

interface RiskAnalysisPanelProps {
  plan: RoutePlan;
  isOpen: boolean;
  onClose: () => void;
}

export const RiskAnalysisPanel: React.FC<RiskAnalysisPanelProps> = ({
  plan,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const gauges = [
    { label: 'GEOPOLITICAL RISK', val: plan.riskScores.geopolitical, icon: Globe },
    { label: 'WEATHER / MONSOON', val: plan.riskScores.weather, icon: Wind },
    { label: 'PORT CONGESTION', val: plan.riskScores.congestion, icon: Anchor },
    { label: 'DELAY PROBABILITY', val: plan.riskScores.delayProbability, icon: Clock }
  ];

  const getColor = (val: number) => {
    if (val < 0.25) return { text: 'text-emerald-400', bg: 'bg-emerald-500', stroke: '#4ADE80' };
    if (val < 0.45) return { text: 'text-amber-400', bg: 'bg-amber-500', stroke: '#FBBF24' };
    return { text: 'text-rose-400', bg: 'bg-rose-500', stroke: '#F87171' };
  };

  return (
    <div className="fixed top-16 left-6 z-30 w-full max-w-sm pointer-events-none">
      <div
        className="pointer-events-auto rounded-2xl p-4 text-white font-sans space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(2,18,30,0.94) 0%, rgba(4,30,48,0.90) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(45,212,232,0.20)',
          boxShadow: '0 0 40px rgba(45,212,232,0.10), 0 12px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 font-mono">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#2DD4E8]" />
            <h3 className="font-bold text-xs text-[#2DD4E8] tracking-wider">
              RISK & EXPLAINABILITY MONITOR
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs cursor-pointer">✕</button>
        </div>

        {/* 4 Radial Gauges */}
        <div className="grid grid-cols-2 gap-2.5 font-mono">
          {gauges.map((g, idx) => {
            const color = getColor(g.val);
            const Icon = g.icon;
            const percentage = Math.round(g.val * 100);

            return (
              <div key={idx} className="bg-[#0D1220] p-2.5 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                <div className="relative w-14 h-14 flex items-center justify-center my-1">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="transition-all duration-1000 ease-out"
                      strokeWidth="3.5"
                      strokeDasharray={`${percentage}, 100`}
                      stroke={color.stroke}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xs font-bold ${color.text}`}>{percentage}%</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 font-semibold">
                  <Icon className="w-3 h-3 text-[#2DD4E8]" /> {g.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Risk Signals Live Feed */}
        <div className="bg-[#0D1220]/80 p-3 rounded-xl border border-white/10 font-mono text-[11px] space-y-2">
          <p className="text-gray-400 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> ACTIVE ROUTE INTELLIGENCE SIGNALS
          </p>
          <div className="space-y-1.5 text-gray-300 text-[10px] leading-relaxed">
            {plan.riskSignals.map((signal, idx) => (
              <div key={idx} className="p-1.5 rounded bg-white/5 border border-white/5">
                {signal}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
