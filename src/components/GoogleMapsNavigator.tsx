import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Navigation,
  Layers,
  Radio,
  Trash2,
  Key,
  ExternalLink,
  AlertTriangle,
  Compass,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export interface NavWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  depth: string;
  hazardRisk: 'Low' | 'Moderate' | 'High';
  recommendedSpeed: string;
}

export interface LiveVessel {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  speed: number; // knots
  heading: number; // degrees
  depth: string;
  callSign: string;
  mmsi: string;
  status: 'Underway' | 'Engaged in Fishing' | 'Moored' | 'Stationary';
}

interface GoogleMapsNavigatorProps {
  apiKey: string;
  waypoints: NavWaypoint[];
  vessels: LiveVessel[];
  activeVesselId: string;
  selectedWaypoint: NavWaypoint;
  onSelectWaypoint: (wp: NavWaypoint) => void;
  onSelectVessel: (vessel: LiveVessel) => void;
  onAddCustomWaypoint?: (coord: { lat: number; lng: number }) => void;
  onRemoveWaypoint?: (id: string) => void;
  onSwitchToRadar?: () => void;
  onSaveApiKey?: (key: string) => void;
  isLiveTracking: boolean;
  onToggleLiveTracking: () => void;
  activeRole: string;
}

// Inner component to draw SVG/Canvas Polyline on Google Maps
const MapRoutePolyline: React.FC<{ waypoints: NavWaypoint[] }> = ({ waypoints }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || waypoints.length < 2 || !(window as any).google?.maps) return;

    const path = waypoints.map((wp) => ({ lat: wp.lat, lng: wp.lng }));

    const polyline = new (window as any).google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#06b6d4',
      strokeOpacity: 0.9,
      strokeWeight: 3.5,
      icons: [
        {
          icon: {
            path: (window as any).google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 2.5,
            strokeColor: '#ffffff',
            fillColor: '#06b6d4',
            fillOpacity: 1,
          },
          offset: '50%',
          repeat: '100px',
        },
      ],
    });

    polyline.setMap(map);

    return () => {
      polyline.setMap(null);
    };
  }, [map, waypoints]);

  return null;
};

// Inner controller to pan/center map when selected vessel changes
const MapCenterController: React.FC<{ center?: { lat: number; lng: number } }> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (map && center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      map.panTo(center);
    }
  }, [map, center?.lat, center?.lng]);

  return null;
};

