export interface Port {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  maxDraft: number; // meters
  handlingCap: string;
  congestionAvgDays: number;
  type: 'origin' | 'destination' | 'both';
  region: string;
  quayLength: string;
  dischargeRate: string; // MT/day
}

export interface VesselClass {
  id: string;
  name: string;
  capacityDWT: number; // Deadweight Tonnage
  maxDraft: number; // meters
  dailyCharterRateUSD: number;
  fuelConsumptionMTPerDay: number;
  speedKnots: number;
  description: string;
}

export interface Commodity {
  id: string;
  name: string;
  fobPricePerMTUSD: number;
  unit: string;
  typicalParcelSizeMT: number;
  allowedVessels: string[];
}

export interface RiskBreakdown {
  geopolitical: number; // 0 - 1
  weather: number; // 0 - 1
  congestion: number; // 0 - 1
  delayProbability: number; // 0 - 1
}

export interface RoutePlan {
  id: string;
  rank: number;
  isRecommended: boolean;
  originPort: Port;
  destinationPort: Port;
  commodityId: string;
  quantityMT: number;
  vesselClass: VesselClass;
  charterTimingWindow: string; // e.g. "Fix within 3 - 5 days"
  optimalCharterDate: string;
  transitDays: number;
  distanceNauticalMiles: number;
  
  // Cost breakdown ($/MT)
  materialFobPriceUSD: number;
  freightCostUSDPerMT: number;
  vesselCharterCostUSDPerMT: number;
  bunkeringFuelCostUSDPerMT: number;
  portTariffsUSDPerMT: number;
  insuranceRiskUSDPerMT: number;
  totalLandedCostUSDPerMT: number;
  totalShipmentCostUSD: number;

  onTimeReliabilityPct: number;
  overallRiskLevel: 'Low' | 'Medium' | 'High';
  riskScores: RiskBreakdown;
  
  whyThisPlan: string[];
  riskSignals: string[];
  waypoints: { lat: number; lng: number; name?: string }[];
}

