import React, { useState } from 'react';
import {
  X,
  MapPin,
  RefreshCw,
  GitCompare,
  BookmarkPlus,
  BookmarkCheck,
  Compass,
  Fish,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  AlertOctagon,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LocationAnalysisResponse,
} from '../../services/orcaLocationService';
import {
  ModeOrchestratorResult,
  AppMode,
  MODE_CONFIG,
} from '../../services/modeController';
import { FishermanModePanel } from './FishermanModePanel';
import { MarineSafetyModePanel } from './MarineSafetyModePanel';
import { ResearchModePanel } from './ResearchModePanel';

export interface LocationAnalysisPanelProps {
  data?: LocationAnalysisResponse | null;
  orchestratedResult: ModeOrchestratorResult;
  isOpen: boolean;
  onClose: () => void;
  isAnalyzing: boolean;
  analyzingStep: number;
  onReAnalyze: () => void;
  onPinForComparison?: (data: LocationAnalysisResponse) => void;
  isPinned?: boolean;
  totalPinnedCount?: number;
  onOpenComparison?: () => void;
  activeMode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  simulatePfzUnavailable?: boolean;
  onToggleSimulatePfzUnavailable?: () => void;
  simulateOutdatedWeather?: boolean;
  onToggleSimulateOutdatedWeather?: () => void;
}

