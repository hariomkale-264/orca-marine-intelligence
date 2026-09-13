import React from 'react';
import {
  GitCompare,
  X,
  Trash2,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Waves,
  Wind,
  Thermometer,
  Fish,
} from 'lucide-react';
import { LocationAnalysisResponse } from '../../services/orcaLocationService';

interface LocationComparisonModalProps {
  locations: LocationAnalysisResponse[];
  activeLocationId?: string;
  onSelectActive: (loc: LocationAnalysisResponse) => void;
  onRemoveLocation: (loc: LocationAnalysisResponse) => void;
  onClose: () => void;
}

export const LocationComparisonModal: React.FC<LocationComparisonModalProps> = ({
  locations,
  activeLocationId,
  onSelectActive,
  onRemoveLocation,
  onClose,
}) => {
  if (locations.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-slide-up">
      <div className="relative w-full max-w-5xl liquid-glass rounded-3xl border border-white/20 shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white tracking-wide">
                MULTI-LOCATION MARINE COMPARISON
              </h3>
              <p className="text-xs text-white/50 font-sans">
                Side-by-side 7-agent consensus & hydro-meteorological benchmarking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Content Table / Cards Grid */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations
              .filter((loc) => loc?.location && typeof loc.location.lat === 'number' && typeof loc.location.lng === 'number')
              .map((loc, idx) => {
                const label = String.fromCharCode(65 + idx); // Location A, B, C...
                const lat = loc.location.lat;
                const lng = loc.location.lng;
                const isSelected = activeLocationId === `${lat}_${lng}`;

                return (
                  <div
                    key={`${lat}_${lng}`}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg'
                        : 'bg-black/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Top Row: Tag & Delete */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs flex items-center justify-center">
                            {label}
                          </span>
                          <span className="text-xs font-bold font-mono text-white truncate">
                            {lat}°N, {lng}°E
                          </span>
                        </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onRemoveLocation(loc)}
                          className="p-1 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove from comparison"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Nearest coast */}
                    <div className="text-[11px] font-mono text-white/60 mb-3 truncate">
                      {loc.location.nearestCoast}
                    </div>

                    {/* Metric Rows */}
                    <div className="space-y-2 text-xs font-mono border-t border-b border-white/10 py-3 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" /> Risk Score
                        </span>
                        <span
                          className={`font-bold ${
                            loc.parameters.riskScore >= 70
                              ? 'text-rose-400'
                              : loc.parameters.riskScore >= 45
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {loc.parameters.riskScore}/100 ({loc.consensus.overallRisk})
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/50 flex items-center gap-1">
                          <Waves className="w-3 h-3 text-blue-400" /> Wave Height
                        </span>
                        <span className="text-blue-300 font-bold">{loc.parameters.waveHeight} m</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/50 flex items-center gap-1">
                          <Wind className="w-3 h-3 text-teal-400" /> Wind Speed
                        </span>
                        <span className="text-teal-300 font-bold">{loc.parameters.windSpeed} km/h</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/50 flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-amber-400" /> SST
                        </span>
                        <span className="text-amber-300 font-bold">{loc.parameters.sst} °C</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/50 flex items-center gap-1">
                          <Fish className="w-3 h-3 text-cyan-400" /> PFZ Suitability
                        </span>
                        <span className="text-cyan-300 font-bold">{loc.parameters.pfzSuitability}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/50">Agent Agreement</span>
                        <span className="text-white font-bold">{loc.consensus.agentAgreement.ratioText}</span>
                      </div>
                    </div>

                    {/* Recommendation summary */}
                    <div className="text-[11px] font-sans text-white/70 leading-relaxed mb-4">
                      {loc.consensus.recommendedAction}
                    </div>
                  </div>

                  {/* Select active button */}
                  <button
                    onClick={() => {
                      onSelectActive(loc);
                      onClose();
                    }}
                    className={`w-full py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {isSelected ? 'Active Analysis Point' : 'Load in Map & Drawer'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50">
          <span>{locations.length} pinned marine location(s)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
