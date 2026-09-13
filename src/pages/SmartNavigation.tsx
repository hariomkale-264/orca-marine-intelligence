import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  MapPin,
  Shield,
  Route,
  Anchor,
  Radio,
  Sparkles,
  Send,
  Key,
  Globe,
  Radar,
  LocateFixed,
  RotateCcw,
} from 'lucide-react';
import {
  GoogleMapsNavigator,
  NavWaypoint,
  LiveVessel,
} from '../components/GoogleMapsNavigator.tsx';
import { MarineRadarMap } from '../components/MarineRadarMap.tsx';
import { OrcaRole } from '../types.ts';

const INITIAL_WAYPOINTS: NavWaypoint[] = [
  {
    id: 'wp-1',
    name: 'Harbor Gate Alpha',
    lat: 18.922,
    lng: 72.8347,
    depth: '14.2 m',
    hazardRisk: 'Low',
    recommendedSpeed: '6 kts',
  },
  {
    id: 'wp-2',
    name: 'Outer Fairway Buoy',
    lat: 18.905,
    lng: 72.78,
    depth: '22.8 m',
    hazardRisk: 'Low',
    recommendedSpeed: '12 kts',
  },
  {
    id: 'wp-3',
    name: 'Continental Slope Transit Point',
    lat: 18.84,
    lng: 72.65,
    depth: '64.5 m',
    hazardRisk: 'Moderate',
    recommendedSpeed: '15 kts',
  },
  {
    id: 'wp-4',
    name: 'Deepwater Oceanic Waypoint Kilo',
    lat: 18.72,
    lng: 72.48,
    depth: '180.0 m',
    hazardRisk: 'Low',
    recommendedSpeed: '18 kts',
  },
];

const INITIAL_VESSELS: LiveVessel[] = [
  {
    id: 'user-vessel',
    name: 'ORCA Vector-1 (Own Ship)',
    type: 'Hydrographic Patrol & Research',
    lat: 18.918,
    lng: 72.812,
    speed: 14.2,
    heading: 245,
    depth: '28.5 m',
    callSign: 'VT-881',
    mmsi: '419000124',
    status: 'Underway',
  },
  {
    id: 'vessel-2',
    name: 'ICGS Samarth (Coast Guard)',
    type: 'Offshore Patrol Vessel',
    lat: 18.885,
    lng: 72.74,
    speed: 18.6,
    heading: 190,
    depth: '42.0 m',
    callSign: 'AW-02',
    mmsi: '419992001',
    status: 'Underway',
  },
  {
    id: 'vessel-3',
    name: 'RV Sindhu Sadhana',
    type: 'Oceanographic Research',
    lat: 18.815,
    lng: 72.61,
    speed: 7.8,
    heading: 285,
    depth: '78.2 m',
    callSign: 'SS-904',
    mmsi: '419083000',
    status: 'Underway',
  },
  {
    id: 'vessel-4',
    name: 'Matsya Rani VII',
    type: 'Mechanized Deep-Sea Trawler',
    lat: 18.865,
    lng: 72.695,
    speed: 5.4,
    heading: 215,
    depth: '55.0 m',
    callSign: 'MR-07',
    mmsi: '419401292',
    status: 'Engaged in Fishing',
  },
  {
    id: 'buoy-5',
    name: 'INCOIS Ocean Buoy OB-04',
    type: 'Moored Meteorological Telemetry',
    lat: 18.75,
    lng: 72.53,
    speed: 0.0,
    heading: 0,
    depth: '145.0 m',
    callSign: 'OB-04',
    mmsi: '994191004',
    status: 'Moored',
  },
];

