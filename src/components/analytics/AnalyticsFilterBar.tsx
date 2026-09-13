import React from 'react';
import { Filter, RotateCcw, Download, FileText, Sparkles, MapPin, Calendar, AlertTriangle, Radio } from 'lucide-react';

export interface FilterState {
  region: string;
  dateRange: string;
  riskLevel: string;
  hazardType: string;
  dataSource: string;
}

interface AnalyticsFilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  onExportReport: () => void;
  onDownloadData: () => void;
  onGenerateResearchSummary: () => void;
  totalFilteredZones: number;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onExportReport,
  onDownloadData,
  onGenerateResearchSummary,
  totalFilteredZones,
}) => {
  const isFiltered =
    filters.region !== 'all' ||
    filters.dateRange !== '30d' ||
    filters.riskLevel !== 'all' ||
    filters.hazardType !== 'all' ||
    filters.dataSource !== 'all';

  return (
    <div className="liquid-glass rounded-2xl p-4 border border-white/15 shadow-xl space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                Maritime Intelligence Filters
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                {totalFilteredZones} Active Zones
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-sans">
              Filter multi-source telemetry for Government, Fisheries, and Disaster Command
            </p>
          </div>
        </div>

        {/* Export & Research Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onGenerateResearchSummary}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate Research Summary</span>
          </button>

          <button
            onClick={onExportReport}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-white/70" />
            <span>Export Report</span>
          </button>

          <button
            onClick={onDownloadData}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-white/70" />
            <span>Download Data</span>
          </button>
        </div>
      </div>

      {/* Filter Select Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        {/* Region */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase text-white/60 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" /> Region
          </label>
          <select
            value={filters.region}
            onChange={(e) => onFilterChange('region', e.target.value)}
            className="w-full bg-slate-900/90 text-xs text-white border border-white/20 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer transition-colors"
          >
            <option value="all">All Marine Regions</option>
            <option value="Konkan">Konkan Coast</option>
            <option value="Goa">Goa Shelf</option>
            <option value="Karnataka">Karnataka Corridor</option>
            <option value="Kerala">Kerala (Malabar)</option>
            <option value="Tamil Nadu">Tamil Nadu (Coromandel)</option>
            <option value="Lakshadweep">Lakshadweep Sea</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase text-white/60 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400" /> Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
            className="w-full bg-slate-900/90 text-xs text-white border border-white/20 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer transition-colors"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="1y">Last 1 Year</option>
          </select>
        </div>

        {/* Risk Level */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase text-white/60 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Risk Level
          </label>
          <select
            value={filters.riskLevel}
            onChange={(e) => onFilterChange('riskLevel', e.target.value)}
            className="w-full bg-slate-900/90 text-xs text-white border border-white/20 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer transition-colors"
          >
            <option value="all">All Risk Levels</option>
            <option value="LOW">Low (Safe)</option>
            <option value="MODERATE">Moderate (Caution)</option>
            <option value="HIGH">High (Warning)</option>
            <option value="CRITICAL">Critical (Emergency)</option>
          </select>
        </div>

        {/* Hazard Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase text-white/60 flex items-center gap-1">
            <Radio className="w-3 h-3 text-rose-400" /> Hazard Type
          </label>
          <select
            value={filters.hazardType}
            onChange={(e) => onFilterChange('hazardType', e.target.value)}
            className="w-full bg-slate-900/90 text-xs text-white border border-white/20 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer transition-colors"
          >
            <option value="all">All Marine Hazards</option>
            <option value="Cyclone">Cyclone</option>
            <option value="High Waves">High Waves</option>
            <option value="Strong Winds">Strong Winds</option>
            <option value="Heavy Rain">Heavy Rain</option>
            <option value="Storm Surge">Storm Surge</option>
            <option value="Rough Sea">Rough Sea</option>
            <option value="Temp Anomaly">Temperature Anomaly</option>
          </select>
        </div>

        {/* Data Source */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase text-white/60 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" /> Data Source
          </label>
          <select
            value={filters.dataSource}
            onChange={(e) => onFilterChange('dataSource', e.target.value)}
            className="w-full bg-slate-900/90 text-xs text-white border border-white/20 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer transition-colors"
          >
            <option value="all">All Sources (Integrated)</option>
            <option value="INCOIS">INCOIS Gateway</option>
            <option value="IMD">IMD Doppler / Weather</option>
            <option value="ISRO">ISRO Oceansat-3</option>
            <option value="NIOT">NIOT Moored Buoys</option>
          </select>
        </div>

        {/* Reset Action */}
        <div className="flex items-end">
          <button
            onClick={onResetFilters}
            disabled={!isFiltered}
            className="w-full py-1.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-mono text-white/80 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