export const PORTS: Port[] = [
  // ── ORIGINS (Iron Ore / Coal Export Terminals) ──────────────────────────
  {
    id: 'port-hedland', name: 'Port Hedland', country: 'Australia',
    lat: -20.31, lng: 118.57, maxDraft: 20.0, handlingCap: '550M MT/yr',
    congestionAvgDays: 2.1, type: 'origin', region: 'Western Australia',
    quayLength: '2,400m', dischargeRate: '120,000 MT/day'
  },
  {
    id: 'dampier', name: 'Dampier Terminal', country: 'Australia',
    lat: -20.66, lng: 116.71, maxDraft: 18.8, handlingCap: '180M MT/yr',
    congestionAvgDays: 1.6, type: 'origin', region: 'Western Australia',
    quayLength: '1,600m', dischargeRate: '95,000 MT/day'
  },
  {
    id: 'gladstone', name: 'Gladstone', country: 'Australia',
    lat: -23.84, lng: 151.25, maxDraft: 17.5, handlingCap: '70M MT/yr',
    congestionAvgDays: 2.5, type: 'origin', region: 'Queensland',
    quayLength: '1,200m', dischargeRate: '65,000 MT/day'
  },
  {
    id: 'newcastle-au', name: 'Newcastle (AU)', country: 'Australia',
    lat: -32.92, lng: 151.78, maxDraft: 16.4, handlingCap: '165M MT/yr',
    congestionAvgDays: 3.1, type: 'origin', region: 'New South Wales',
    quayLength: '1,900m', dischargeRate: '80,000 MT/day'
  },
  {
    id: 'saldanha-bay', name: 'Saldanha Bay', country: 'South Africa',
    lat: -33.02, lng: 17.96, maxDraft: 21.5, handlingCap: '60M MT/yr',
    congestionAvgDays: 1.8, type: 'origin', region: 'Western Cape',
    quayLength: '1,150m', dischargeRate: '80,000 MT/day'
  },
  {
    id: 'richards-bay', name: 'Richards Bay', country: 'South Africa',
    lat: -28.80, lng: 32.04, maxDraft: 17.5, handlingCap: '90M MT/yr',
    congestionAvgDays: 2.2, type: 'origin', region: 'KwaZulu-Natal',
    quayLength: '2,200m', dischargeRate: '75,000 MT/day'
  },
  {
    id: 'maputo', name: 'Port of Maputo', country: 'Mozambique',
    lat: -25.96, lng: 32.58, maxDraft: 14.5, handlingCap: '25M MT/yr',
    congestionAvgDays: 1.5, type: 'origin', region: 'Southern Africa',
    quayLength: '850m', dischargeRate: '40,000 MT/day'
  },
  {
    id: 'tubarao', name: 'Tubarão (CVRD)', country: 'Brazil',
    lat: -20.28, lng: -40.24, maxDraft: 23.0, handlingCap: '100M MT/yr',
    congestionAvgDays: 3.4, type: 'origin', region: 'Espírito Santo',
    quayLength: '1,600m', dischargeRate: '100,000 MT/day'
  },
  {
    id: 'ponta-madeira', name: 'Ponta da Madeira', country: 'Brazil',
    lat: -2.58, lng: -44.35, maxDraft: 23.0, handlingCap: '220M MT/yr',
    congestionAvgDays: 2.8, type: 'origin', region: 'Maranhão',
    quayLength: '2,100m', dischargeRate: '120,000 MT/day'
  },
  {
    id: 'puerto-bolivar', name: 'Puerto Bolívar', country: 'Colombia',
    lat: 11.83, lng: -72.36, maxDraft: 17.0, handlingCap: '60M MT/yr',
    congestionAvgDays: 1.9, type: 'origin', region: 'La Guajira',
    quayLength: '1,000m', dischargeRate: '55,000 MT/day'
  },
  {
    id: 'baltimore', name: 'Port of Baltimore', country: 'United States',
    lat: 39.27, lng: -76.58, maxDraft: 15.2, handlingCap: '40M MT/yr',
    congestionAvgDays: 2.8, type: 'origin', region: 'Mid-Atlantic',
    quayLength: '1,100m', dischargeRate: '50,000 MT/day'
  },
  {
    id: 'walvis-bay', name: 'Walvis Bay', country: 'Namibia',
    lat: -22.96, lng: 14.50, maxDraft: 14.0, handlingCap: '15M MT/yr',
    congestionAvgDays: 1.2, type: 'origin', region: 'Erongo',
    quayLength: '700m', dischargeRate: '30,000 MT/day'
  },

  // ── DESTINATIONS (Indian Steel Plant Berths + Global Receivers) ─────────
  {
    id: 'paradip', name: 'Paradip (SAIL)', country: 'India',
    lat: 20.26, lng: 86.67, maxDraft: 16.0, handlingCap: '125M MT/yr',
    congestionAvgDays: 2.9, type: 'destination', region: 'Odisha',
    quayLength: '1,800m', dischargeRate: '45,000 MT/day'
  },
  {
    id: 'visakhapatnam', name: 'Visakhapatnam (Vizag)', country: 'India',
    lat: 17.68, lng: 83.21, maxDraft: 16.5, handlingCap: '80M MT/yr',
    congestionAvgDays: 2.4, type: 'destination', region: 'Andhra Pradesh',
    quayLength: '1,500m', dischargeRate: '50,000 MT/day'
  },
  {
    id: 'haldia', name: 'Haldia Dock Complex', country: 'India',
    lat: 22.02, lng: 88.06, maxDraft: 12.5, handlingCap: '45M MT/yr',
    congestionAvgDays: 4.1, type: 'destination', region: 'West Bengal',
    quayLength: '900m', dischargeRate: '25,000 MT/day'
  },
  {
    id: 'ennore', name: 'Kamarajar (Ennore)', country: 'India',
    lat: 13.21, lng: 80.32, maxDraft: 18.0, handlingCap: '65M MT/yr',
    congestionAvgDays: 1.8, type: 'destination', region: 'Tamil Nadu',
    quayLength: '1,400m', dischargeRate: '55,000 MT/day'
  },
  {
    id: 'kandla', name: 'Deendayal (Kandla)', country: 'India',
    lat: 23.00, lng: 70.21, maxDraft: 14.5, handlingCap: '90M MT/yr',
    congestionAvgDays: 2.6, type: 'destination', region: 'Gujarat',
    quayLength: '1,300m', dischargeRate: '40,000 MT/day'
  },
  {
    id: 'mumbai', name: 'Jawaharlal Nehru Port', country: 'India',
    lat: 18.95, lng: 72.95, maxDraft: 15.0, handlingCap: '100M MT/yr',
    congestionAvgDays: 3.2, type: 'destination', region: 'Maharashtra',
    quayLength: '2,000m', dischargeRate: '48,000 MT/day'
  },
  {
    id: 'qingdao', name: 'Qingdao Iron Ore Hub', country: 'China',
    lat: 36.06, lng: 120.38, maxDraft: 20.0, handlingCap: '600M MT/yr',
    congestionAvgDays: 3.2, type: 'destination', region: 'Shandong',
    quayLength: '3,200m', dischargeRate: '110,000 MT/day'
  },
  {
    id: 'shanghai', name: 'Shanghai (Yangshan)', country: 'China',
    lat: 30.62, lng: 122.06, maxDraft: 20.5, handlingCap: '750M MT/yr',
    congestionAvgDays: 2.8, type: 'destination', region: 'East China',
    quayLength: '4,200m', dischargeRate: '130,000 MT/day'
  },
  {
    id: 'rotterdam', name: 'Port of Rotterdam', country: 'Netherlands',
    lat: 51.95, lng: 4.14, maxDraft: 24.0, handlingCap: '470M MT/yr',
    congestionAvgDays: 1.2, type: 'destination', region: 'Rhine-Maas Delta',
    quayLength: '4,000m', dischargeRate: '130,000 MT/day'
  },
  {
    id: 'singapore', name: 'Port of Singapore', country: 'Singapore',
    lat: 1.26, lng: 103.82, maxDraft: 20.0, handlingCap: '650M MT/yr',
    congestionAvgDays: 1.4, type: 'both', region: 'Singapore Strait',
    quayLength: '5,000m', dischargeRate: '120,000 MT/day'
  },
  {
    id: 'karachi', name: 'Karachi Port Trust', country: 'Pakistan',
    lat: 24.82, lng: 66.98, maxDraft: 14.5, handlingCap: '50M MT/yr',
    congestionAvgDays: 3.5, type: 'destination', region: 'Sindh',
    quayLength: '1,050m', dischargeRate: '35,000 MT/day'
  },
];

