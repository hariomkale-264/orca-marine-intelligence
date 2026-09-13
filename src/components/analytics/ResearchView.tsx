import React from 'react';
import {
  GraduationCap,
  TrendingUp,
  Activity,
  Layers,
  FileSpreadsheet,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { LocationAnalysisResponse } from '../../services/orcaLocationService';

interface ResearchViewProps {
  data: LocationAnalysisResponse;
}

const CustomResearchTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2.5 rounded-xl bg-slate-950/95 border border-white/20 text-xs font-mono backdrop-blur-md shadow-2xl">
        <p className="text-white/60 font-semibold mb-1 border-b border-white/10 pb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={`tip-${idx}`} className="flex items-center justify-between gap-3 py-0.5">
            <span style={{ color: item.color }}>{item.name}:</span>
            <span className="font-bold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ResearchView: React.FC<ResearchViewProps> = ({ data }) => {
  if (!data || !data.location) return null;
  const { location, parameters, historicalTrend, correlations, agents } = data;
  const latVal = typeof location?.lat === 'number' ? location.lat.toFixed(4) : '18.9220';
  const lngVal = typeof location?.lng === 'number' ? location.lng.toFixed(4) : '72.8346';

  return (
    <div className="space-y-4">
      {/* 7-Day Localized Telemetry Trend */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold font-mono text-white tracking-wide">
              LOCAL 7-DAY HINDCAST & NOWCAST
            </h4>
          </div>
          <span className="text-[10px] font-mono text-white/50">
            Grid Point: {latVal}°N, {lngVal}°E
          </span>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip content={<CustomResearchTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="riskScore" stroke="#ef4444" name="Risk (0-100)" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="waveHeight" stroke="#3b82f6" name="Wave (m)" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="sst" stroke="#f59e0b" name="SST (°C)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cross-Parameter Empirical Correlations */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 shadow-xl">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" />
          <h4 className="text-xs font-bold font-mono text-white tracking-wide">
            EMPIRICAL PARAMETER CORRELATIONS
          </h4>
        </div>

        <div className="space-y-2">
          {correlations.map((c, i) => (
            <div
              key={`corr-${i}`}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
            >
              <div>
                <span className="text-white font-bold">{c.factorA}</span>
                <span className="text-white/40 mx-1.5">vs</span>
                <span className="text-cyan-300 font-bold">{c.factorB}</span>
                <p className="text-[10px] text-white/50 font-sans mt-0.5">{c.note}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                <span className="text-[10px] text-white/40">Pearson r:</span>
                <span
                  className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                    Math.abs(c.correlation) > 0.8
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {c.correlation > 0 ? `+${c.correlation}` : c.correlation}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Oceanographic Anomaly Insights */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono shadow-xl">
        <div className="flex items-center gap-2 text-indigo-300">
          <GraduationCap className="w-4 h-4" />
          <h4 className="font-bold tracking-wide">CLIMATOLOGICAL ANOMALY DECOMPOSITION</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-white/40 block">Mixed Layer Depth</span>
            <span className="text-white font-bold text-xs">38.4 meters</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-white/40 block">Salinity Deviation</span>
            <span className="text-white font-bold text-xs">+0.2 PSU vs Baseline</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-white/40 block">Primary Productivity</span>
            <span className="text-cyan-300 font-bold text-xs">{parameters.chlorophyll} mg/m³</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-white/40 block">Geostrophic Current</span>
            <span className="text-teal-300 font-bold text-xs">{parameters.currentVelocity} knots</span>
          </div>
        </div>
      </div>
    </div>
  );
};
