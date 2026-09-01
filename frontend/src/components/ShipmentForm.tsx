import React, { useState } from 'react';
import { COMMODITIES, PORTS } from '../data/mockData';
import type { Commodity, Port } from '../data/mockData';
import { Sparkles, Calendar, Scale, DollarSign, ChevronRight, X, Layers, Ship, MapPin } from 'lucide-react';

interface ShipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ShipmentFormData) => void;
}

export interface ShipmentFormData {
  commodity: Commodity;
  quantityMT: number;
  originPort?: Port;
  destinationPort: Port;
  deliveryWindowDays: number;
  riskTolerance: 'Conservative' | 'Balanced' | 'Aggressive';
  budgetCapUSD?: number;
}

export const ShipmentForm: React.FC<ShipmentFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('iron-ore');
  const [quantityMT, setQuantityMT] = useState<number>(75000);
  const [selectedOriginId, setSelectedOriginId] = useState<string>('any');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('paradip');
  const [deliveryWindowDays, setDeliveryWindowDays] = useState<number>(30);
  const [riskTolerance, setRiskTolerance] = useState<'Conservative' | 'Balanced' | 'Aggressive'>('Balanced');
  const [budgetCap, setBudgetCap] = useState<string>('9500000');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commodity = COMMODITIES.find(c => c.id === selectedCommodityId) || COMMODITIES[0];
    const originPort = PORTS.find(p => p.id === selectedOriginId);
    const destinationPort = PORTS.find(p => p.id === selectedDestinationId) || PORTS.find(p => p.id === 'paradip')!;

    onSubmit({
      commodity,
      quantityMT,
      originPort,
      destinationPort,
      deliveryWindowDays,
      riskTolerance,
      budgetCapUSD: budgetCap ? parseFloat(budgetCap) : undefined
    });
  };

  return (
    <div className="fixed inset-y-0 left-0 z-30 w-full max-w-md p-4 pt-16 flex flex-col justify-center pointer-events-none">
      <div className="pointer-events-auto brutalist-panel p-6 overflow-y-auto max-h-[calc(100vh-5rem)] no-scrollbar brutalist-data">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center border border-[#ff2a2a] bg-[#ff2a2a]/10">
              <Sparkles className="w-4 h-4 animate-spin-slow text-[#ff2a2a]" />
            </div>
            <div>
              <h2 className="brutalist-heading text-[#ff2a2a] hover-glitch">
                NEW SHIPMENT REQUEST
              </h2>
              <p className="text-[10px] text-[#999]">
                Configure procurement & charter parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#ff2a2a] p-1 border border-transparent hover:border-[#ff2a2a] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono brutalist-data">
          {/* Commodity / Material Select */}
          <div>
            <label className="block text-[#e5e5e5] font-bold mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#ff2a2a]" /> MATERIAL / COMMODITY
            </label>
            <select
              value={selectedCommodityId}
              onChange={(e) => setSelectedCommodityId(e.target.value)}
              className="w-full bg-[#111] border border-[#333] p-2.5 text-white focus:outline-none focus:border-[#ff2a2a]"
            >
              {COMMODITIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (FOB ~${item.fobPricePerMTUSD}/MT)
                </option>
              ))}
            </select>
          </div>

          {/* Quantity MT */}
          <div>
            <label className="block text-[#e5e5e5] font-bold mb-1.5 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#ff2a2a]" /> QUANTITY (METRIC TONS)
            </label>
            <div className="relative">
              <input
                type="number"
                value={quantityMT}
                onChange={(e) => setQuantityMT(Number(e.target.value))}
                step={5000}
                min={10000}
                className="w-full bg-[#111] border border-[#333] p-2.5 text-white focus:outline-none focus:border-[#ff2a2a]"
              />
              <span className="absolute right-3 top-2.5 text-[#666] font-bold">MT</span>
            </div>
            <div className="flex gap-2 mt-1.5">
              {[50000, 75000, 150000].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setQuantityMT(val)}
                  className={`px-2 py-1 text-[10px] border transition-colors cursor-pointer hover-glitch ${quantityMT === val ? 'bg-[#ff2a2a]/20 border-[#ff2a2a] text-[#ff2a2a]' : 'bg-[#111] border-[#333] text-[#999]'}`}
                >
                  {val.toLocaleString()} MT
                </button>
              ))}
            </div>
          </div>

          {/* Origin Port */}
          <div>
            <label className="block text-[#e5e5e5] font-bold mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#ff2a2a]" /> ORIGIN PORT (OPTIONAL)
            </label>
            <select
              value={selectedOriginId}
              onChange={(e) => setSelectedOriginId(e.target.value)}
              className="w-full bg-[#111] border border-[#333] p-2.5 text-white focus:outline-none focus:border-[#ff2a2a]"
            >
              <option value="any">AI Optimized (Let System Decide)</option>
              {PORTS.filter(p => p.type === 'origin' || p.type === 'both').map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} - Max Draft: {port.maxDraft}m ({port.country})
                </option>
              ))}
            </select>
          </div>

          {/* Destination Port */}
          <div>
            <label className="block text-[#e5e5e5] font-bold mb-1.5 flex items-center gap-1.5">
              <Ship className="w-3.5 h-3.5 text-[#ff2a2a]" /> DESTINATION PORT
            </label>
            <select
              value={selectedDestinationId}
              onChange={(e) => setSelectedDestinationId(e.target.value)}
              className="w-full bg-[#111] border border-[#333] p-2.5 text-white focus:outline-none focus:border-[#ff2a2a]"
            >
              {PORTS.filter(p => p.type === 'destination' || p.type === 'both').map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} - Max Draft: {port.maxDraft}m ({port.country})
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Window */}
          <div>
            <label className="block text-[#e5e5e5] font-bold mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#ff2a2a]" /> REQUIRED DELIVERY WINDOW
            </label>
            <div className="flex items-center gap-2 bg-[#111] p-2 border border-[#333]">
              <input
                type="range"
                min={15}
                max={90}
                step={5}
                value={deliveryWindowDays}
                onChange={(e) => setDeliveryWindowDays(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-[#ff2a2a] font-bold w-20 text-right">{deliveryWindowDays} Days</span>
            </div>
          </div>

          {/* Risk Tolerance Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[#e5e5e5] font-bold">RISK TOLERANCE</label>
              <span className={`text-[10px] px-2 py-0.5 border font-bold ${
                riskTolerance === 'Conservative' ? 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]' :
                riskTolerance === 'Balanced' ? 'bg-[#e5e5e5]/10 text-[#e5e5e5] border-[#e5e5e5]' : 'bg-[#ff2a2a]/10 text-[#ff2a2a] border-[#ff2a2a]'
              }`}>
                {riskTolerance}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['Conservative', 'Balanced', 'Aggressive'] as const).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setRiskTolerance(level)}
                  className={`py-2 border text-[11px] font-semibold transition-all cursor-pointer hover-glitch ${
                    riskTolerance === level
                      ? 'bg-[#ff2a2a]/20 border-[#ff2a2a] text-[#ff2a2a]'
                      : 'bg-[#111] border-[#333] text-[#999] hover:border-[#ff2a2a]/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Budget Cap */}
          <div>
            <label className="block text-[#e5e5e5] font-bold mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#ff2a2a]" /> BUDGET CAP (OPTIONAL USD)
            </label>
            <input
              type="text"
              value={budgetCap}
              onChange={(e) => setBudgetCap(e.target.value)}
              placeholder="e.g. 9,500,000 USD"
              className="w-full bg-[#111] border border-[#333] p-2.5 text-white focus:outline-none focus:border-[#ff2a2a]"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full mt-4 py-3.5 px-4 font-bold brutalist-heading bg-[#ff2a2a] text-white hover-glitch flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            style={{ boxShadow: '4px 4px 0 rgba(255,255,255,0.1)' }}
          >
            <span>FIND OPTIMAL PLAN</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