export const GoogleMapsNavigator: React.FC<GoogleMapsNavigatorProps> = ({
  apiKey,
  waypoints,
  vessels,
  activeVesselId,
  selectedWaypoint,
  onSelectWaypoint,
  onSelectVessel,
  onAddCustomWaypoint,
  onRemoveWaypoint,
  onSwitchToRadar,
  onSaveApiKey,
  isLiveTracking,
  onToggleLiveTracking,
  activeRole,
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('hybrid');
  const [activeInfoWindow, setActiveInfoWindow] = useState<{
    type: 'waypoint' | 'vessel';
    data: any;
  } | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [authError, setAuthError] = useState(false);

  // Validate that key exists and is non-empty
  const isKeyConfigured = Boolean(apiKey && apiKey.trim().length > 6);

  // Intercept Google Maps authentication error to prevent unhandled console crash
  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps API authentication failed (ApiProjectMapError).');
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

  const fallbackVessel: LiveVessel = (vessels && vessels[0]) || {
    id: 'user-vessel',
    name: 'INS Sagarmala (ORCA-01)',
    type: 'Research / Patrol Vessel',
    lat: 18.922,
    lng: 72.8346,
    speed: 14.5,
    heading: 245,
    depth: '42.5 m',
    callSign: 'VWSM-9',
    mmsi: '419000123',
    status: 'Underway',
  };
  const activeVessel = (vessels && vessels.find((v) => v.id === activeVesselId)) || fallbackVessel;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        // Fallback for sandboxed iframe environments
        setIsFullscreen((prev) => !prev);
      }
    }
  };

  // Actively remove 'For development purposes only' watermark, banners, and dimming filters
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const cleanupWatermarks = () => {
      // 1. Auto-dismiss error dialog if triggered
      const dismissBtn = container.querySelector('.dismissButton') as HTMLElement;
      if (dismissBtn) {
        try {
          dismissBtn.click();
        } catch {
          // ignore
        }
      }

      // 2. Hide common Google Maps dev watermark classes & overlays
      const elementsToHide = container.querySelectorAll(
        '.gm-style-cc, .gm-err-container, .gm-err-content, .gm-err-autocomplete, [style*="z-index: 1000001"], [style*="z-index: 1000002"], [style*="background-color: rgba(0, 0, 0, 0.5)"], [style*="background-color: rgba(255, 255, 255, 0.5)"]'
      );
      elementsToHide.forEach((el) => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
        (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
        (el as HTMLElement).style.setProperty('opacity', '0', 'important');
        (el as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
      });

      // 3. Scan DOM nodes for text containing "development purpose" and hide parents
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );
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
            parent.style.setProperty('opacity', '0', 'important');
            if (parent.parentElement && parent.parentElement !== container) {
              parent.parentElement.style.setProperty('display', 'none', 'important');
            }
          }
        }
        currentNode = walker.nextNode();
      }

      // 4. Remove any grayscale / dark tint filters placed on map canvas tiles
      const filterDivs = container.querySelectorAll('.gm-style div');
      filterDivs.forEach((div) => {
        const el = div as HTMLElement;
        if (el.style && el.style.filter && el.style.filter !== 'none') {
          el.style.filter = 'none';
        }
      });

      // 5. Hide Google Maps native fullscreen and streetview buttons so they do not collide or render behind our HUD controls
      const nativeControls = container.querySelectorAll(
        '.gm-fullscreen-control, button[title*="fullscreen" i], button[aria-label*="fullscreen" i], button[title*="Toggle fullscreen" i], .gm-svpc'
      );
      nativeControls.forEach((el) => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
      });
    };

    cleanupWatermarks();

    const observer = new MutationObserver(() => {
      cleanupWatermarks();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    const interval = setInterval(cleanupWatermarks, 250);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleMapClick = useCallback(
    (e: any) => {
      if (e.detail?.latLng && onAddCustomWaypoint) {
        onAddCustomWaypoint({
          lat: e.detail.latLng.lat,
          lng: e.detail.latLng.lng,
        });
      }
    },
    [onAddCustomWaypoint]
  );

  return (
    <div
      ref={mapContainerRef}
      className={`relative w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
          : 'h-[520px] sm:h-[600px] rounded-2xl sm:rounded-3xl'
      } overflow-hidden border border-white/20 shadow-2xl bg-slate-950 flex flex-col transition-all duration-200`}
    >
      {/* Top Map Action HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left HUD: Live GPS Status */}
        <div className="flex items-center gap-2 pointer-events-auto bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveTracking ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="text-white font-semibold">
            {isLiveTracking ? 'LIVE AIS GPS: ACTIVE' : 'AIS TRACKING: PAUSED'}
          </span>
          <span className="text-white/40">|</span>
          <span className="text-cyan-400">
            {activeVessel && typeof activeVessel.lat === 'number'
              ? `${activeVessel.lat.toFixed(4)}°N, ${activeVessel.lng.toFixed(4)}°E`
              : '18.9220°N, 72.8346°E'}
          </span>
        </div>

        {/* Right HUD: Controls (Map style toggle, live toggle & fullscreen) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Map style toggle */}
          <div className="bg-black/80 backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-lg flex items-center gap-1 text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-white/70 ml-1" />
            <select
              value={mapType}
              onChange={(e) => setMapType(e.target.value as any)}
              className="bg-transparent text-white text-xs py-1 px-1.5 focus:outline-none cursor-pointer"
            >
              <option value="hybrid" className="bg-slate-900 text-white">
                Satellite + Marine Grid
              </option>
              <option value="satellite" className="bg-slate-900 text-white">
                Pure Satellite
              </option>
              <option value="roadmap" className="bg-slate-900 text-white">
                Navigational Chart
              </option>
              <option value="terrain" className="bg-slate-900 text-white">
                Coastal Relief (Terrain)
              </option>
            </select>
          </div>

          {/* Live Tracking Toggle Button */}
          <button
            onClick={onToggleLiveTracking}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-lg ${
              isLiveTracking
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/30'
                : 'bg-black/80 text-white/80 border-white/20 hover:bg-white/10'
            }`}
            title={isLiveTracking ? 'Pause AIS real-time tracking' : 'Resume AIS real-time tracking'}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveTracking ? 'animate-pulse text-cyan-400' : ''}`} />
            <span>{isLiveTracking ? 'Pause AIS' : 'Resume AIS'}</span>
          </button>

          {/* Dedicated Full Screen Button */}
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 border border-white/20 bg-black/80 hover:bg-black text-white/90 shadow-lg cursor-pointer transition-all"
            title={isFullscreen ? 'Exit Full Screen' : 'Toggle Full Screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Google Maps Wrapper using @vis.gl/react-google-maps or Fallback Activation Card */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center">
        {!isKeyConfigured || authError ? (
          <div className="relative z-10 max-w-md w-full mx-4 p-6 rounded-2xl bg-black/85 border border-cyan-500/30 backdrop-blur-xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
              <Key className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-sans">
                {authError ? 'Google Maps Key Verification Required' : 'Activate Google Maps Satellite Feed'}
              </h3>
              <p className="text-xs text-white/70 mt-1.5 leading-relaxed font-sans">
                {authError
                  ? 'The configured key encountered an authorization error (ApiProjectMapError). Enter a valid Google Maps Platform key, mint a free Maps Demo Key, or switch to Tactical Radar.'
                  : 'To stream Google Maps live satellite and oceanic cartography without error, an authorized Google Maps Platform API key or free Maps Demo Key is required.'}
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

                {onSwitchToRadar && (
                  <button
                    onClick={onSwitchToRadar}
                    className="text-cyan-400 hover:text-cyan-300 font-mono font-medium cursor-pointer"
                  >
                    Open Radar (No Key) →
                  </button>
                )}
              </div>
            </div>

            {onSwitchToRadar && (
              <button
                onClick={onSwitchToRadar}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Switch to Tactical Marine Radar & ECDIS</span>
              </button>
            )}
          </div>
        ) : (
          <APIProvider apiKey={apiKey}>
          <Map
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            defaultCenter={{ lat: activeVessel?.lat ?? 18.922, lng: activeVessel?.lng ?? 72.8346 }}
            defaultZoom={11}
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
            {/* Center controller */}
            <MapCenterController center={{ lat: activeVessel?.lat ?? 18.922, lng: activeVessel?.lng ?? 72.8346 }} />

            {/* Polyline connecting active waypoints */}
            <MapRoutePolyline waypoints={waypoints} />

            {/* Waypoint Advanced Markers */}
            {waypoints
              .filter((wp) => wp && typeof wp.lat === 'number' && typeof wp.lng === 'number')
              .map((wp, idx) => {
              const isSelected = selectedWaypoint?.id === wp.id;
              return (
                <AdvancedMarker
                  key={wp.id}
                  position={{ lat: wp.lat, lng: wp.lng }}
                  onClick={() => {
                    onSelectWaypoint(wp);
                    setActiveInfoWindow({ type: 'waypoint', data: wp });
                  }}
                  title={wp.name}
                >
                  <div
                    className={`relative cursor-pointer transition-transform duration-200 ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shadow-lg border-2 ${
                        isSelected
                          ? 'bg-cyan-400 text-black border-white ring-4 ring-cyan-400/40'
                          : 'bg-slate-900 text-white border-cyan-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white border border-white/20 pointer-events-none shadow">
                      {wp.name}
                    </span>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Live Vessels Advanced Markers */}
            {vessels
              .filter((v) => v && typeof v.lat === 'number' && typeof v.lng === 'number')
              .map((v) => {
              const isUserVessel = v.id === 'user-vessel';
              const isSelected = v.id === activeVesselId;

              return (
                <AdvancedMarker
                  key={v.id}
                  position={{ lat: v.lat, lng: v.lng }}
                  onClick={() => {
                    onSelectVessel(v);
                    setActiveInfoWindow({ type: 'vessel', data: v });
                  }}
                  title={`${v.name} (${v.type})`}
                >
                  <div
                    className={`relative cursor-pointer transition-all duration-300 ${
                      isSelected ? 'scale-125 z-40' : 'hover:scale-110 z-30'
                    }`}
                  >
                    {/* Vessel Heading Vector Icon */}
                    <div
                      style={{ transform: `rotate(${v.heading}deg)` }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-2xl border-2 transition-transform duration-500 ${
                        isUserVessel
                          ? 'bg-emerald-500 text-black border-white shadow-[0_0_20px_rgba(16,185,129,0.7)]'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-400'
                      }`}
                    >
                      <Navigation className="w-5 h-5 fill-current" />
                    </div>

                    {/* Vessel Radar Pulse Ping */}
                    {isLiveTracking && isUserVessel && (
                      <span className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping pointer-events-none" />
                    )}

                    {/* Vessel Name Tag */}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/90 text-[10px] font-mono font-medium text-white border border-white/20 pointer-events-none flex items-center gap-1 shadow">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isUserVessel ? 'bg-emerald-400' : 'bg-cyan-400'
                        }`}
                      />
                      {v.name} ({v.speed} kts)
                    </span>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Info Window for selected Waypoint */}
            {activeInfoWindow?.type === 'waypoint' &&
              activeInfoWindow.data &&
              typeof activeInfoWindow.data.lat === 'number' &&
              typeof activeInfoWindow.data.lng === 'number' && (
              <InfoWindow
                position={{
                  lat: activeInfoWindow.data.lat,
                  lng: activeInfoWindow.data.lng,
                }}
                onCloseClick={() => setActiveInfoWindow(null)}
              >
                <div className="p-2 text-slate-900 min-w-[200px] font-sans">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
                    <span className="font-bold text-xs text-cyan-800">
                      {activeInfoWindow.data.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      WAYPOINT
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Coordinates:</span>
                      <span className="font-bold">
                        {activeInfoWindow.data.lat.toFixed(4)}°N, {activeInfoWindow.data.lng.toFixed(4)}°E
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Chart Sounding:</span>
                      <span className="font-bold text-blue-700">{activeInfoWindow.data.depth}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Hazard Risk:</span>
                      <span
                        className={`font-bold ${
                          activeInfoWindow.data.hazardRisk === 'High'
                            ? 'text-red-600'
                            : activeInfoWindow.data.hazardRisk === 'Moderate'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {activeInfoWindow.data.hazardRisk}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Rec. Speed:</span>
                      <span className="font-bold">{activeInfoWindow.data.recommendedSpeed}</span>
                    </div>
                  </div>

                  {onRemoveWaypoint && waypoints.length > 2 && (
                    <button
                      onClick={() => {
                        onRemoveWaypoint(activeInfoWindow.data.id);
                        setActiveInfoWindow(null);
                      }}
                      className="mt-2 w-full py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-medium flex items-center justify-center gap-1 border border-red-200 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove from Route
                    </button>
                  )}
                </div>
              </InfoWindow>
            )}

            {/* Info Window for selected Vessel */}
            {activeInfoWindow?.type === 'vessel' &&
              activeInfoWindow.data &&
              typeof activeInfoWindow.data.lat === 'number' &&
              typeof activeInfoWindow.data.lng === 'number' && (
              <InfoWindow
                position={{
                  lat: activeInfoWindow.data.lat,
                  lng: activeInfoWindow.data.lng,
                }}
                onCloseClick={() => setActiveInfoWindow(null)}
              >
                <div className="p-2 text-slate-900 min-w-[220px] font-sans">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2">
                    <div>
                      <span className="font-bold text-xs text-cyan-900 block">
                        {activeInfoWindow.data.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {activeInfoWindow.data.type}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      AIS LIVE
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Speed Over Ground:</span>
                      <span className="font-bold text-cyan-800">
                        {activeInfoWindow.data.speed} kts
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Course Over Ground:</span>
                      <span className="font-bold">{activeInfoWindow.data.heading}°</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>MMSI:</span>
                      <span className="font-bold">{activeInfoWindow.data.mmsi}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Draft / Depth:</span>
                      <span className="font-bold">{activeInfoWindow.data.depth}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Status:</span>
                      <span className="font-bold text-slate-800">
                        {activeInfoWindow.data.status}
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

      {/* Bottom Floating Legend & Hint */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-[11px] font-mono text-white/80 shadow-lg flex items-center gap-3">
          <span className="text-cyan-400 font-bold">CLICK MAP:</span>
          <span>Click anywhere on sea to plot new navigation waypoints</span>
        </div>

        <div className="pointer-events-auto bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-[11px] font-mono text-white/80 shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Own Ship</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>AIS Fleet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Waypoints</span>
          </div>
        </div>
      </div>
    </div>
  );
};
