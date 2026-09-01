import React, { useState, useEffect } from 'react';
import { TICKER_DATA } from '../data/mockData';
import { Anchor, Activity, Clock } from 'lucide-react';

interface HeaderTickerProps {
  backendOnline?: boolean | null;
}

export const HeaderTicker: React.FC<HeaderTickerProps> = ({ backendOnline }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 brutalist-data text-white text-xs border-b border-[#333] bg-[#0a0a0a]"
    >
      <div className="flex items-center justify-between px-4 h-12">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-[#ff2a2a] bg-[#ff2a2a]/10">
            <Anchor className="w-4 h-4 hover-glitch text-[#ff2a2a]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-widest text-sm hover-glitch text-white uppercase">
                Freight<span className="text-[#ff2a2a]">IQ</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 border border-[#333] text-[#e5e5e5]">
                SAIL OPS // v3.4
              </span>
            </div>
          </div>
        </div>

        {/* Live Ticker */}
        <div className="hidden lg:flex items-center flex-1 mx-8 overflow-hidden py-1.5 px-3 border border-[#333]">
          <div className="flex items-center gap-1 mr-3 font-semibold text-[11px] shrink-0 text-[#ff2a2a] z-10 bg-[#0A0E17]/90 pr-2">
            <Activity className="w-3.5 h-3.5" /> LIVE TELEMETRY:
          </div>
          <div className="flex-1 overflow-hidden relative h-full">
            <div className="flex w-max items-center gap-6 animate-marquee whitespace-nowrap no-scrollbar text-[11px] absolute left-0">
              {/* Duplicate for seamless loop */}
              {[...TICKER_DATA, ...TICKER_DATA].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[#999]">{item.label}:</span>
                  <span className="font-bold text-white hover-glitch">{item.value}</span>
                  <span className={`text-[10px] px-1 ${item.isUp ? 'text-[#4ADE80]' : 'text-[#ff2a2a]'}`}>
                    {item.change}
                  </span>
                  <span className="text-[#333] mx-2">|</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status + Clock */}
        <div className="flex items-center gap-4">
          <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 text-[11px] border ${
            backendOnline === true
              ? 'border-[#4ADE80] text-[#4ADE80]'
              : backendOnline === false
              ? 'border-[#EAB308] text-[#EAB308]'
              : 'border-[#666] text-[#999]'
          }`}>
            <span className={`w-2 h-2 ${
              backendOnline === true
                ? 'bg-[#4ADE80] animate-pulse'
                : backendOnline === false
                ? 'bg-[#EAB308]'
                : 'bg-[#666]'
            }`} />
            <span>
              {backendOnline === true ? 'FASTAPI BACKEND: CONNECTED' : backendOnline === false ? 'FASTAPI: OFFLINE (MOCK)' : 'CONNECTING...'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#999]">
            <Clock className="w-3.5 h-3.5 text-[#ff2a2a]" />
            <span>{time || 'UTC 00:00:00'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
