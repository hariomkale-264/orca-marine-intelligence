import React, { useState, useRef } from 'react';
import {
  Layers,
  Eye,
  AlertTriangle,
  Fish,
  Thermometer,
  Waves,
  Wind,
  CloudLightning,
  Compass,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  ShieldAlert,
  Info,
  ChevronRight,
  Radio,
  MapPin,
  Sparkles,
  Globe,
} from 'lucide-react';
import { MarineZone, MARINE_ZONES } from '../../data/marineAnalyticsData';
import { RiskLevel } from '../../services/orcaLocationService';
import { AppMode } from '../../services/modeController';
import { GraduationCap } from 'lucide-react';

export interface SelectedLocationPoint {
  lat: number;
  lng: number;
  riskLevel?: RiskLevel;
  pfzSuitability?: string;
}

interface MarineIntelligenceMapProps {
  zones: MarineZone[];
  selectedZoneId?: string;
  onSelectZone: (zone: MarineZone) => void;
  selectedLocation?: SelectedLocationPoint | null;
  onMapLocationClick?: (coords: { lat: number; lng: number }) => void;
  activeMode?: AppMode;
  onChangeMode?: (mode: AppMode) => void;
  onSwitchEngine?: (engine: 'google-maps' | 'tactical') => void;
}

export const MarineIntelligenceMap: React.FC<MarineIntelligenceMapProps> = ({
  zones = [],
  selectedZoneId,
  onSelectZone,
  selectedLocation,
  onMapLocationClick,
  activeMode = 'fisherman',
  onChangeMode,
  onSwitchEngine,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeLayers, setActiveLayers] = useState<{
    risk: boolean;
    pfz: boolean;
    sst: boolean;
    wave: boolean;
    wind: boolean;
    weather: boolean;
    cyclone: boolean;
  }>({
    risk: true,
    pfz: true,
    sst: true,
    wave: true,
    wind: true,
    weather: true,
    cyclone: true,
  });

  const [hoveredZone, setHoveredZone] = useState<MarineZone | null>(null);

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Convert Indian Coastal coordinate bounds (approx Lat 7-22°N, Lng 68-84°E) to SVG viewBox coordinates (1000 x 650)
  const mapCoords = (lat?: number, lng?: number) => {
    const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : 18.5;
    const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : 72.8;
    const minLng = 68.0;
    const maxLng = 83.5;
    const minLat = 7.5;
    const maxLat = 21.5;

    const x = ((safeLng - minLng) / (maxLng - minLng)) * 820 + 70;
    const y = ((maxLat - safeLat) / (maxLat - minLat)) * 520 + 60;
    return { x, y };
  };

  // Inverse conversion: SVG viewBox coords (x, y) to Latitude & Longitude
  const svgToCoords = (x: number, y: number) => {
    const minLng = 68.0;
    const maxLng = 83.5;
    const minLat = 7.5;
    const maxLat = 21.5;

    let lng = minLng + ((x - 70) / 820) * (maxLng - minLng);
    let lat = maxLat - ((y - 60) / 520) * (maxLat - minLat);

    lat = Math.max(6.5, Math.min(23.0, lat));
    lng = Math.max(66.5, Math.min(85.5, lng));

    return { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) };
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) return;
    const svgPoint = pt.matrixTransform(screenCTM.inverse());
    const coords = svgToCoords(svgPoint.x, svgPoint.y);
    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' && !isNaN(coords.lat)) {
      onMapLocationClick?.(coords);
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) return;
    const svgPoint = pt.matrixTransform(screenCTM.inverse());
    const coords = svgToCoords(svgPoint.x, svgPoint.y);
    if (coords && typeof coords.lat === 'number') {
      setCursorCoords(coords);
    }
  };

  const fallbackZone = (zones && zones[0]) || MARINE_ZONES[0];
  const activeZone: MarineZone =
    (zones && zones.find((z) => z.id === selectedZoneId)) || fallbackZone;

  const getRiskColor = (level?: MarineZone['riskLevel'] | RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'MODERATE':
        return '#f59e0b';
      case 'LOW':
      default:
        return '#10b981';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative liquid-glass rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'h-[620px] sm:h-[700px]'
      }`}
    >
      {/* Top Map Header & Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Title & Engine Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 shadow-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold font-sans text-white tracking-wide">
              Marine Risk & Intelligence Map
            </span>
          </div>

          {/* Map Engine Toggle */}
          {onSwitchEngine && (
            <div className="flex items-center bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-xl text-xs font-mono">
              <button
                onClick={() => onSwitchEngine('google-maps')}
                className="px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-white/70 hover:text-white hover:bg-white/10"
                title="Switch to Google Maps Satellite View"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Map</span>
              </button>
              <button
                onClick={() => onSwitchEngine('tactical')}
                className="px-2.5 py-1 rounded-xl flex items-center gap-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-sm cursor-pointer"
                title="Currently on Tactical Vector Grid"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tactical Grid</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Mode Switcher */}
        {onChangeMode && (
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-xl text-xs font-mono">
            <span className="text-[10px] text-white/50 px-2 hidden lg:inline">MODE:</span>
            <button
              onClick={() => onChangeMode('fisherman')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'fisherman'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              title="Fisherman Mode: Safety, PFZ, Data Freshness"
            >
              <Fish className="w-3.5 h-3.5" />
              <span>Fisherman</span>
            </button>
            <button
              onClick={() => onChangeMode('marine-safety')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'marine-safety'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              title="Marine Safety Mode: Coastal Hazards, Navigation Alerts"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Marine Safety</span>
            </button>
            <button
              onClick={() => onChangeMode('research')}
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'research'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 font-bold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              title="Research / Analysis Mode: 7-Agent Telemetry, Evidence Trail"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Research</span>
            </button>
          </div>
        )}

        {/* View Controls & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center bg-slate-950/85 backdrop-blur-md rounded-xl border border-white/20 p-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
              className="p-1.5 hover:bg-white/15 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 text-[10px] font-mono text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              title="Reset View"
            >
              {(zoomLevel * 100).toFixed(0)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
              className="p-1.5 hover:bg-white/15 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white/80 hover:text-cyan-400 shadow-xl transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Layer Control Pills Bar */}
      <div className="absolute top-16 left-3 z-20 pointer-events-auto max-w-[90%] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/15 shadow-xl">
          <span className="text-[10px] font-mono text-white/50 px-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> LAYERS:
          </span>

          <button
            onClick={() => toggleLayer('risk')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.risk
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3" /> Marine Risk
          </button>

          <button
            onClick={() => toggleLayer('pfz')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.pfz
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <Fish className="w-3 h-3" /> PFZ
          </button>

          <button
            onClick={() => toggleLayer('sst')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.sst
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <Thermometer className="w-3 h-3" /> SST
          </button>

          <button
            onClick={() => toggleLayer('wave')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.wave
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <Waves className="w-3 h-3" /> Wave Height
          </button>

          <button
            onClick={() => toggleLayer('wind')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.wind
                ? 'bg-teal-500/20 text-teal-300 border-teal-400/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <Wind className="w-3 h-3" /> Wind
          </button>

          <button
            onClick={() => toggleLayer('weather')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.weather
                ? 'bg-purple-500/20 text-purple-300 border-purple-400/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <CloudLightning className="w-3 h-3" /> Weather Alerts
          </button>

          <button
            onClick={() => toggleLayer('cyclone')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.cyclone
                ? 'bg-red-500/20 text-red-300 border-red-400/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <Crosshair className="w-3 h-3" /> Cyclone Track
          </button>
        </div>
      </div>

      {/* Main Geospatial Interactive SVG Canvas */}
      <div className="relative w-full h-full bg-[#050e1d] overflow-hidden flex items-center justify-center select-none cursor-crosshair">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 650"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
          onClick={handleSvgClick}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={() => setCursorCoords(null)}
        >
          <defs>
            {/* Ocean Depth Gradient */}
            <radialGradient id="oceanGlow" cx="40%" cy="60%" r="70%">
              <stop offset="0%" stopColor="#082245" />
              <stop offset="60%" stopColor="#041224" />
              <stop offset="100%" stopColor="#020812" />
            </radialGradient>

            {/* SST Thermal Gradient */}
            <linearGradient id="sstHeatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(244, 63, 94, 0.25)" />
              <stop offset="50%" stopColor="rgba(245, 158, 11, 0.18)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0.12)" />
            </linearGradient>

            {/* Cyclone Cone of Uncertainty Gradient */}
            <linearGradient id="cycloneCone" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.45)" />
              <stop offset="50%" stopColor="rgba(239, 68, 68, 0.2)" />
              <stop offset="100%" stopColor="rgba(249, 115, 22, 0.05)" />
            </linearGradient>

            {/* Grid Pattern */}
            <pattern id="marineGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1" fill="rgba(34, 211, 238, 0.2)" />
            </pattern>
          </defs>

          {/* Deep Ocean Base */}
          <rect width="1000" height="650" fill="url(#oceanGlow)" />
          <rect width="1000" height="650" fill="url(#marineGrid)" />

          {/* Bathymetry Depth Contours */}
          <path
            d="M 50,200 Q 200,280 280,480 T 360,650"
            fill="none"
            stroke="rgba(6, 182, 212, 0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="70" y="220" fill="rgba(6, 182, 212, 0.3)" fontSize="9" fontFamily="monospace">
            -2000m ISOBATH
          </text>

          <path
            d="M 120,180 Q 260,260 320,440 T 400,650"
            fill="none"
            stroke="rgba(6, 182, 212, 0.25)"
            strokeWidth="1.2"
          />
          <text x="140" y="195" fill="rgba(6, 182, 212, 0.4)" fontSize="9" fontFamily="monospace">
            -200m SHELF BREAK
          </text>

          {/* SST Layer: Thermal Heat Contours (Visible when sst is true) */}
          {activeLayers.sst && (
            <g className="transition-opacity duration-300">
              <path
                d="M 80,120 C 180,190 280,240 320,480 C 350,560 380,640 420,650 L 0,650 L 0,120 Z"
                fill="url(#sstHeatGradient)"
              />
              <text x="90" y="380" fill="rgba(244, 63, 94, 0.6)" fontSize="11" fontFamily="monospace" fontWeight="bold">
                ISOTHERM: 30.5°C (THERMAL POOL)
              </text>
              <text x="110" y="260" fill="rgba(245, 158, 11, 0.6)" fontSize="11" fontFamily="monospace" fontWeight="bold">
                ISOTHERM: 29.2°C
              </text>
            </g>
          )}

          {/* Stylized Indian Subcontinent Landmass (Coastline) */}
          <g id="landmass" className="drop-shadow-2xl">
            {/* Peninsular Coast: Gujarat, Maharashtra/Konkan, Goa, Karnataka, Kerala, Kanyakumari, Tamil Nadu, Andhra */}
            <path
              d="M 120,40
                 Q 170,45 220,50
                 L 260,95
                 Q 290,135 300,165
                 L 315,220
                 Q 335,300 355,380
                 L 375,440
                 Q 395,510 420,560
                 L 435,595
                 L 448,590
                 Q 470,530 495,460
                 L 530,370
                 Q 580,280 630,220
                 L 700,160
                 L 850,140
                 L 1000,140
                 L 1000,0
                 L 120,0 Z"
              fill="#0d1f36"
              stroke="#22d3ee"
              strokeWidth="2.2"
              className="transition-all"
            />

            {/* Land Texture & Hatching */}
            <path
              d="M 280,120 L 400,240 M 340,110 L 480,250 M 420,130 L 560,270"
              stroke="rgba(255, 255, 255, 0.03)"
              strokeWidth="1"
            />

            {/* Coastal City Labels */}
            <g fill="rgba(255, 255, 255, 0.6)" fontSize="10" fontFamily="sans-serif">
              <circle cx="308" cy="180" r="3" fill="#22d3ee" />
              <text x="318" y="184" fontWeight="600">Mumbai</text>

              <circle cx="340" cy="275" r="2.5" fill="#22d3ee" />
              <text x="350" y="278">Goa</text>

              <circle cx="365" cy="355" r="2.5" fill="#22d3ee" />
              <text x="375" y="358">Mangaluru</text>

              <circle cx="395" cy="450" r="3" fill="#ef4444" />
              <text x="405" y="454" fontWeight="600" fill="#fca5a5">Kochi</text>

              <circle cx="435" cy="590" r="2.5" fill="#22d3ee" />
              <text x="445" y="593">Kanyakumari</text>

              <circle cx="525" cy="385" r="3" fill="#22d3ee" />
              <text x="535" y="388" fontWeight="600">Chennai</text>
            </g>

            {/* Sri Lanka Island Outline */}
            <path
              d="M 485,550 Q 515,570 515,600 Q 500,630 480,620 Q 465,580 485,550 Z"
              fill="#0d1f36"
              stroke="#22d3ee"
              strokeWidth="1.5"
            />
            <text x="480" y="590" fill="rgba(255, 255, 255, 0.5)" fontSize="9">Sri Lanka</text>
          </g>

          {/* Wind Vector Barbs (Visible when wind is true) */}
          {activeLayers.wind && (
            <g className="transition-opacity duration-300 opacity-75">
              {[
                { x: 140, y: 150, knots: 16, angle: 65 },
                { x: 200, y: 220, knots: 18, angle: 70 },
                { x: 180, y: 320, knots: 22, angle: 80 },
                { x: 220, y: 410, knots: 26, angle: 85 },
                { x: 260, y: 500, knots: 34, angle: 95 },
                { x: 120, y: 460, knots: 28, angle: 90 },
                { x: 620, y: 420, knots: 11, angle: -45 },
                { x: 680, y: 320, knots: 14, angle: -50 },
              ].map((w, idx) => (
                <g key={`wind-${idx}`} transform={`translate(${w.x}, ${w.y}) rotate(${w.angle})`}>
                  <line x1="0" y1="0" x2="28" y2="0" stroke="#2dd4bf" strokeWidth="1.8" />
                  <polygon points="28,0 20,-4 22,0 20,4" fill="#2dd4bf" />
                  <text x="32" y="3" fill="#5eead4" fontSize="8" fontFamily="monospace">
                    {w.knots}kts
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Cyclone Track Layer (Visible when cyclone is true) */}
          {activeLayers.cyclone && (
            <g className="transition-opacity duration-300">
              {/* Projected Cone of Uncertainty */}
              <path
                d="M 230,580 L 320,470 L 410,430 L 440,490 L 310,590 Z"
                fill="url(#cycloneCone)"
                stroke="rgba(239, 68, 68, 0.6)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              {/* Storm Track Centerline */}
              <path
                d="M 240,580 Q 330,490 395,450"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
              />
              {/* Cyclone Eye & Pulse */}
              <circle cx="320" cy="510" r="14" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping" opacity="0.6" />
              <circle cx="320" cy="510" r="6" fill="#ef4444" />
              <text x="338" y="515" fill="#fca5a5" fontSize="10" fontFamily="monospace" fontWeight="bold">
                CYCLONIC SYSTEM (984 hPa)
              </text>
              <text x="338" y="527" fill="rgba(255, 255, 255, 0.6)" fontSize="8" fontFamily="monospace">
                TRACK VELOCITY: 14 kts WNW
              </text>
            </g>
          )}

          {/* Potential Fishing Zones (PFZ) Overlay (Visible when pfz is true) */}
          {activeLayers.pfz && (
            <g className="transition-opacity duration-300">
              {/* PFZ Area 1: Ratnagiri Front */}
              <g>
                <polygon
                  points="210,220 270,210 280,260 220,270"
                  fill="rgba(6, 182, 212, 0.25)"
                  stroke="#22d3ee"
                  strokeWidth="1.8"
                  strokeDasharray="5 3"
                />
                <circle cx="245" cy="240" r="4" fill="#22d3ee" />
                <text x="245" y="225" fill="#67e8f9" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  PFZ-01: RATNAGIRI UPWELLING (45 Vessels)
                </text>
              </g>

              {/* PFZ Area 2: Goa Shelf */}
              <g>
                <polygon
                  points="250,290 310,280 320,330 260,340"
                  fill="rgba(6, 182, 212, 0.22)"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text x="285" y="315" fill="#67e8f9" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  PFZ-02: GOA CORRIDOR
                </text>
              </g>

              {/* PFZ Area 3: Coromandel East */}
              <g>
                <polygon
                  points="560,340 630,330 640,390 570,400"
                  fill="rgba(6, 182, 212, 0.2)"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text x="600" y="370" fill="#67e8f9" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  PFZ-03: CHENNAI SHELF (42 Vessels)
                </text>
              </g>
            </g>
          )}

          {/* Interactive Marine Zone Hotspots & Risk Overlays */}
          {zones.map((zone) => {
            const { x, y } = mapCoords(zone.lat, zone.lng);
            const isSelected = zone.id === selectedZoneId;
            const isHovered = hoveredZone?.id === zone.id;
            const color = getRiskColor(zone.riskLevel);

            return (
              <g
                key={zone.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectZone(zone);
                }}
                onMouseEnter={() => setHoveredZone(zone)}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer"
              >
                {/* Risk Halo when Risk layer is active */}
                {activeLayers.risk && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 26 : isHovered ? 22 : 16}
                    fill={color}
                    fillOpacity={zone.riskLevel === 'CRITICAL' ? 0.35 : 0.18}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.2}
                    className={zone.riskLevel === 'CRITICAL' ? 'animate-pulse' : ''}
                  />
                )}

                {/* Core Vessel/Sensor Beacon Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : 4.5}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  className="shadow-lg"
                />

                {/* Wave height tag when wave layer is active */}
                {activeLayers.wave && (
                  <g transform={`translate(${x + 10}, ${y - 8})`}>
                    <rect
                      x="0"
                      y="0"
                      width="42"
                      height="15"
                      rx="4"
                      fill="rgba(2, 6, 23, 0.85)"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="0.8"
                    />
                    <text x="4" y="11" fill="#93c5fd" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      🌊 {zone.waveHeight}m
                    </text>
                  </g>
                )}

                {/* Label text */}
                <text
                  x={x}
                  y={y + 24}
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="sans-serif"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow-md"
                >
                  {zone.name.split('(')[0]}
                </text>
              </g>
            );
          })}

          {/* Selected Location Marker & Pulsing Beacon */}
          {selectedLocation &&
            typeof selectedLocation.lat === 'number' &&
            typeof selectedLocation.lng === 'number' &&
            !isNaN(selectedLocation.lat) &&
            !isNaN(selectedLocation.lng) &&
            (() => {
              const pos = mapCoords(selectedLocation.lat, selectedLocation.lng);
              const color = getRiskColor(selectedLocation.riskLevel);
              return (
                <g key={`loc-${pos.x.toFixed(1)}-${pos.y.toFixed(1)}`} className="pointer-events-none">
                {/* Outer animated radar echo ring - smooth pulse without CSS transform */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={32}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  className="animate-pulse"
                  opacity="0.5"
                />
                {/* Secondary dashed boundary circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={20}
                  fill={color}
                  fillOpacity="0.18"
                  stroke={color}
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                />
                {/* Crosshair target reticle */}
                <line
                  x1={pos.x - 14}
                  y1={pos.y}
                  x2={pos.x + 14}
                  y2={pos.y}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                <line
                  x1={pos.x}
                  y1={pos.y - 14}
                  x2={pos.x}
                  y2={pos.y + 14}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                {/* Center glowing core beacon */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={7}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="drop-shadow-xl"
                />
                <circle cx={pos.x} cy={pos.y} r={2.5} fill="#ffffff" />

                {/* Floating Intelligence Tag with Coordinates */}
                <g transform={`translate(${pos.x}, ${pos.y - 44})`}>
                  <rect
                    x="-78"
                    y="0"
                    width="156"
                    height="36"
                    rx="8"
                    fill="rgba(2, 6, 23, 0.95)"
                    stroke={color}
                    strokeWidth="1.5"
                    className="filter drop-shadow-xl"
                  />
                  <text
                    x="0"
                    y="14"
                    fill="#22d3ee"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    📍 {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lng.toFixed(4)}°E
                  </text>
                  <text
                    x="0"
                    y="27"
                    fill="#ffffff"
                    fontSize="8.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {selectedLocation.riskLevel || 'ANALYZING'} • PFZ: {selectedLocation.pfzSuitability || 'Evaluating'}
                  </text>
                </g>
              </g>
            );
          })()}
        </svg>

        {/* Hovered / Floating Telemetry Card on Map */}
        {hoveredZone && (
          <div className="absolute bottom-16 right-4 z-20 pointer-events-none w-72 liquid-glass rounded-2xl p-3 border border-white/20 shadow-2xl animate-fade-slide-up">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-xs font-bold text-white truncate">{hoveredZone.name}</span>
              <span
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border"
                style={{
                  color: getRiskColor(hoveredZone.riskLevel),
                  borderColor: getRiskColor(hoveredZone.riskLevel),
                  backgroundColor: `${getRiskColor(hoveredZone.riskLevel)}20`,
                }}
              >
                {hoveredZone.riskLevel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-white/80">
              <div>SST: <span className="text-cyan-400 font-bold">{hoveredZone.seaSurfaceTemp}°C</span></div>
              <div>Wave: <span className="text-blue-400 font-bold">{hoveredZone.waveHeight}m</span></div>
              <div>Wind: <span className="text-teal-400 font-bold">{hoveredZone.windSpeed} kts</span></div>
              <div>Salinity: <span className="text-white font-bold">{hoveredZone.salinity} PSU</span></div>
            </div>
            {hoveredZone.alertNotice && (
              <div className="mt-1.5 p-1 rounded bg-rose-500/20 text-rose-300 text-[10px] border border-rose-500/30 truncate">
                ⚠️ {hoveredZone.alertNotice}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Map HUD: Risk Legend & Active Selection Telemetry Banner */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-none">
        {/* Risk Legend */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 shadow-xl text-xs font-mono">
          <span className="text-white/50 text-[10px] uppercase font-semibold">RISK LEGEND:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-300 text-[11px]">LOW</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-amber-300 text-[11px]">MODERATE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-orange-300 text-[11px]">HIGH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-400 text-[11px] font-bold">CRITICAL</span>
          </div>
        </div>

        {/* Live Coordinate Cursor Tracker / Click Hint */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-xl text-xs font-mono">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          {cursorCoords && typeof cursorCoords.lat === 'number' && typeof cursorCoords.lng === 'number' ? (
            <span className="text-cyan-300 text-[11px] truncate">
              Coordinates: <strong className="text-white font-mono">{cursorCoords.lat.toFixed(2)}°N, {cursorCoords.lng.toFixed(2)}°E</strong> (Click to analyze)
            </span>
          ) : (
            <span className="text-white/60 text-[11px] font-sans truncate">
              🎯 Click anywhere on the marine map to run 7-Agent AI Analysis
            </span>
          )}
        </div>

        {/* Selected Sector Quick Bar */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-xl text-xs">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-white font-semibold truncate max-w-[180px]">
            {selectedLocation && typeof selectedLocation.lat === 'number' && typeof selectedLocation.lng === 'number'
              ? `${selectedLocation.lat.toFixed(2)}°N, ${selectedLocation.lng.toFixed(2)}°E`
              : activeZone?.name || 'Marine Sector'}
          </span>
          <span className="text-white/40 font-mono">|</span>
          <span className="text-cyan-300 font-mono text-[11px]">
            {selectedLocation?.riskLevel || activeZone?.riskLevel || 'LOW'}
          </span>
          {activeZone && (
            <button
              onClick={() => onSelectZone(activeZone)}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer ml-1"
            >
              Telemetry <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
