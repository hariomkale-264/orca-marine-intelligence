import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Fish,
  Clock,
  AlertTriangle,
  Compass,
  Wind,
  Waves,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  FishermanResult,
  FreshnessStatus,
  SafetySeverity,
} from '../../services/modeController';

interface FishermanModePanelProps {
  data: FishermanResult;
  locationName: string;
  onNavigateToPfz?: () => void;
}

export const FishermanModePanel: React.FC<FishermanModePanelProps> = ({
  data,
  locationName,
  onNavigateToPfz,
}) => {
  const { safety, pfz, freshness, conclusion } = data;

  const getSafetyBadge = (level: SafetySeverity) => {
    switch (level) {
      case 'DANGER':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          badgeText: 'DANGER',
          subtext: 'High hazard sea state — Departure NOT advised',
          icon: ShieldAlert,
          dotColor: 'bg-rose-500',
        };
      case 'WARNING':
        return {
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
          badgeText: 'WARNING',
          subtext: 'Rough water & strong wind — Stay close to shore',
          icon: AlertTriangle,
          dotColor: 'bg-orange-500',
        };
      case 'CAUTION':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          badgeText: 'CAUTION',
          subtext: 'Moderate chop & elevated wind — Watch weather closely',
          icon: AlertTriangle,
          dotColor: 'bg-amber-400',
        };
      case 'SAFE':
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          badgeText: 'SAFE',
          subtext: 'Favorable sea conditions — Safe for small boats',
          icon: ShieldCheck,
          dotColor: 'bg-emerald-400',
        };
    }
  };

  const getFreshnessStyle = (status: FreshnessStatus) => {
    switch (status) {
      case 'FRESH':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'RECENT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'AGING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'OUTDATED':
      case 'UNKNOWN':
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
    }
  };

  const safetyStyle = getSafetyBadge(safety.level);
  const SafetyIcon = safetyStyle.icon;

  return (
    <div className="space-y-4 animate-fade-slide-up">
      {/* ========================================================
          A. SAFETY ALERT (Primary High-Visibility Card)
      ======================================================== */}
      <div className={`p-4 rounded-2xl border ${safetyStyle.bg} shadow-lg transition-all space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SafetyIcon className="w-6 h-6 shrink-0" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              SAFETY ALERT
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: 'currentColor' }} />
            <span className="text-sm sm:text-base font-black font-mono px-3 py-1 rounded-xl bg-black/40 border border-white/20 tracking-wider">
              {safetyStyle.badgeText}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-base font-bold text-white tracking-wide">
            {safety.headline}
          </h4>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            {safety.details}
          </p>
        </div>

        {/* Hazard Bullet Points */}
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
            Observed Marine Conditions:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {safety.hazards.map((h, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 text-xs text-white/90 bg-black/30 px-2.5 py-1 rounded-lg border border-white/10"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="truncate">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          B. PFZ — POTENTIAL FISHING ZONE
      ======================================================== */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-black/40 to-slate-900/40 border border-cyan-500/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-cyan-300">
            <Fish className="w-5 h-5" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              PFZ — POTENTIAL FISHING ZONE
            </span>
          </div>

          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
              pfz.status === 'PFZ AVAILABLE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : pfz.status === 'PFZ NEARBY'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : pfz.status === 'DATA UNAVAILABLE'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-white/10 text-white/60 border-white/20'
            }`}
          >
            {pfz.status}
          </span>
        </div>

        {pfz.status === 'DATA UNAVAILABLE' ? (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed">
              <span className="font-bold block">PFZ Data Unavailable</span>
              Satellite ground telemetry is temporarily offline. Fish school aggregation
              cannot be guaranteed for this position.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-0.5">
              <span className="text-[10px] text-white/50 font-mono block">DISTANCE TO PFZ</span>
              <span className="text-base sm:text-lg font-bold font-mono text-cyan-300">
                {pfz.distanceKm} km
              </span>
              <span className="text-[10px] text-white/40 block">
                {pfz.distanceKm <= 6.5 ? 'Inside active zone' : 'From selected pin'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-0.5">
              <span className="text-[10px] text-white/50 font-mono block">FISHING SUITABILITY</span>
              <span
                className={`text-base sm:text-lg font-bold font-mono ${
                  pfz.suitability === 'High'
                    ? 'text-emerald-400'
                    : pfz.suitability === 'Moderate'
                    ? 'text-cyan-300'
                    : 'text-amber-400'
                }`}
              >
                {pfz.suitability}
              </span>
              <span className="text-[10px] text-white/40 block">
                Confidence: {(pfz.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Species & Chlorophyll indicators */}
        {pfz.status !== 'DATA UNAVAILABLE' && (
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
            <div>
              <span className="text-white/40">Target Catch: </span>
              <span className="text-white font-medium">
                {pfz.targetSpecies.slice(0, 3).join(', ')}
              </span>
            </div>
            <div className="font-mono text-[11px] text-cyan-400">
              Chlorophyll: {pfz.chlorophyllMgM3} mg/m³
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          C. DATA FRESHNESS (First-Class Information)
      ======================================================== */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/15 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              DATA FRESHNESS
            </span>
          </div>

          {freshness.hasOutdatedWarning ? (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <AlertTriangle className="w-3 h-3" />
              ⚠ Data may be outdated
            </span>
          ) : (
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Real-time streams active
            </span>
          )}
        </div>

        {/* Per-source freshness list */}
        <div className="space-y-2">
          {freshness.sources.map((src, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
            >
              <div>
                <span className="font-semibold text-white block">{src.category}</span>
                <span className="text-[10px] text-white/40">{src.sourceName}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-white/90 text-xs">{src.age}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${getFreshnessStyle(
                    src.status
                  )}`}
                >
                  {src.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {freshness.hasOutdatedWarning && (
          <p className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 leading-relaxed">
            ⚠ One or more data feeds have not refreshed in over 2 hours. Local conditions
            at sea may differ from forecast models.
          </p>
        )}
      </div>

      {/* ========================================================
          D. FINAL AI CONCLUSION (Short, Clear & Actionable)
      ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-cyan-950/50 to-black/60 border border-cyan-400/40 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-cyan-300">
            <Compass className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              FINAL AI CONCLUSION
            </span>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              conclusion.confidence === 'High'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : conclusion.confidence === 'Moderate'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {conclusion.confidence === 'Low' ? '⚠ ' : ''}Confidence: {conclusion.confidence} ({(conclusion.confidenceScore * 100).toFixed(0)}%)
          </span>
        </div>

        {/* The Actionable Synthesis Prompt Output */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white/95 leading-relaxed font-sans">
          "{conclusion.summary}"
        </div>

        {/* 4 Core Fisherman Decision Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-white/50 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" /> 1. IS IT SAFE?
            </span>
            <p className="text-white/90 text-xs leading-snug">
              {conclusion.answers.isItSafe}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-white/50 font-mono flex items-center gap-1">
              <Fish className="w-3 h-3 text-cyan-400" /> 2. IS THERE A PFZ?
            </span>
            <p className="text-white/90 text-xs leading-snug">
              {conclusion.answers.isTherePfz}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] text-white/50 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> 3. HOW FRESH IS THE DATA?
            </span>
            <p className="text-white/90 text-xs leading-snug">
              {conclusion.answers.howFreshIsData}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
            <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-cyan-400" /> 4. WHAT SHOULD I DO?
            </span>
            <p className="text-cyan-100 font-semibold text-xs leading-snug">
              {conclusion.answers.whatShouldIDo}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