export const LocationAnalysisPanel: React.FC<LocationAnalysisPanelProps> = ({
  data,
  orchestratedResult,
  isOpen,
  onClose,
  isAnalyzing,
  analyzingStep,
  onReAnalyze,
  onPinForComparison,
  isPinned = false,
  totalPinnedCount = 0,
  onOpenComparison,
  activeMode,
  onChangeMode,
  simulatePfzUnavailable = false,
  onToggleSimulatePfzUnavailable,
  simulateOutdatedWeather = false,
  onToggleSimulateOutdatedWeather,
}) => {
  const [showSimControls, setShowSimControls] = useState(false);

  if (!isOpen || !orchestratedResult) return null;

  const { location, requiredAgentIds, skippedAgentIds, fisherman, marineSafety, research } =
    orchestratedResult;

  const latDisplay =
    typeof location?.lat === 'number' ? location.lat.toFixed(4) : '18.9220';
  const lngDisplay =
    typeof location?.lng === 'number' ? location.lng.toFixed(4) : '72.8346';

  const currentModeConfig = MODE_CONFIG[activeMode] || MODE_CONFIG.fisherman;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Slide-in Drawer Container */}
      <aside
        className={`fixed lg:absolute top-auto bottom-0 lg:top-0 right-0 z-50 w-full lg:w-[500px] xl:w-[540px] h-[90vh] lg:h-full liquid-glass rounded-t-3xl lg:rounded-l-3xl lg:rounded-r-none border-t lg:border-t-0 lg:border-l border-white/20 shadow-2xl flex flex-col transition-all duration-300 transform translate-y-0 overflow-hidden bg-slate-950/95 lg:bg-slate-950/90 backdrop-blur-xl`}
      >
        {/* Top Handle for mobile dragging feel */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-2 lg:hidden" />

        {/* Header Bar matching Specification */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold font-mono text-white tracking-wide truncate">
                  Location Intelligence
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-white/70">
                <span className="text-cyan-300 font-bold">
                  {latDisplay}° N, {lngDisplay}° E
                </span>
                <span className="text-white/30">•</span>
                <span className="text-white/50 truncate">{currentModeConfig.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Multi-Location Comparison Trigger */}
            {onOpenComparison && (
              <button
                onClick={onOpenComparison}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-cyan-300 border border-white/10 transition-colors cursor-pointer relative"
                title="Compare Selected Locations"
              >
                <GitCompare className="w-4 h-4" />
                {totalPinnedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black font-mono font-bold text-[9px] flex items-center justify-center">
                    {totalPinnedCount}
                  </span>
                )}
              </button>
            )}

            {/* Pin location */}
            {onPinForComparison && data && (
              <button
                onClick={() => onPinForComparison(data)}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isPinned
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/15'
                }`}
                title="Pin location"
              >
                {isPinned ? (
                  <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                ) : (
                  <BookmarkPlus className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Re-analyze */}
            <button
              onClick={onReAnalyze}
              disabled={isAnalyzing}
              className="p-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold border border-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Agent Orchestration"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Close Analysis Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs (Mode determines information priority) */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-white/5 space-y-2 shrink-0 bg-black/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
              ACTIVE USER MODE:
            </span>
            {/* Simulation controls toggle */}
            <button
              onClick={() => setShowSimControls((s) => !s)}
              className="text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{showSimControls ? 'Hide Test Feeds' : 'Test Failure / Outdated Feeds'}</span>
              {showSimControls ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
            {/* Fisherman Mode */}
            <button
              onClick={() => onChangeMode('fisherman')}
              className={`px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'fisherman'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Fish className="w-3.5 h-3.5" />
              <span className="truncate">Fisherman</span>
            </button>

            {/* Marine Safety Mode */}
            <button
              onClick={() => onChangeMode('marine-safety')}
              className={`px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'marine-safety'
                  ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="truncate">Marine Safety</span>
            </button>

            {/* Research / Analysis Mode */}
            <button
              onClick={() => onChangeMode('research')}
              className={`px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'research'
                  ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="truncate">Research</span>
            </button>
          </div>

          {/* Collapsible Failure Simulation Tools */}
          {showSimControls && (
            <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] font-mono space-y-2 animate-fade-slide-up">
              <span className="text-white/40 block">TEST AGENT RESILIENCE (SPEC SECTION 7 & 8):</span>
              <div className="flex flex-wrap gap-2">
                {onToggleSimulatePfzUnavailable && (
                  <button
                    onClick={onToggleSimulatePfzUnavailable}
                    className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      simulatePfzUnavailable
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                        : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                    }`}
                  >
                    {simulatePfzUnavailable ? '✓ Simulating: PFZ Unavailable' : 'Test: PFZ Data Unavailable'}
                  </button>
                )}

                {onToggleSimulateOutdatedWeather && (
                  <button
                    onClick={onToggleSimulateOutdatedWeather}
                    className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      simulateOutdatedWeather
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                    }`}
                  >
                    {simulateOutdatedWeather ? '✓ Simulating: Outdated Weather (7h)' : 'Test: Outdated Weather Feed'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Agents Execution Summary Pill */}
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1">
            <span>
              Required Agents: <strong className="text-white">{requiredAgentIds.length}/7</strong>
            </span>
            <span>
              Unneeded for Mode: <strong className="text-white/60">{skippedAgentIds.length}</strong>
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {/* Geographical metadata box */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-[11px] font-mono text-white/70 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-white/40">Region: </span>
              <span className="text-white font-medium">{location.region}</span>
            </div>
            <div>
              <span className="text-white/40">Coast: </span>
              <span className="text-white font-medium">{location.nearestCoast} ({location.distanceToCoastNm} nm)</span>
            </div>
          </div>

          {/* Analyzing Progressive Loader */}
          {isAnalyzing ? (
            <div className="p-8 rounded-2xl bg-black/40 border border-cyan-500/30 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="space-y-1">
                <span className="text-sm font-bold font-mono text-white block">
                  ORCHESTRATING SPECIALIZED AGENTS
                </span>
                <span className="text-xs text-cyan-300 font-mono">
                  Filtering {requiredAgentIds.length} required agents for {currentModeConfig.label}...
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* MODE SPECIFIC RENDER */}
              {activeMode === 'fisherman' && fisherman && (
                <FishermanModePanel
                  data={fisherman}
                  locationName={location.nearestCoast}
                />
              )}

              {activeMode === 'marine-safety' && marineSafety && (
                <MarineSafetyModePanel
                  data={marineSafety}
                  locationName={location.nearestCoast}
                />
              )}

              {activeMode === 'research' && research && (
                <ResearchModePanel
                  data={research}
                  locationName={location.nearestCoast}
                />
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};
