import React, { useRef, useEffect, useState } from 'react';
import { NavWaypoint, LiveVessel } from './GoogleMapsNavigator.tsx';
import { Radio, Crosshair, Maximize2, Minimize2 } from 'lucide-react';

interface MarineRadarMapProps {
  waypoints: NavWaypoint[];
  vessels: LiveVessel[];
  activeVesselId: string;
  selectedWaypoint: NavWaypoint;
  onSelectWaypoint: (wp: NavWaypoint) => void;
  onSelectVessel: (vessel: LiveVessel) => void;
  onAddCustomWaypoint?: (coord: { lat: number; lng: number }) => void;
  isLiveTracking: boolean;
  onToggleLiveTracking: () => void;
}

export const MarineRadarMap: React.FC<MarineRadarMapProps> = ({
  waypoints,
  vessels,
  activeVesselId,
  selectedWaypoint,
  onSelectWaypoint,
  onSelectVessel,
  onAddCustomWaypoint,
  isLiveTracking,
  onToggleLiveTracking,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const radarAngleRef = useRef<number>(0);
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement === containerRef.current));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        setIsFullscreen(false);
      }
    } else {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
          setIsFullscreen(true);
        } else {
          setIsFullscreen((prev) => !prev);
        }
      } catch {
        setIsFullscreen((prev) => !prev);
      }
    }
  };

  // Helper to convert Lat/Lng to Canvas XY
  const centerLat = typeof activeVessel?.lat === 'number' ? activeVessel.lat : 18.922;
  const centerLng = typeof activeVessel?.lng === 'number' ? activeVessel.lng : 72.8346;
  const scale = 1400; // pixels per degree

  const toXY = (lat: number, lng: number, width: number, height: number) => {
    const x = width / 2 + (lng - centerLng) * scale;
    const y = height / 2 - (lat - centerLat) * scale;
    return { x, y };
  };

  const toLatLng = (x: number, y: number, width: number, height: number) => {
    const lng = centerLng + (x - width / 2) / scale;
    const lat = centerLat - (y - height / 2) / scale;
    return { lat, lng };
  };

  // Canvas render loop with rotating radar sweep
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. Deep Ocean Background
      const oceanGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        20,
        centerX,
        centerY,
        Math.max(width, height) / 1.5
      );
      oceanGrad.addColorStop(0, '#061325');
      oceanGrad.addColorStop(0.6, '#030a16');
      oceanGrad.addColorStop(1, '#01050c');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Nautical Coordinate Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Range Rings (Nautical Distance)
      const rings = [60, 120, 180, 240, 300];
      rings.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ring label
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.font = '10px monospace';
        ctx.fillText(`${(idx + 1) * 3} NM`, centerX + r - 25, centerY - 5);
      });

      // 4. Crosshair axes
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // 5. Rotating Radar Sweep Beam
      if (isLiveTracking) {
        radarAngleRef.current = (radarAngleRef.current + 0.02) % (Math.PI * 2);
        const angle = radarAngleRef.current;
        const maxRadius = Math.max(width, height) / 1.4;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        const sweepGrad = ctx.createLinearGradient(0, 0, maxRadius, 0);
        sweepGrad.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
        sweepGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.08)');
        sweepGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, maxRadius, -0.3, 0);
        ctx.closePath();
        ctx.fillStyle = sweepGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(maxRadius, 0);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      }

      // 6. Draw Waypoint Route Polyline
      const validWaypoints = (waypoints || []).filter(
        (wp) => wp && typeof wp.lat === 'number' && typeof wp.lng === 'number'
      );
      if (validWaypoints.length > 1) {
        ctx.beginPath();
        validWaypoints.forEach((wp, idx) => {
          const pt = toXY(wp.lat, wp.lng, width, height);
          if (idx === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        });
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 7. Draw Waypoint Markers
      validWaypoints.forEach((wp, idx) => {
        const pt = toXY(wp.lat, wp.lng, width, height);
        const isSelected = selectedWaypoint?.id === wp.id;

        // Outer halo
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isSelected ? 12 : 8, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fill();

        // Core marker
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#38bdf8' : '#ffffff';
        ctx.fill();

        // Label
        ctx.fillStyle = isSelected ? '#38bdf8' : '#ffffff';
        ctx.font = '11px monospace';
        ctx.fillText(`WP-${idx + 1}: ${wp.name}`, pt.x + 12, pt.y + 4);
      });

      // 8. Draw Live AIS Vessels
      const validVessels = (vessels || []).filter(
        (v) => v && typeof v.lat === 'number' && typeof v.lng === 'number'
      );
      validVessels.forEach((v) => {
        const pt = toXY(v.lat, v.lng, width, height);
        const isUserVessel = v.id === 'user-vessel';
        const isSelected = v.id === activeVesselId;

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate((v.heading * Math.PI) / 180);

        // Vessel heading arrow / polygon
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(8, 8);
        ctx.lineTo(0, 4);
        ctx.lineTo(-8, 8);
        ctx.closePath();

        ctx.fillStyle = isUserVessel ? '#10b981' : isSelected ? '#38bdf8' : '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();

        // Pulse ring around own ship
        if (isUserVessel && isLiveTracking) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Vessel Label
        ctx.fillStyle = isUserVessel ? '#34d399' : '#e2e8f0';
        ctx.font = '10px monospace';
        ctx.fillText(`${v.name} (${v.speed} kts)`, pt.x + 12, pt.y - 8);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [waypoints, vessels, activeVesselId, selectedWaypoint, isLiveTracking, centerLat, centerLng]);

  // Click on canvas to inspect or add waypoint
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked near a vessel
    for (const v of (vessels || [])) {
      if (!v || typeof v.lat !== 'number' || typeof v.lng !== 'number') continue;
      const pt = toXY(v.lat, v.lng, canvas.width, canvas.height);
      const dist = Math.hypot(clickX - pt.x, clickY - pt.y);
      if (dist < 20) {
        onSelectVessel(v);
        return;
      }
    }

    // Check if clicked near a waypoint
    for (const wp of (waypoints || [])) {
      if (!wp || typeof wp.lat !== 'number' || typeof wp.lng !== 'number') continue;
      const pt = toXY(wp.lat, wp.lng, canvas.width, canvas.height);
      const dist = Math.hypot(clickX - pt.x, clickY - pt.y);
      if (dist < 18) {
        onSelectWaypoint(wp);
        return;
      }
    }

    // Otherwise add custom waypoint at sea coordinate
    if (onAddCustomWaypoint) {
      const coord = toLatLng(clickX, clickY, canvas.width, canvas.height);
      onAddCustomWaypoint(coord);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
          : 'h-[520px] sm:h-[600px] rounded-2xl sm:rounded-3xl'
      } overflow-hidden border border-white/20 shadow-2xl bg-black flex flex-col transition-all duration-200`}
    >
      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveTracking ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="text-white font-semibold">
            {isLiveTracking ? 'RADAR SWEEP: ACTIVE' : 'RADAR: STANDBY'}
          </span>
          <span className="text-white/40">|</span>
          <span className="text-cyan-400">
            RANGE: 25 NM • HDG: {activeVessel.heading}°
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleLiveTracking}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-lg ${
              isLiveTracking
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/30'
                : 'bg-black/80 text-white/80 border-white/20 hover:bg-white/10'
            }`}
            title={isLiveTracking ? 'Pause radar sweep & AIS tracking' : 'Resume radar sweep & AIS tracking'}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveTracking ? 'animate-pulse text-cyan-400' : ''}`} />
            <span>{isLiveTracking ? 'Pause Sweep' : 'Resume Sweep'}</span>
          </button>

          {/* Fullscreen Button */}
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

      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Bottom HUD */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-[11px] font-mono text-white/80 shadow-lg flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click anywhere to plot new waypoint or click vessel to track</span>
        </div>

        <div className="pointer-events-auto bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-[11px] font-mono text-white/80 shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Own Ship</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>AIS Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Waypoint</span>
          </div>
        </div>
      </div>
    </div>
  );
};
