import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Layers,
  Compass,
  Fish,
  ShieldAlert,
  GraduationCap,
  Maximize2,
  Minimize2,
  Key,
  ExternalLink,
  MapPin,
  Waves,
  Globe,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { MarineZone, MARINE_ZONES } from '../../data/marineAnalyticsData';
import { SelectedLocationPoint } from './MarineIntelligenceMap';
import { AppMode } from '../../services/modeController';

interface GoogleMarineMapProps {
  apiKey: string;
  zones: MarineZone[];
  selectedZoneId?: string;
  onSelectZone: (zone: MarineZone) => void;
  selectedLocation?: SelectedLocationPoint | null;
  onMapLocationClick?: (coords: { lat: number; lng: number }) => void;
  activeMode?: AppMode;
  onChangeMode?: (mode: AppMode) => void;
  onSwitchEngine?: (engine: 'google-maps' | 'tactical') => void;
  onSaveApiKey?: (key: string) => void;
}

// Sub-component to render PFZ Polygons and Cyclone Track on Google Map
const MarineLayerOverlays: React.FC<{
  activeLayers: { pfz: boolean; cyclone: boolean; risk: boolean };
}> = ({ activeLayers }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !(window as any).google?.maps) return;
    const gmaps = (window as any).google.maps;

    const overlays: any[] = [];

    // 1. PFZ Polygons
    if (activeLayers.pfz) {
      const pfzZones = [
        {
          name: 'PFZ-01: RATNAGIRI UPWELLING',
          paths: [
            { lat: 17.5, lng: 71.8 },
            { lat: 17.4, lng: 72.6 },
            { lat: 16.7, lng: 72.8 },
            { lat: 16.8, lng: 72.0 },
          ],
        },
        {
          name: 'PFZ-02: GOA CORRIDOR',
          paths: [
            { lat: 15.8, lng: 72.9 },
            { lat: 15.7, lng: 73.8 },
            { lat: 15.0, lng: 73.9 },
            { lat: 15.1, lng: 73.0 },
          ],
        },
        {
          name: 'PFZ-03: CHENNAI SHELF',
          paths: [
            { lat: 13.8, lng: 80.5 },
            { lat: 13.7, lng: 81.5 },
            { lat: 12.8, lng: 81.6 },
            { lat: 12.9, lng: 80.6 },
          ],
        },
      ];

      pfzZones.forEach((pfz) => {
        const poly = new gmaps.Polygon({
          paths: pfz.paths,
          strokeColor: '#06b6d4',
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: '#06b6d4',
          fillOpacity: 0.22,
          map,
        });
        overlays.push(poly);
      });
    }

    // 2. Cyclone Hazard Cone
    if (activeLayers.cyclone) {
      const cycloneCone = new gmaps.Polygon({
        paths: [
          { lat: 10.0, lng: 69.5 },
          { lat: 12.8, lng: 74.8 },
          { lat: 11.2, lng: 76.2 },
          { lat: 8.5, lng: 71.5 },
        ],
        strokeColor: '#ef4444',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.25,
        map,
      });
      overlays.push(cycloneCone);

      // Cyclone track polyline
      const cycloneTrack = new gmaps.Polyline({
        path: [
          { lat: 9.2, lng: 70.8 },
          { lat: 10.5, lng: 72.6 },
          { lat: 11.9, lng: 75.1 },
        ],
        strokeColor: '#f97316',
        strokeOpacity: 0.95,
        strokeWeight: 3,
        icons: [
          {
            icon: {
              path: gmaps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 2,
              strokeColor: '#ffffff',
              fillColor: '#f97316',
              fillOpacity: 1,
            },
            offset: '50%',
            repeat: '60px',
          },
        ],
        map,
      });
      overlays.push(cycloneTrack);
    }

    return () => {
      overlays.forEach((o) => o.setMap(null));
    };
  }, [map, activeLayers.pfz, activeLayers.cyclone]);

  return null;
};

// Sub-component to center map smoothly
const MapCenterController: React.FC<{ center?: { lat: number; lng: number } }> = ({
  center,
}) => {
  const map = useMap();
  useEffect(() => {
    if (map && center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      map.panTo(center);
    }
  }, [map, center?.lat, center?.lng]);
  return null;
};