export const VESSELS: VesselClass[] = [
  {
    id: 'capesize', name: 'Capesize', capacityDWT: 180000, maxDraft: 18.5,
    dailyCharterRateUSD: 22500, fuelConsumptionMTPerDay: 42, speedKnots: 13.5,
    description: 'Ultra-large bulk carrier best for high-volume iron ore & coal routes with deepwater berths (>18m).'
  },
  {
    id: 'panamax', name: 'Panamax', capacityDWT: 75000, maxDraft: 14.2,
    dailyCharterRateUSD: 15800, fuelConsumptionMTPerDay: 28, speedKnots: 13.8,
    description: 'Mid-sized standard carrier suited for Panamax canal locks and major East Coast India berths.'
  },
  {
    id: 'supramax', name: 'Supramax', capacityDWT: 58000, maxDraft: 12.8,
    dailyCharterRateUSD: 13200, fuelConsumptionMTPerDay: 22, speedKnots: 14.0,
    description: 'Versatile bulk vessel equipped with self-unloading cranes; ideal for shallow ports like Haldia.'
  },
  {
    id: 'handysize', name: 'Handysize', capacityDWT: 35000, maxDraft: 10.5,
    dailyCharterRateUSD: 11600, fuelConsumptionMTPerDay: 16, speedKnots: 13.0,
    description: 'Flexible small carrier capable of accessing restricted regional ports and riverways.'
  },
  {
    id: 'vloc', name: 'VLOC (Vale)', capacityDWT: 400000, maxDraft: 23.0,
    dailyCharterRateUSD: 38000, fuelConsumptionMTPerDay: 72, speedKnots: 14.5,
    description: 'Very Large Ore Carrier — dedicated Brazil–China iron ore route. Restricted to deepwater Capesize berths.'
  }
];

export const COMMODITIES: Commodity[] = [
  {
    id: 'iron-ore', name: 'Iron Ore (Fines 62% Fe)', fobPricePerMTUSD: 102.50,
    unit: 'MT', typicalParcelSizeMT: 150000, allowedVessels: ['capesize', 'panamax', 'vloc']
  },
  {
    id: 'coking-coal', name: 'Coking Coal (Hard Coking)', fobPricePerMTUSD: 245.00,
    unit: 'MT', typicalParcelSizeMT: 75000, allowedVessels: ['capesize', 'panamax', 'supramax']
  },
  {
    id: 'thermal-coal', name: 'Thermal Coal (5500 GAR)', fobPricePerMTUSD: 135.00,
    unit: 'MT', typicalParcelSizeMT: 60000, allowedVessels: ['panamax', 'supramax']
  },
  {
    id: 'bauxite', name: 'Bauxite (Metallurgical)', fobPricePerMTUSD: 48.00,
    unit: 'MT', typicalParcelSizeMT: 50000, allowedVessels: ['panamax', 'supramax', 'handysize']
  },
  {
    id: 'pellets', name: 'Iron Ore Pellets (DR Grade)', fobPricePerMTUSD: 145.00,
    unit: 'MT', typicalParcelSizeMT: 60000, allowedVessels: ['panamax', 'supramax']
  }
];