// Helper to compute nautical distance between 2 coordinates in NM
function calculateNauticalDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const SmartNavigation: React.FC = () => {
  const [waypoints, setWaypoints] = useState<NavWaypoint[]>(INITIAL_WAYPOINTS);
  const [vessels, setVessels] = useState<LiveVessel[]>(INITIAL_VESSELS);
  const [activeVesselId, setActiveVesselId] = useState<string>('user-vessel');
  const [selectedWaypoint, setSelectedWaypoint] = useState<NavWaypoint>(INITIAL_WAYPOINTS[0]);
  const [vesselDraft, setVesselDraft] = useState('3.8');
  const [routeCalculated, setRouteCalculated] = useState(true);
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [activeMode, setActiveMode] = useState<OrcaRole>('Default Mode');
  const [useRealGPS, setUseRealGPS] = useState(false);

  // Google Maps API Key handling
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem('orca_gmaps_key') || envKey;
  });
  const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState(false);
  const effectiveKey = customKey || envKey;

  // If a valid key exists, user can start in Google Maps; otherwise start in Marine Radar with zero errors
  const [viewEngine, setViewEngine] = useState<'google-maps' | 'radar'>(() => {
    const savedKey = localStorage.getItem('orca_gmaps_key') || envKey;
    return savedKey && savedKey.trim().length > 6 ? 'google-maps' : 'radar';
  });

  // Integrated AI Assistant Quick Q&A
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(
    'Hello! I am ORCA. Ask me any question—from real-time waypoint sounding depths and marine routes to science, mathematics, geography, or general trivia.'
  );

  const geoWatchIdRef = useRef<number | null>(null);

  // Live AIS vessel motion simulation loop
  useEffect(() => {
    if (!isLiveTracking) return;

    const interval = setInterval(() => {
      setVessels((prevVessels) =>
        prevVessels.map((v) => {
          // Stationary moored buoy doesn't move
          if (v.status === 'Moored') return v;

          // If real GPS is controlling user-vessel, don't simulate it
          if (v.id === 'user-vessel' && useRealGPS) return v;

          // Calculate slight motion vector based on speed & heading
          const speedFactor = 0.00015 * (v.speed / 12);
          const rad = (v.heading * Math.PI) / 180;
          const dLat = Math.cos(rad) * speedFactor;
          const dLng = Math.sin(rad) * speedFactor;

          // Slight random course wiggle (±2 degrees)
          const headingWiggle = (Math.random() - 0.5) * 2;
          const newHeading = (v.heading + headingWiggle + 360) % 360;

          return {
            ...v,
            lat: v.lat + dLat,
            lng: v.lng + dLng,
            heading: Math.round(newHeading),
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveTracking, useRealGPS]);

  // Real device GPS integration
  const toggleRealGPS = () => {
    if (useRealGPS) {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      setUseRealGPS(false);
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        setVessels((prev) =>
          prev.map((v) => {
            if (v.id === 'user-vessel') {
              return {
                ...v,
                lat: latitude,
                lng: longitude,
                speed: speed ? Math.round(speed * 1.94384 * 10) / 10 : v.speed,
                heading: heading ? Math.round(heading) : v.heading,
              };
            }
            return v;
          })
        );
        setUseRealGPS(true);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not acquire device GPS. Using simulated AIS telemetry instead.');
        setUseRealGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );

    geoWatchIdRef.current = watchId;
  };

  useEffect(() => {
    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  // Compute total route distance
  const totalDistanceNM = (waypoints || []).reduce((acc, wp, idx) => {
    if (idx === 0) return 0;
    const prev = waypoints[idx - 1];
    if (!prev || !wp || typeof prev.lat !== 'number' || typeof wp.lat !== 'number') return acc;
    return acc + calculateNauticalDistance(prev.lat, prev.lng, wp.lat, wp.lng);
  }, 0);

  const fallbackVessel: LiveVessel = (vessels && vessels[0]) || INITIAL_VESSELS[0];
  const activeVessel = (vessels && vessels.find((v) => v.id === activeVesselId)) || fallbackVessel;
  const transitHours = activeVessel?.speed && activeVessel.speed > 0 ? totalDistanceNM / activeVessel.speed : 0;
  const transitHoursInt = Math.floor(transitHours);
  const transitMinutesInt = Math.round((transitHours - transitHoursInt) * 60);

  // Add custom waypoint on click
  const handleAddCustomWaypoint = (coord: { lat: number; lng: number }) => {
    const newWp: NavWaypoint = {
      id: `wp-custom-${Date.now()}`,
      name: `Waypoint ${waypoints.length + 1}`,
      lat: coord.lat,
      lng: coord.lng,
      depth: `${(20 + Math.random() * 80).toFixed(1)} m`,
      hazardRisk: 'Low',
      recommendedSpeed: '12 kts',
    };
    setWaypoints((prev) => [...prev, newWp]);
    setSelectedWaypoint(newWp);
  };

  // Remove waypoint
  const handleRemoveWaypoint = (id: string) => {
    if (waypoints.length <= 2) return;
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
    if (selectedWaypoint.id === id) {
      setSelectedWaypoint(waypoints[0]);
    }
  };

  // Reset route to default
  const handleResetRoute = () => {
    setWaypoints(INITIAL_WAYPOINTS);
    setSelectedWaypoint(INITIAL_WAYPOINTS[0]);
  };

  // Handle AI question submit
  const handleAskAi = async (questionText?: string) => {
    const prompt = questionText || aiQuestion;
    if (!prompt.trim() || aiLoading) return;

    setAiLoading(true);
    setAiQuestion('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          role: activeMode,
          language: 'English',
        }),
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      setAiResponse(data.reply || 'No response received.');
    } catch {
      // Fallback
      setAiResponse(
        `**ORCA Response:**\nRegarding "${prompt}": Telemetry stations report normal marine operation. Current waypoint sounding is ${selectedWaypoint.depth} with ${selectedWaypoint.hazardRisk} navigational risk.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      id="orca-smart-navigation-page"
      className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-white select-text pb-24"
    >
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
            <Compass className="w-3.5 h-3.5" />
            AUTONOMOUS PASSAGE PLANNING & LIVE GOOGLE MAPS NAVIGATION
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans mt-1 flex items-center gap-2.5">
            Smart Navigation System
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono font-medium">
              LIVE AIS
            </span>
          </h1>
        </div>

        {/* Top Controls: Mode Selector, Engine Toggle, Real GPS */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Operating Mode Selector */}
          <div className="bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
            <span className="text-white/40 text-[10px] uppercase">MODE:</span>
            <select
              value={activeMode}
              onChange={(e) => setActiveMode(e.target.value as OrcaRole)}
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
            >
              <option value="Default Mode" className="bg-slate-900 text-white">
                Default Mode (General)
              </option>
              <option value="Fisherman" className="bg-slate-900 text-white">
                Fisherman (PFZ)
              </option>
              <option value="Marine Researchers" className="bg-slate-900 text-white">
                Marine Researchers
              </option>
              <option value="Coastal Authorities" className="bg-slate-900 text-white">
                Coastal Authorities
              </option>
              <option value="Maritime Operators" className="bg-slate-900 text-white">
                Maritime Operators
              </option>
            </select>
          </div>

          {/* Engine Selector: Google Maps vs Marine Radar */}
          <div className="flex rounded-xl bg-black/60 border border-white/15 p-0.5">
            <button
              onClick={() => setViewEngine('google-maps')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                viewEngine === 'google-maps'
                  ? 'bg-cyan-500 text-black font-semibold shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>
            <button
              onClick={() => setViewEngine('radar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                viewEngine === 'radar'
                  ? 'bg-cyan-500 text-black font-semibold shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Marine Radar</span>
            </button>
          </div>

          {/* Real Device GPS Toggle */}
          <button
            onClick={toggleRealGPS}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow ${
              useRealGPS
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse'
                : 'bg-black/60 text-white/70 border-white/15 hover:bg-white/10'
            }`}
            title="Use your physical device GPS coordinates"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>{useRealGPS ? 'Real GPS: Active' : 'Use Device GPS'}</span>
          </button>

          {/* API Key Config Modal/Drawer Toggle */}
          <button
            onClick={() => setIsKeyDrawerOpen((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white/70 hover:text-white flex items-center gap-1.5 cursor-pointer"
            title="Google Maps API Key Configuration"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Maps Key</span>
          </button>
        </div>
      </div>

      {/* Optional Google Maps API Key Config Box */}
      {isKeyDrawerOpen && (
        <div className="my-4 p-4 rounded-2xl bg-black/80 border border-amber-400/40 backdrop-blur-md animate-fade-slide-up text-xs font-mono space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Key className="w-4 h-4" />
              <span>GOOGLE MAPS PLATFORM CONFIGURATION</span>
            </div>
            <button
              onClick={() => setIsKeyDrawerOpen(false)}
              className="text-white/50 hover:text-white cursor-pointer px-2 py-0.5"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-white/70 text-xs font-sans leading-relaxed">
            Google Maps runs with your configured API key or free Demo Key. For prototyping, you can get a public Maps Demo Key instantly without billing setup:
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-black font-semibold text-xs hover:bg-amber-300 transition cursor-pointer"
            >
              Get Free Maps Demo Key ↗
            </a>
            <span className="text-white/40">or enter your own key below:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="Paste Google Maps API Key (e.g. AIzaSy...)"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="flex-1 p-2 rounded-xl bg-black/50 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => {
                localStorage.setItem('orca_gmaps_key', customKey);
                alert('Google Maps API key saved.');
                setIsKeyDrawerOpen(false);
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Left Column: Voyage Parameters, AIS Fleet List, and turn-by-turn route */}
        <div className="space-y-5">
          {/* Voyage Parameters Card */}
          <div className="liquid-glass rounded-2xl sm:rounded-3xl border border-white/15 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                <Route className="w-4 h-4" />
                PASSAGE PARAMETERS
              </div>
              <button
                onClick={handleResetRoute}
                className="text-[10px] font-mono text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Reset waypoints to standard harbor passage"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/50 mb-1 text-[11px] font-mono">
                  ORIGIN HARBOR
                </label>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between text-white font-mono text-xs">
                  <span>MUMBAI OFFSHORE TERMINAL</span>
                  <Anchor className="w-4 h-4 text-cyan-400" />
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1 text-[11px] font-mono">
                  ACTIVE DESTINATION
                </label>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between text-white font-mono text-xs">
                  <span>{waypoints[waypoints.length - 1]?.name || 'Deepwater Kilo'}</span>
                  <MapPin className="w-4 h-4 text-cyan-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-white/50 mb-1 text-[10px] font-mono">
                    VESSEL DRAFT
                  </label>
                  <input
                    type="text"
                    value={vesselDraft}
                    onChange={(e) => setVesselDraft(e.target.value)}
                    className="w-full p-2 rounded-xl bg-black/40 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1 text-[10px] font-mono">
                    SAFETY MARGIN
                  </label>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-xs flex items-center justify-between">
                    <span>+2.0 m</span>
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Route Summary Box */}
              {routeCalculated && (
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1.5 font-mono">
                  <div className="text-[10px] uppercase text-cyan-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    OPTIMAL PASSAGE COMPUTED
                  </div>
                  <div className="flex justify-between text-white/70 pt-1">
                    <span>Total Distance:</span>
                    <span className="text-white font-bold">{totalDistanceNM} NM</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Est. Transit Time:</span>
                    <span className="text-white font-bold">
                      {transitHoursInt}h {transitMinutesInt}m (@{activeVessel.speed} kts)
                    </span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Waypoints:</span>
                    <span className="text-cyan-300 font-bold">{waypoints.length} Target Points</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live AIS Fleet Tracker List Card */}
          <div className="liquid-glass rounded-2xl sm:rounded-3xl border border-white/15 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                LIVE AIS TARGETS ({vessels.length})
              </div>
              <span className="text-[10px] font-mono text-emerald-400">REAL-TIME</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {vessels.map((v) => {
                const isSelected = v.id === activeVesselId;
                const isUser = v.id === 'user-vessel';

                return (
                  <button
                    key={v.id}
                    onClick={() => setActiveVesselId(v.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white'
                        : 'bg-black/40 hover:bg-white/5 border-white/10 text-white/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isUser ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
                          }`}
                        />
                        <span className="text-xs font-bold font-sans">{v.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-white/50 mt-0.5">
                        {v.lat.toFixed(3)}°N, {v.lng.toFixed(3)}°E • {v.depth}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="font-bold text-cyan-400">{v.speed} kts</div>
                      <div className="text-[10px] text-white/50">{v.heading}° HDG</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center & Right Column: Interactive Map/Radar & Active Waypoint Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Map Canvas Area */}
          <div className="liquid-glass rounded-2xl sm:rounded-3xl border border-white/15 p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm sm:text-base font-semibold text-white font-sans">
                  {viewEngine === 'google-maps'
                    ? 'Interactive Google Maps Marine Chart'
                    : 'Tactical Marine Satellite Radar'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                <span>SECTOR: ARABIAN SEA BASIN</span>
              </div>
            </div>

            {/* Render selected map engine */}
            {viewEngine === 'google-maps' ? (
              <GoogleMapsNavigator
                apiKey={effectiveKey}
                waypoints={waypoints}
                vessels={vessels}
                activeVesselId={activeVesselId}
                selectedWaypoint={selectedWaypoint}
                onSelectWaypoint={setSelectedWaypoint}
                onSelectVessel={(v) => setActiveVesselId(v.id)}
                onAddCustomWaypoint={handleAddCustomWaypoint}
                onRemoveWaypoint={handleRemoveWaypoint}
                onSwitchToRadar={() => setViewEngine('radar')}
                onSaveApiKey={(key) => setCustomKey(key)}
                isLiveTracking={isLiveTracking}
                onToggleLiveTracking={() => setIsLiveTracking((prev) => !prev)}
                activeRole={activeMode}
              />
            ) : (
              <MarineRadarMap
                waypoints={waypoints}
                vessels={vessels}
                activeVesselId={activeVesselId}
                selectedWaypoint={selectedWaypoint}
                onSelectWaypoint={setSelectedWaypoint}
                onSelectVessel={(v) => setActiveVesselId(v.id)}
                onAddCustomWaypoint={handleAddCustomWaypoint}
                isLiveTracking={isLiveTracking}
                onToggleLiveTracking={() => setIsLiveTracking((prev) => !prev)}
              />
            )}

            {/* Waypoints Selection Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
              {waypoints.map((wp, idx) => {
                const isSelected = selectedWaypoint.id === wp.id;
                return (
                  <button
                    key={wp.id}
                    onClick={() => setSelectedWaypoint(wp)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-black border-cyan-400 font-semibold shadow'
                        : 'bg-black/40 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>WP-{idx + 1}</span>
                      <span
                        className={`text-[10px] font-mono px-1 rounded ${
                          isSelected ? 'bg-black/20 text-black' : 'text-white/50'
                        }`}
                      >
                        {wp.depth}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium truncate mt-0.5">{wp.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Telemetry Sounding & Target Coordinate Card */}
          <div className="liquid-glass rounded-2xl p-4 sm:p-5 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
                SELECTED TARGET SOUNDING
              </span>
              <h3 className="text-base font-bold text-white font-sans mt-0.5">
                {selectedWaypoint?.name || 'Waypoint Sector'}
              </h3>
              <p className="text-xs font-mono text-white/70 mt-0.5">
                {selectedWaypoint && typeof selectedWaypoint.lat === 'number'
                  ? `${selectedWaypoint.lat.toFixed(4)}° N, ${selectedWaypoint.lng.toFixed(4)}° E`
                  : '18.9220° N, 72.8346° E'}
              </p>
            </div>

            <div className="flex items-center gap-5 text-xs font-mono">
              <div>
                <span className="text-white/40 block text-[10px]">SOUNDING DEPTH</span>
                <span className="text-cyan-300 font-bold text-sm">{selectedWaypoint.depth}</span>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div>
                <span className="text-white/40 block text-[10px]">HAZARD RISK</span>
                <span
                  className={`font-bold text-sm ${
                    selectedWaypoint.hazardRisk === 'High'
                      ? 'text-red-400'
                      : selectedWaypoint.hazardRisk === 'Moderate'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {selectedWaypoint.hazardRisk}
                </span>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div>
                <span className="text-white/40 block text-[10px]">SPEED ADVISORY</span>
                <span className="text-white font-bold text-sm">
                  {selectedWaypoint.recommendedSpeed}
                </span>
              </div>
            </div>
          </div>

          {/* Integrated AI Assistant Q&A Panel (Answering Any Random Question while Navigating) */}
          <div className="liquid-glass rounded-2xl sm:rounded-3xl border border-cyan-500/30 p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white font-sans">
                  ORCA Cognitive Assistant • Live Decision Support & Universal Q&A
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                ACTIVE IN {activeMode.toUpperCase()}
              </span>
            </div>

            {/* AI Response Display */}
            {aiResponse && (
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs sm:text-sm text-white/90 leading-relaxed font-sans whitespace-pre-line max-h-48 overflow-y-auto">
                {aiResponse}
              </div>
            )}

            {/* Suggested quick prompt pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'What is the wave height and sea state at active waypoint?',
                'Convert 18.5 knots to km/h',
                'Explain how ocean tides work',
                'What is 45 * 12?',
                'Is navigation safe near the continental slope?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskAi(q)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* AI Prompt Input Bar */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskAi();
                }}
                placeholder="Ask ORCA any question (marine telemetry, science, mathematics, trivia)..."
                className="flex-1 p-2.5 rounded-xl bg-black/50 border border-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => handleAskAi()}
                disabled={aiLoading || !aiQuestion.trim()}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
              >
                {aiLoading ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ask</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