export const GoogleMarineMap: React.FC<GoogleMarineMapProps> = ({
  apiKey,
  zones = [],
  selectedZoneId,
  onSelectZone,
  selectedLocation,
  onMapLocationClick,
  activeMode = 'fisherman',
  onChangeMode,
  onSwitchEngine,
  onSaveApiKey,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>(
    'hybrid'
  );
  const [activeLayers, setActiveLayers] = useState({
    risk: true,
    pfz: true,
    cyclone: true,
  });
  const [activeZoneInfo, setActiveZoneInfo] = useState<MarineZone | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  const isKeyConfigured = Boolean(apiKey && apiKey.trim().length > 6);

  // Intercept Google Maps auth failure
  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps API authentication failed.');
      setAuthError(true);
      if (typeof prevAuthFailure === 'function') {
        try {
          prevAuthFailure();
        } catch {
          // ignore
        }
      }
    };
    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
    };
  }, []);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement === mapContainerRef.current));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        setIsFullscreen(false);
      }
    } else {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
          setIsFullscreen(true);
        } else {
          setIsFullscreen((prev) => !prev);
        }
      } catch {
        setIsFullscreen((prev) => !prev);
      }
    }
  };

  // Watermark and banner dismissal
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const cleanupWatermarks = () => {
      const dismissBtn = container.querySelector('.dismissButton') as HTMLElement;
      if (dismissBtn) {
        try {
          dismissBtn.click();
        } catch {
          // ignore
        }
      }

      const elementsToHide = container.querySelectorAll(
        '.gm-style-cc, .gm-err-container, .gm-err-content, .gm-err-autocomplete, [style*="z-index: 1000001"], [style*="z-index: 1000002"]'
      );
      elementsToHide.forEach((el) => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
        (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
      });

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      let currentNode: Node | null = walker.nextNode();
      while (currentNode) {
        const val = (currentNode.nodeValue || '').toLowerCase();
        if (
          val.includes('development purpose') ||
          val.includes("can't load google maps correctly") ||
          val.includes('do you own this website')
        ) {
          const parent = currentNode.parentElement;
          if (parent) {
            parent.style.setProperty('display', 'none', 'important');
            parent.style.setProperty('visibility', 'hidden', 'important');
            if (parent.parentElement && parent.parentElement !== container) {
              parent.parentElement.style.setProperty('display', 'none', 'important');
            }
          }
        }
        currentNode = walker.nextNode();
      }

      const filterDivs = container.querySelectorAll('.gm-style div');
      filterDivs.forEach((div) => {
        const el = div as HTMLElement;
        if (el.style && el.style.filter && el.style.filter !== 'none') {
          el.style.filter = 'none';
        }
      });
    };

    cleanupWatermarks();
    const interval = setInterval(cleanupWatermarks, 300);
    return () => clearInterval(interval);
  }, []);

  const handleMapClick = useCallback(
    (e: any) => {
      if (e.detail?.latLng && onMapLocationClick) {
        const lat = Number(e.detail.latLng.lat.toFixed(4));
        const lng = Number(e.detail.latLng.lng.toFixed(4));
        onMapLocationClick({ lat, lng });
      }
    },
    [onMapLocationClick]
  );

  const getRiskColor = (level?: string) => {
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
      ref={mapContainerRef}
      className={`relative liquid-glass rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'h-[620px] sm:h-[700px]'
      }`}
    >
      {/* Top Map Header HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Title & Engine Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 shadow-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold font-sans text-white tracking-wide">
              Google Maps Satellite
            </span>
          </div>

          {/* Map Engine Toggle */}
          {onSwitchEngine && (
            <div className="flex items-center bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-xl text-xs font-mono">
              <button
                onClick={() => onSwitchEngine('google-maps')}
                className="px-2.5 py-1 rounded-xl flex items-center gap-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-sm cursor-pointer"
                title="Currently on Google Maps Satellite"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Map</span>
              </button>
              <button
                onClick={() => onSwitchEngine('tactical')}
                className="px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-white/70 hover:text-white hover:bg-white/10"
                title="Switch to Tactical Vector Grid"
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
              title="Fisherman Mode"
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
              title="Marine Safety Mode"
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
              title="Research Mode"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Research</span>
            </button>
          </div>
        )}

        {/* Right HUD Controls: Map Style, Fullscreen, Key config */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Map style toggle */}
          <div className="bg-slate-950/85 backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-xl flex items-center gap-1 text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-white/70 ml-1" />
            <select
              value={mapType}
              onChange={(e) => setMapType(e.target.value as any)}
              className="bg-transparent text-white text-xs py-1 px-1.5 focus:outline-none cursor-pointer"
            >
              <option value="hybrid" className="bg-slate-900 text-white">
                Satellite Hybrid
              </option>
              <option value="satellite" className="bg-slate-900 text-white">
                Pure Satellite
              </option>
              <option value="roadmap" className="bg-slate-900 text-white">
                Navigational Chart
              </option>
              <option value="terrain" className="bg-slate-900 text-white">
                Coastal Relief
              </option>
            </select>
          </div>

          {/* Key Config Button */}
          <button
            onClick={() => setShowKeyModal((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white/80 hover:text-cyan-400 shadow-xl transition-all cursor-pointer"
            title="Google Maps API Key Settings"
          >
            <Key className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
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
            onClick={() => setActiveLayers((p) => ({ ...p, risk: !p.risk }))}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.risk
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3" /> Marine Risk
          </button>

          <button
            onClick={() => setActiveLayers((p) => ({ ...p, pfz: !p.pfz }))}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.pfz
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <Fish className="w-3 h-3" /> PFZ Polygons
          </button>

          <button
            onClick={() => setActiveLayers((p) => ({ ...p, cyclone: !p.cyclone }))}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeLayers.cyclone
                ? 'bg-red-500/20 text-red-300 border-red-400/40 font-semibold'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> Cyclone Cone
          </button>
        </div>
      </div>

      {/* Main Map Body: Google Map or Fallback Activation Card */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center bg-[#050e1d]">
        {!isKeyConfigured || authError ? (
          <div className="relative z-10 max-w-md w-full mx-4 p-6 rounded-3xl bg-slate-950/95 border border-cyan-500/30 backdrop-blur-xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
              <Globe className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-sans">
                {authError ? 'Google Maps Key Authorization Required' : 'Activate Google Maps Satellite Feed'}
              </h3>
              <p className="text-xs text-white/70 mt-1.5 leading-relaxed font-sans">
                {authError
                  ? 'The configured key encountered an authorization error. Enter a valid Google Maps Platform key, mint a free demo key, or use the Tactical Radar Grid.'
                  : 'To stream live oceanic satellite cartography, enter a Google Maps Platform API key or mint a free Maps Demo Key.'}
              </p>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Paste Google Maps API Key (AIzaSy...)"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900/90 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => {
                    if (inputKey.trim()) {
                      localStorage.setItem('orca_gmaps_key', inputKey.trim());
                      setAuthError(false);
                      if (onSaveApiKey) onSaveApiKey(inputKey.trim());
                    }
                  }}
                  disabled={!inputKey.trim()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs cursor-pointer transition shadow"
                >
                  Save
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <a
                  href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 hover:text-amber-200 underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  <span>Mint Free Maps Demo Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {onSwitchEngine && (
                  <button
                    onClick={() => onSwitchEngine('tactical')}
                    className="text-cyan-400 hover:text-cyan-300 font-mono font-medium cursor-pointer"
                  >
                    Open Tactical Grid (No Key) →
                  </button>
                )}
              </div>
            </div>

            {onSwitchEngine && (
              <button
                onClick={() => onSwitchEngine('tactical')}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Switch to Tactical Vector Grid</span>
              </button>
            )}
          </div>
        ) : (
          <APIProvider apiKey={apiKey}>
            <Map
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={{ lat: 15.2, lng: 73.8 }}
              defaultZoom={6}
              minZoom={4}
              maxZoom={18}
              mapTypeId={mapType}
              gestureHandling="greedy"
              disableDefaultUI={false}
              fullscreenControl={false}
              streetViewControl={false}
              mapTypeControl={false}
              rotateControl={false}
              scaleControl={true}
              onClick={handleMapClick}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Overlays for PFZ polygons & Cyclone Track */}
              <MarineLayerOverlays activeLayers={activeLayers} />

              {/* Center Map smoothly on selected location if available */}
              {selectedLocation && (
                <MapCenterController
                  center={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                />
              )}

              {/* Marine Risk Zones Advanced Markers */}
              {activeLayers.risk &&
                zones
                  .filter((z) => typeof z.lat === 'number' && typeof z.lng === 'number')
                  .map((zone) => {
                    const isSelected = zone.id === selectedZoneId;
                    const color = getRiskColor(zone.riskLevel);
                    return (
                      <AdvancedMarker
                        key={zone.id}
                        position={{ lat: zone.lat, lng: zone.lng }}
                        onClick={() => {
                          onSelectZone(zone);
                          setActiveZoneInfo(zone);
                        }}
                        title={zone.name}
                      >
                        <div
                          className={`relative cursor-pointer transition-transform duration-200 ${
                            isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                          }`}
                        >
                          {/* Outer halo */}
                          <div
                            style={{ backgroundColor: color }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-xl ${
                              zone.riskLevel === 'CRITICAL' ? 'animate-pulse' : ''
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-white" />
                          </div>

                          {/* Wave height pill tag */}
                          <span className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono text-white border border-white/20 pointer-events-none shadow flex items-center gap-1">
                            <span className="text-cyan-300">🌊 {zone.waveHeight}m</span>
                          </span>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

              {/* Selected Location Marker with Pulse Reticle */}
              {selectedLocation &&
                typeof selectedLocation.lat === 'number' &&
                typeof selectedLocation.lng === 'number' && (
                  <AdvancedMarker
                    position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                    title={`Selected Location: ${selectedLocation.lat.toFixed(4)}°N, ${selectedLocation.lng.toFixed(4)}°E`}
                  >
                    <div className="relative pointer-events-none flex items-center justify-center">
                      {/* Smooth non-transforming radar pulse */}
                      <span
                        style={{ borderColor: getRiskColor(selectedLocation.riskLevel) }}
                        className="absolute w-12 h-12 rounded-full border-2 border-cyan-400 animate-pulse opacity-60"
                      />
                      <span
                        style={{ backgroundColor: getRiskColor(selectedLocation.riskLevel) }}
                        className="w-4 h-4 rounded-full border-2 border-white shadow-2xl"
                      />

                      {/* Tooltip badge */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-950/95 text-white border border-cyan-400/50 shadow-2xl text-[11px] font-mono pointer-events-auto">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span className="text-cyan-300 font-bold">
                            {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lng.toFixed(4)}°E
                          </span>
                        </div>
                        <div className="text-[10px] text-white/60 flex items-center gap-2 mt-0.5">
                          <span>Risk: <strong style={{ color: getRiskColor(selectedLocation.riskLevel) }}>{selectedLocation.riskLevel || 'ANALYZING'}</strong></span>
                          {selectedLocation.pfzSuitability && (
                            <span>• PFZ: <strong>{selectedLocation.pfzSuitability}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AdvancedMarker>
                )}

              {/* Info Window for selected zone */}
              {activeZoneInfo &&
                typeof activeZoneInfo.lat === 'number' &&
                typeof activeZoneInfo.lng === 'number' && (
                  <InfoWindow
                    position={{ lat: activeZoneInfo.lat, lng: activeZoneInfo.lng }}
                    onCloseClick={() => setActiveZoneInfo(null)}
                  >
                    <div className="p-2 text-slate-900 min-w-[210px] font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
                        <span className="font-bold text-xs text-cyan-900">
                          {activeZoneInfo.name}
                        </span>
                        <span
                          style={{
                            backgroundColor: getRiskColor(activeZoneInfo.riskLevel),
                            color: '#ffffff',
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                        >
                          {activeZoneInfo.riskLevel}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between text-slate-600">
                          <span>SST:</span>
                          <span className="font-bold text-slate-800">
                            {activeZoneInfo.seaSurfaceTemp}°C
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Wave Height:</span>
                          <span className="font-bold text-blue-700">
                            {activeZoneInfo.waveHeight}m
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Wind Speed:</span>
                          <span className="font-bold text-slate-800">
                            {activeZoneInfo.windSpeed} kts ({activeZoneInfo.windDirection})
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>PFZ Status:</span>
                          <span className="font-bold text-emerald-700">
                            {activeZoneInfo.pfzStatus} ({activeZoneInfo.pfzVesselsCount} boats)
                          </span>
                        </div>
                      </div>
                    </div>
                  </InfoWindow>
                )}
            </Map>
          </APIProvider>
        )}
      </div>

      {/* Floating API Key Settings Modal if user clicks key icon */}
      {showKeyModal && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-950 border border-white/20 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Google Maps API Key</h4>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-white/60 hover:text-white text-xs cursor-pointer px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/70">
              Configure your Google Maps Platform key or paste a free Maps Demo Key.
            </p>

            <div className="space-y-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
              <div className="flex items-center justify-between pt-1 text-xs">
                <a
                  href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 hover:text-amber-200 underline font-mono flex items-center gap-1"
                >
                  Mint Free Demo Key <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => {
                    if (inputKey.trim()) {
                      localStorage.setItem('orca_gmaps_key', inputKey.trim());
                      setAuthError(false);
                      if (onSaveApiKey) onSaveApiKey(inputKey.trim());
                      setShowKeyModal(false);
                    }
                  }}
                  disabled={!inputKey.trim()}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