export const TICKER_DATA = [
  { label: 'Baltic Dry Index (BDI)', value: '1,842', change: '+2.1%', isUp: true },
  { label: 'Capesize Index (BCI)', value: '2,910', change: '+3.4%', isUp: true },
  { label: 'Panamax Index (BPI)', value: '1,520', change: '-0.8%', isUp: false },
  { label: 'Supramax Index (BSI)', value: '1,285', change: '+0.4%', isUp: true },
  { label: 'VLSFO Bunker (Singapore)', value: '$612/MT', change: '-1.2%', isUp: false },
  { label: 'VLSFO Bunker (Rotterdam)', value: '$598/MT', change: '-0.9%', isUp: false },
  { label: 'IFO380 (Fujairah)', value: '$445/MT', change: '+0.6%', isUp: true },
  { label: 'Iron Ore 62% Fe (Platts)', value: '$102.50/MT', change: '+0.8%', isUp: true },
  { label: 'East Coast India Congestion', value: '2.6 Days', change: 'Stable', isUp: true },
  { label: 'Paradip Queue (Anchorage)', value: '4 Vessels', change: '+1', isUp: false },
  { label: 'Active Risk Alerts', value: '3 Active', change: 'Monitored', isUp: false },
  { label: 'Routes Evaluated Today', value: '212 Runs', change: '+18%', isUp: true },
  { label: 'USD/INR FX Rate', value: '83.74', change: '-0.12%', isUp: true },
  { label: 'Suez Canal Slot Availability', value: 'Open', change: '96% Util', isUp: true },
];

