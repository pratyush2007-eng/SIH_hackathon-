import React, { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'globe.gl';
import { PORTS, AMBIENT_ROUTES } from '../data/mockData';
import type { Port, RoutePlan } from '../data/mockData';

interface GlobeViewProps {
  recommendedPlan: RoutePlan | null;
  allPlans: RoutePlan[];
  focusedPlanId: string | null;
  isOptimizing: boolean;
  optimizationStep: number;
  onPortClick: (port: Port) => void;
}

export const GlobeView: React.FC<GlobeViewProps> = ({
  recommendedPlan,
  allPlans,
  focusedPlanId,
  isOptimizing,
  optimizationStep,
  onPortClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const [globeReady, setGlobeReady] = useState(false);

  // ── Globe init ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const globe = (Globe as any)()(containerRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#2a2a2a')
      .atmosphereAltitude(0.15) 
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight);

    globe.pointOfView({ lat: 5.0, lng: 95.0, altitude: 2.2 }, 1000);
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.4;

    globeInstanceRef.current = globe;
    setGlobeReady(true);

    const handleResize = () => {
      if (containerRef.current && globeInstanceRef.current) {
        globeInstanceRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  // ── Data update effect ───────────────────────────────────────────────────
  const onPortClickStable = useCallback(onPortClick, []);

  useEffect(() => {
    if (!globeInstanceRef.current || !globeReady) return;
    const globe = globeInstanceRef.current;
    const focusedPlan = allPlans.find(p => p.id === focusedPlanId) || recommendedPlan;

    // Auto-rotate control
    if (isOptimizing || (!recommendedPlan && !focusedPlan)) {
      globe.controls().autoRotate = isOptimizing ? false : true;
    } else {
      globe.controls().autoRotate = false;
    }

    // Removed all pointsData (cubes) logic per brutalist theme requirements

    // ── Labels ──────────────────────────────────────────────────────────
    const labelPorts = PORTS.filter(p =>
      p.id === recommendedPlan?.originPort.id ||
      p.id === recommendedPlan?.destinationPort.id ||
      allPlans.some(pl => pl.originPort.id === p.id || pl.destinationPort.id === p.id)
    );
    globe
      .labelsData(labelPorts.map(port => ({
        lat: port.lat, lng: port.lng,
        text: port.name,
        size: (port.id === recommendedPlan?.originPort.id || port.id === recommendedPlan?.destinationPort.id) ? 0.9 : 0.55,
        color: port.id === recommendedPlan?.originPort.id ? '#4ADE80'
          : port.id === recommendedPlan?.destinationPort.id ? '#38BDF8'
          : 'rgba(148,163,184,0.60)',
      })))
      .labelText('text')
      .labelSize('size')
      .labelColor('color')
      .labelDotRadius(0)   // no dot — emoji marker is enough
      .labelAltitude(0.04);

    // ── Arcs (Arrow / Comet style) ─────────────────────────────────────────
    let arcs: any[] = [];

    if (isOptimizing) {
      if (optimizationStep >= 1) {
        allPlans.forEach(plan => {
          const isWinning = plan.isRecommended && optimizationStep >= 3;
          arcs.push({
            startLat: plan.originPort.lat, startLng: plan.originPort.lng,
            endLat: plan.destinationPort.lat, endLng: plan.destinationPort.lng,
            color: isWinning ? ['#2DD4E8', '#4ADE80'] : ['rgba(251,191,36,0.5)', 'rgba(248,113,113,0.3)'],
            dashLength: 0.02,   
            dashGap: 0.03,       
            dashAnimateTime: isWinning ? 6000 : 12000,
            stroke: isWinning ? 2.5 : 0.8,
            altitude: isWinning ? 0.35 : 0.16,
          });
        });
      }
    } else if (allPlans.length > 0) {
      allPlans.forEach(plan => {
        const isRec     = plan.isRecommended;
        const isFocused = plan.id === focusedPlanId && !isRec;

        arcs.push({
          startLat: plan.originPort.lat, startLng: plan.originPort.lng,
          endLat: plan.destinationPort.lat, endLng: plan.destinationPort.lng,
          // Single "arrow/comet" moving along the route
          color: isRec
            ? ['#2DD4E8', '#4ADE80']            
            : isFocused
            ? ['rgba(56,189,248,0.75)', 'rgba(45,212,232,0.5)']
            : ['rgba(100,116,139,0.30)', 'rgba(71,85,105,0.20)'],
          dashLength: 0.02,
          dashGap: 0.03,
          dashAnimateTime: isRec ? 6000 : isFocused ? 12000 : 0,
          stroke: isRec ? 2.8 : isFocused ? 1.5 : 0.6,
          altitude: isRec ? 0.38 : isFocused ? 0.22 : 0.12,
        });
      });

      // Camera follows focused or recommended plan
      const camPlan = focusedPlan || recommendedPlan;
      if (camPlan) {
        const midLat = (camPlan.originPort.lat + camPlan.destinationPort.lat) / 2;
        const midLng = (camPlan.originPort.lng + camPlan.destinationPort.lng) / 2;
        globe.pointOfView({ lat: midLat * 0.6, lng: midLng, altitude: 1.85 }, 1600);
      }
    } else {
      // Idle ambient — single moving arrows along the lanes
      arcs = AMBIENT_ROUTES.map(route => ({
        startLat: route.startLat, startLng: route.startLng,
        endLat: route.endLat, endLng: route.endLng,
        color: [route.color, route.color.replace(/[\d.]+\)$/, '0.08)')],
        dashLength: 0.02, dashGap: 0.03, dashAnimateTime: 12000,
        stroke: 0.6, altitude: 0.18,
      }));
    }

    globe
      .arcsData(arcs)
      .arcColor('color')
      .arcDashLength('dashLength')
      .arcDashGap('dashGap')
      .arcDashAnimateTime('dashAnimateTime')
      .arcStroke('stroke')
      .arcAltitude('altitude');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedPlan, allPlans, focusedPlanId, isOptimizing, optimizationStep, globeReady, onPortClickStable]);

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden" style={{ background: 'transparent' }}>
      {/* 3D Globe canvas */}
      <div ref={containerRef} className="w-full h-full cursor-pointer" />

      {/* Ocean depth vignette — darkens edges like peering through deep water */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(2,13,20,0.50) 68%, rgba(2,8,14,0.88) 100%)'
      }} />

      {/* Horizon shimmer */}
      <div className="pointer-events-none absolute" style={{
        left: 0, right: 0, top: '50%', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(45,212,232,0.10) 30%, rgba(56,189,248,0.18) 50%, rgba(45,212,232,0.10) 70%, transparent)',
        boxShadow: '0 0 40px 8px rgba(45,212,232,0.05)',
      }} />

      {/* ── Globe Legend ────────────────────────────────────────────── */}
      <div
        className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-3 backdrop-blur-md px-3 py-2.5 rounded-xl font-mono text-[10px]"
        style={{ background: 'rgba(2,13,20,0.80)', border: '1px solid rgba(45,212,232,0.16)', boxShadow: '0 0 20px rgba(45,212,232,0.06)' }}
      >
        <span className="font-bold tracking-wider mr-1" style={{ color: 'rgba(165,243,252,0.4)' }}>LEGEND</span>
        {[
          { dot: '#4ADE80', label: 'Origin' },
          { dot: '#38BDF8', label: 'Destination' },
          { dot: '#FBBF24', label: 'Alt. Origin' },
          { dot: '#FFFFFF', label: 'Live Vessel' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: item.dot, boxShadow: `0 0 6px ${item.dot}` }} />
            <span style={{ color: 'rgba(165,243,252,0.6)' }}>{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
          <span className="text-[11px]" style={{ color: 'rgba(165,243,252,0.35)' }}>Click any port ↗ for route details</span>
        </div>
      </div>
    </div>
  );
};
