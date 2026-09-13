import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Microscope,
  Fish,
  Wind,
  ThermometerSnowflake,
  Sprout,
  Activity,
  ArrowUpRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  SST_VS_FISHING,
  WAVE_VS_WIND,
  TEMP_ANOMALIES,
  CHLOROPHYLL_ZONES,
  ENVIRONMENTAL_INDICATORS,
} from '../../data/marineAnalyticsData';

// Custom Scatter Tooltip
const ScatterCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-cyan-500/30 rounded-xl p-3 shadow-2xl text-xs font-mono backdrop-blur-md">
        <p className="text-cyan-300 font-bold border-b border-white/10 pb-1 mb-1.5">{data.zone}</p>
        <div className="space-y-1 text-white/80">
          <div className="flex justify-between gap-3">
            <span>Sea Surface Temp:</span>
            <span className="text-amber-400 font-bold">{data.sst}°C</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Fishing Activity Index:</span>
            <span className="text-cyan-400 font-bold">{data.fishingActivityIndex} / 100</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Primary Species:</span>
            <span className="text-white font-bold">{data.species}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Chlorophyll-a:</span>
            <span className="text-emerald-400 font-bold">{data.chlorophyll} mg/m³</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ResearchInsightsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Microscope className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-sans tracking-tight">
              Research Insights
            </h2>
            <p className="text-xs text-white/50 font-sans">
              Advanced oceanographic correlation models for marine biologists and environmental researchers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
            5 Analytical Correlation Models
          </span>
        </div>
      </div>

      {/* Grid: 1. SST vs Fishing Activity (Scatter) & 2. Wave vs Wind */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. SST vs Fishing Activity (SCATTER PLOT) */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Fish className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                  1. SST vs Fishing Activity (Scatter Correlation)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                r = 0.84 Peak
              </span>
            </div>
            <p className="text-xs text-white/50 font-sans">
              Demonstrates biological aggregation within the optimal thermal window (28.2°C – 29.5°C)
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  type="number"
                  dataKey="sst"
                  name="Sea Surface Temperature"
                  unit="°C"
                  domain={[26, 32]}
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  label={{ value: 'SST (°C)', position: 'bottom', fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="fishingActivityIndex"
                  name="Activity Index"
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  label={{ value: 'Activity Index', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <ZAxis type="number" dataKey="chlorophyll" range={[60, 220]} name="Chlorophyll" />
                <Tooltip content={<ScatterCustomTooltip />} />
                <Scatter
                  name="Marine Sectors"
                  data={SST_VS_FISHING}
                  fill="#06b6d4"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Dot diameter reflects Chlorophyll-a density</span>
            <span className="text-cyan-300 font-semibold">Optimum Range: 28.6°C</span>
          </div>
        </div>

        {/* 2. Wave Height vs Wind Speed */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                  2. Wave Height vs Wind Speed (Pierson-Moskowitz Index)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-400/30">
                Beaufort 2 - 8
              </span>
            </div>
            <p className="text-xs text-white/50 font-sans">
              Wind-generated wave development and sea state boundary conditions
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WAVE_VS_WIND} margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="windSpeed"
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  label={{ value: 'Wind Speed (kts)', position: 'bottom', fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  label={{ value: 'Wave Height (m)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    `${value} ${name === 'Significant Wave' ? 'm' : ''}`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(2, 6, 23, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="waveHeight"
                  name="Significant Wave"
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  dot={{ fill: '#2dd4bf', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Critical threshold: &gt;3.0m at 25+ kts</span>
            <span className="text-teal-300 font-semibold">Max Wave: 4.1m (Kochi)</span>
          </div>
        </div>
      </div>

      {/* Grid: 3. Temperature Anomalies & 4. Chlorophyll / Ocean Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Temperature Anomalies */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                  3. Sea Surface Temperature Anomalies (°C Deviation)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Marine Heatwave Alerts
              </span>
            </div>
            <p className="text-xs text-white/50 font-sans">
              Climatological thermal anomaly by sector (ISRO Oceansat-3 & NOAA SST)
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TEMP_ANOMALIES} margin={{ top: 10, right: 10, bottom: 25, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="sector"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  domain={[0, 2.5]}
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  unit="°C"
                />
                <Tooltip
                  formatter={(value: any) => [`+${value}°C anomaly`, 'Deviation']}
                  contentStyle={{
                    backgroundColor: 'rgba(2, 6, 23, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="anomaly" radius={[6, 6, 0, 0]}>
                  {TEMP_ANOMALIES.map((entry, index) => (
                    <Cell
                      key={`anomaly-cell-${index}`}
                      fill={entry.anomaly >= 1.5 ? '#ef4444' : entry.anomaly >= 0.8 ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Severe threshold: &gt;+1.0°C sustained anomaly</span>
            <span className="text-rose-400 font-semibold">Max: +1.9°C (Malabar)</span>
          </div>
        </div>

        {/* 4. Chlorophyll / Ocean Productivity */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                  4. Chlorophyll-a & Ocean Productivity (OCM-3)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Phytoplankton Bloom Index
              </span>
            </div>
            <p className="text-xs text-white/50 font-sans">
              Surface Chlorophyll concentration (mg/m³) tracking coastal nutrient upwelling
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHLOROPHYLL_ZONES} margin={{ top: 10, right: 10, bottom: 25, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="zone"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  unit=" mg/m³"
                />
                <Tooltip
                  formatter={(value: any) => [`${value} mg/m³`, 'Chlorophyll-a']}
                  contentStyle={{
                    backgroundColor: 'rgba(2, 6, 23, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="chlorophyll" fill="#10b981" radius={[6, 6, 0, 0]}>
                  {CHLOROPHYLL_ZONES.map((entry, index) => (
                    <Cell
                      key={`chloro-cell-${index}`}
                      fill={entry.chlorophyll >= 2.5 ? '#10b981' : entry.chlorophyll >= 1.5 ? '#34d399' : '#06b6d4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Eutrophic status: &gt;2.5 mg/m³</span>
            <span className="text-emerald-300 font-semibold">Peak: 3.1 mg/m³ (Gulf of Mannar)</span>
          </div>
        </div>
      </div>

      {/* 5. Marine Environmental Changes (Indicator Dashboard Cards) */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-sans">
              5. Marine Environmental Changes & Ocean Health Indicators
            </h3>
          </div>
          <span className="text-xs font-mono text-white/50">
            Long-term decadal monitoring series
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {ENVIRONMENTAL_INDICATORS.map((ind, idx) => (
            <div
              key={`env-ind-${idx}`}
              className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-400/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono font-bold text-white/80 uppercase">
                    {ind.parameter}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      ind.status === 'Stable'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : ind.status === 'Caution'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {ind.status}
                  </span>
                </div>
                <div className="text-xl font-bold font-sans text-white tracking-tight my-1">
                  {ind.currentValue}
                </div>
                <div className="text-[11px] font-mono text-cyan-400">
                  Rate: {ind.changeRate}
                </div>
                <div className="text-[10px] font-mono text-white/40 mt-0.5">
                  Baseline: {ind.baseline}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-white/60 leading-tight">
                {ind.impactAssessment}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