export const MOCK_RECOMMENDED_PLANS: Record<string, RoutePlan[]> = {
  default: [
    {
      id: 'plan-1', rank: 1, isRecommended: true,
      originPort: PORTS.find(p => p.id === 'port-hedland')!,
      destinationPort: PORTS.find(p => p.id === 'paradip')!,
      commodityId: 'iron-ore', quantityMT: 75000,
      vesselClass: VESSELS.find(v => v.id === 'capesize')!,
      charterTimingWindow: 'Fix within 4–6 days', optimalCharterDate: '2026-08-29',
      transitDays: 14.5, distanceNauticalMiles: 3840,
      materialFobPriceUSD: 94.20, freightCostUSDPerMT: 11.20,
      vesselCharterCostUSDPerMT: 4.80, bunkeringFuelCostUSDPerMT: 3.50,
      portTariffsUSDPerMT: 1.60, insuranceRiskUSDPerMT: 0.90,
      totalLandedCostUSDPerMT: 108.20, totalShipmentCostUSD: 8115000,
      onTimeReliabilityPct: 94, overallRiskLevel: 'Low',
      riskScores: { geopolitical: 0.12, weather: 0.18, congestion: 0.22, delayProbability: 0.14 },
      whyThisPlan: [
        'Lowest total landed cost ($108.20/MT) among all evaluated origin-destination routes',
        'Capesize draft (18.2m) compatible with tidal window at Paradip deepwater berth #2',
        'Freight forward curve indicates 4.5% dip over next 5 days before September peak',
        'Geopolitical risk score 0.12 (Low): Bypasses all high-risk choke points',
        'Port Hedland confirmed availability — berth slot reserved for Aug 29 loading'
      ],
      riskSignals: [
        '✓ Zero sanctions flags detected along Australia → Bay of Bengal corridor',
        '✓ Weather forecast shows clear sailing through Sunda Strait for next 12 days',
        '⚠ Moderate berth queue at Paradip berth #2 (2.4 days average waiting time)'
      ],
      waypoints: [
        { lat: -20.31, lng: 118.57, name: 'Port Hedland (Origin)' },
        { lat: -10.50, lng: 105.40, name: 'Sunda Strait Entrance' },
        { lat: 5.80, lng: 95.30, name: 'Andaman Sea Channel' },
        { lat: 20.26, lng: 86.67, name: 'Paradip (Destination)' }
      ]
    },
    {
      id: 'plan-2', rank: 2, isRecommended: false,
      originPort: PORTS.find(p => p.id === 'gladstone')!,
      destinationPort: PORTS.find(p => p.id === 'paradip')!,
      commodityId: 'iron-ore', quantityMT: 75000,
      vesselClass: VESSELS.find(v => v.id === 'panamax')!,
      charterTimingWindow: 'Fix immediately (Within 24h)', optimalCharterDate: '2026-08-25',
      transitDays: 16.2, distanceNauticalMiles: 4210,
      materialFobPriceUSD: 96.00, freightCostUSDPerMT: 13.80,
      vesselCharterCostUSDPerMT: 5.40, bunkeringFuelCostUSDPerMT: 4.10,
      portTariffsUSDPerMT: 1.50, insuranceRiskUSDPerMT: 1.10,
      totalLandedCostUSDPerMT: 113.70, totalShipmentCostUSD: 8527500,
      onTimeReliabilityPct: 88, overallRiskLevel: 'Medium',
      riskScores: { geopolitical: 0.15, weather: 0.35, congestion: 0.28, delayProbability: 0.26 },
      whyThisPlan: [
        'Backup option if Port Hedland berth encounters unannounced maintenance window',
        'Panamax class allows multi-port discharge split: Paradip + Visakhapatnam',
        'Higher FOB price ($96.00/MT) but immediate charter availability compensates'
      ],
      riskSignals: [
        '⚠ Seasonal swell advisory near Torres Strait passage (delay risk +1.2 days)',
        '✓ Gladstone terminal availability confirmed — immediate loading slot open'
      ],
      waypoints: [
        { lat: -23.84, lng: 151.25, name: 'Gladstone (Origin)' },
        { lat: -10.20, lng: 142.10, name: 'Torres Strait' },
        { lat: 6.00, lng: 95.00, name: 'Aceh Channel' },
        { lat: 20.26, lng: 86.67, name: 'Paradip (Destination)' }
      ]
    },
    {
      id: 'plan-3', rank: 3, isRecommended: false,
      originPort: PORTS.find(p => p.id === 'saldanha-bay')!,
      destinationPort: PORTS.find(p => p.id === 'paradip')!,
      commodityId: 'iron-ore', quantityMT: 75000,
      vesselClass: VESSELS.find(v => v.id === 'capesize')!,
      charterTimingWindow: 'Fix in 8–10 days', optimalCharterDate: '2026-09-02',
      transitDays: 21.0, distanceNauticalMiles: 5720,
      materialFobPriceUSD: 91.50, freightCostUSDPerMT: 18.40,
      vesselCharterCostUSDPerMT: 6.80, bunkeringFuelCostUSDPerMT: 5.60,
      portTariffsUSDPerMT: 1.70, insuranceRiskUSDPerMT: 1.40,
      totalLandedCostUSDPerMT: 119.80, totalShipmentCostUSD: 8985000,
      onTimeReliabilityPct: 82, overallRiskLevel: 'Medium',
      riskScores: { geopolitical: 0.28, weather: 0.42, congestion: 0.24, delayProbability: 0.38 },
      whyThisPlan: [
        'Cheapest FOB price ($91.50/MT) but 21-day transit elevates bunker cost significantly',
        'Capesize economies of scale constrained by long-haul freight rate volatility',
        'Strategic diversification from Australian ore dependency — Africa supply hedge'
      ],
      riskSignals: [
        '⚠ Winter storm system south of Madagascar — 2-day weather detour risk',
        '✓ Saldanha Bay deepwater terminal guarantees zero draft constraints for Capesize'
      ],
      waypoints: [
        { lat: -33.02, lng: 17.96, name: 'Saldanha Bay (Origin)' },
        { lat: -25.00, lng: 45.00, name: 'South Madagascar Passage' },
        { lat: 5.00, lng: 80.00, name: 'Southern Sri Lanka Transit' },
        { lat: 20.26, lng: 86.67, name: 'Paradip (Destination)' }
      ]
    }
  ]
};

