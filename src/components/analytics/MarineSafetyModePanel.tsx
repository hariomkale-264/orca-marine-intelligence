import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Wind,
  Waves,
  Compass,
  Radio,
  Clock,
  CheckCircle2,
  Navigation2,
  Anchor,
  FileText,
} from 'lucide-react';
import {
  MarineSafetyResult,
  SafetySeverity,
} from '../../services/modeController';

interface MarineSafetyModePanelProps {
  data: MarineSafetyResult;
  locationName: string;
}

export const MarineSafetyModePanel: React.FC<MarineSafetyModePanelProps> = ({
  data,
  locationName,
}) => {
  const {
    riskLevel,
    riskScore,
    alertHeadline,
    weatherSummary,
    oceanConditions,
    windConditions,
    navigationHazards,
    restrictedZones,
    safetyRecommendations,
    coastGuardNotice,
    freshnessSummary,
    conclusion,
  } = data;

  const getSeverityStyle = (level: SafetySeverity) => {
    switch (level) {
      case 'DANGER':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      case 'WARNING':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'CAUTION':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'SAFE':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
  };

  return (
    <div className="space-y-4 animate-fade-slide-up">
      {/* 1. SEVERITY & RISK SCORE HERO */}
      <div className={`p-4 rounded-2xl border ${getSeverityStyle(riskLevel)} shadow-xl space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              COASTAL SAFETY DIRECTIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/70">RISK INDEX:</span>
            <span className="text-sm sm:text-base font-black font-mono px-3 py-1 rounded-xl bg-black/50 border border-white/20">
              {riskScore}/100 • {riskLevel}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-base font-bold text-white tracking-wide">{alertHeadline}</h4>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">{weatherSummary}</p>
        </div>
      </div>

      {/* 2. OCEAN & WIND PARAMETERS (Split Deck) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px] font-bold">
            <Waves className="w-3.5 h-3.5" /> HYDRODYNAMICS
          </div>
          <div className="space-y-1 text-white/80">
            <div className="flex justify-between">
              <span className="text-white/40">Wave Height:</span>
              <span className="font-mono font-bold text-white">{oceanConditions.waveHeight} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Swell Period:</span>
              <span className="font-mono text-white">{oceanConditions.swellPeriod} s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Drift Current:</span>
              <span className="font-mono text-white">{oceanConditions.surfaceCurrent} kts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">SST:</span>
              <span className="font-mono text-white">{oceanConditions.sst} °C</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px] font-bold">
            <Wind className="w-3.5 h-3.5" /> WIND & SQUALL
          </div>
          <div className="space-y-1 text-white/80">
            <div className="flex justify-between">
              <span className="text-white/40">Wind Speed:</span>
              <span className="font-mono font-bold text-white">{windConditions.speedKmh} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">In Knots:</span>
              <span className="font-mono text-white">{windConditions.speedKnots} kts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Gust Peaks:</span>
              <span className="font-mono text-white">{windConditions.gustsKmh} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Vector:</span>
              <span className="font-mono text-white">{windConditions.direction}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION HAZARDS & RESTRICTED ZONES */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950/60 to-black/60 border border-white/15 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-white/90">
          <Navigation2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase">
            RESTRICTED ZONES & MARITIME HAZARDS
          </span>
        </div>

        <div className="space-y-1.5">
          {restrictedZones.map((z, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs"
            >
              <div>
                <span className="text-white font-medium block">{z.name}</span>
                <span className="text-[10px] text-white/40">Classification: {z.type}</span>
              </div>
              <span className="font-mono text-cyan-300 font-bold text-[11px]">
                {z.distanceNm} nm away
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-white/10 space-y-1">
          <span className="text-[10px] font-mono text-white/40 block">LOCALIZED RISK FACTORS:</span>
          {navigationHazards.map((h, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-xs text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SAFETY RECOMMENDATIONS & COAST GUARD DIRECTIVE */}
      <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-cyan-300">
          <Anchor className="w-4 h-4" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase">
            AUTHORITY DIRECTIVES & HARBOR PROTOCOLS
          </span>
        </div>

        <div className="space-y-1.5">
          {safetyRecommendations.map((r, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs text-white bg-black/40 p-2 rounded-xl border border-white/10"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>

        <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] font-mono text-white/70 flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{coastGuardNotice}</span>
        </div>
      </div>

      {/* 5. DATA FRESHNESS & CONCLUSION */}
      <div className="p-4 rounded-2xl bg-black/50 border border-white/15 space-y-3">
        <div className="flex items-center justify-between text-xs text-white/60 font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Radar: {freshnessSummary.lastRadarPing}</span>
          </div>
          <div>Buoy: {freshnessSummary.lastBuoyTelemetry}</div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
          "{conclusion.text}"
        </div>
      </div>
    </div>
  );
};