// ── AMBIENT ROUTES — global shipping lanes overlaid on idle globe ─────────────
export const AMBIENT_ROUTES = [
  // ── Australia → Asia
  { startLat: -20.31, startLng: 118.57, endLat: 36.06,  endLng: 120.38, color: 'rgba(45,212,232,0.55)',  label: 'Port Hedland → Qingdao (Iron Ore)' },
  { startLat: -20.66, startLng: 116.71, endLat: 30.62,  endLng: 122.06, color: 'rgba(45,212,232,0.40)',  label: 'Dampier → Shanghai' },
  { startLat: -23.84, startLng: 151.25, endLat: 36.06,  endLng: 120.38, color: 'rgba(56,189,248,0.45)',  label: 'Gladstone → Qingdao (Coal)' },
  { startLat: -32.92, startLng: 151.78, endLat: 36.06,  endLng: 120.38, color: 'rgba(56,189,248,0.35)',  label: 'Newcastle → Qingdao (Thermal Coal)' },
  { startLat: -20.31, startLng: 118.57, endLat: 1.26,   endLng: 103.82, color: 'rgba(45,212,232,0.28)',  label: 'Port Hedland → Singapore' },

  // ── Australia → India
  { startLat: -20.31, startLng: 118.57, endLat: 20.26,  endLng: 86.67,  color: 'rgba(74,222,128,0.50)',  label: 'Port Hedland → Paradip ★ OPTIMAL' },
  { startLat: -23.84, startLng: 151.25, endLat: 17.68,  endLng: 83.21,  color: 'rgba(251,191,36,0.38)',  label: 'Gladstone → Visakhapatnam' },
  { startLat: -20.66, startLng: 116.71, endLat: 18.95,  endLng: 72.95,  color: 'rgba(56,189,248,0.30)',  label: 'Dampier → JNPT Mumbai' },

  // ── Africa → Europe / Asia
  { startLat: -33.02, startLng: 17.96,  endLat: 51.95,  endLng: 4.14,   color: 'rgba(129,140,248,0.50)',  label: 'Saldanha Bay → Rotterdam' },
  { startLat: -28.80, startLng: 32.04,  endLat: 20.26,  endLng: 86.67,  color: 'rgba(74,222,128,0.40)',   label: 'Richards Bay → Paradip' },
  { startLat: -33.02, startLng: 17.96,  endLat: 36.06,  endLng: 120.38, color: 'rgba(251,191,36,0.32)',   label: 'Saldanha Bay → Qingdao' },
  { startLat: -22.96, startLng: 14.50,  endLat: 20.26,  endLng: 86.67,  color: 'rgba(129,140,248,0.28)',  label: 'Walvis Bay → Paradip' },

  // ── Brazil → Asia (Trans-Atlantic + Indian Ocean)
  { startLat: -20.28, startLng: -40.24, endLat: 36.06,  endLng: 120.38, color: 'rgba(248,113,113,0.40)',  label: 'Tubarão → Qingdao (VLOC)' },
  { startLat: -2.58,  startLng: -44.35, endLat: 36.06,  endLng: 120.38, color: 'rgba(248,113,113,0.35)',  label: 'Ponta da Madeira → Qingdao' },
  { startLat: -20.28, startLng: -40.24, endLat: 51.95,  endLng: 4.14,   color: 'rgba(248,113,113,0.30)',  label: 'Tubarão → Rotterdam' },

  // ── Trans-Pacific
  { startLat: -20.31, startLng: 118.57, endLat: 37.80,  endLng: -122.30, color: 'rgba(167,139,250,0.30)', label: 'Port Hedland → Oakland (Bauxite)' },

  // ── Middle East / South Asia connectors
  { startLat: 1.26,   startLng: 103.82, endLat: 20.26,  endLng: 86.67,  color: 'rgba(45,212,232,0.22)',  label: 'Singapore → Paradip' },
  { startLat: 1.26,   startLng: 103.82, endLat: 18.95,  endLng: 72.95,  color: 'rgba(56,189,248,0.20)',  label: 'Singapore → Mumbai' },
  { startLat: 24.82,  startLng: 66.98,  endLat: 20.26,  endLng: 86.67,  color: 'rgba(251,191,36,0.22)',  label: 'Karachi → Paradip (coastal)' },

  // ── Europe connectors
  { startLat: 51.95,  startLng: 4.14,   endLat: 36.06,  endLng: 120.38, color: 'rgba(129,140,248,0.22)', label: 'Rotterdam → Qingdao (finished steel)' },
  { startLat: 39.27,  startLng: -76.58, endLat: 51.95,  endLng: 4.14,   color: 'rgba(167,139,250,0.25)', label: 'Baltimore → Rotterdam' },

  // ── Colombia coal to Asia
  { startLat: 11.83,  startLng: -72.36, endLat: 36.06,  endLng: 120.38, color: 'rgba(251,191,36,0.28)',  label: 'Puerto Bolívar → Qingdao (Coal)' },
];
