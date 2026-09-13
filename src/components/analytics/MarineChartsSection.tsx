import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  AlertOctagon,
  Thermometer,
  Fish,
  PieChart as PieIcon,
  CalendarDays,
  Info,
  MapPin,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  RISK_TREND_7D,
  RISK_TREND_30D,
  RISK_TREND_3M,
  RISK_TREND_1Y,
  HAZARDS_BY_CATEGORY,
  SST_TREND_DATA,
  PFZ_BY_REGION,
  RISK_DISTRIBUTION,
  MONTHLY_ALERTS,
} from '../../data/marineAnalyticsData';

interface MarineChartsSectionProps {
  selectedLocation?: {
    lat: number;
    lng: number;
    nearestCoast?: string;
    riskScore?: number;
    sst?: number;
    waveHeight?: number;
  } | null;
  onResetLocation?: () => void;
}

// Custom dark/glass tooltip for recharts
const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 border border-white/20 rounded-xl p-2.5 shadow-2xl text-xs font-mono backdrop-blur-md">
        <p className="text-white/60 font-semibold mb-1 border-b border-white/10 pb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={`tip-${idx}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5" style={{ color: item.color || item.fill }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              {item.name}:
            </span>
            <span className="font-bold text-white">
              {item.value} {unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const MarineChartsSection: React.FC<MarineChartsSectionProps> = ({
  selectedLocation,
  onResetLocation,
}) => {
  // Chart 1 timeframe state
  const [riskTimeframe, setRiskTimeframe] = useState<'7d' | '30d' | '3m' | '1y'>('30d');

  const getRiskTrendData = () => {
    let baseData;
    switch (riskTimeframe) {
      case '7d':
        baseData = RISK_TREND_7D;
        break;
      case '30d':
        baseData = RISK_TREND_30D;
        break;
      case '3m':
        baseData = RISK_TREND_3M;
        break;
      case '1y':
      default:
        baseData = RISK_TREND_1Y;
        break;
    }

    if (!selectedLocation || selectedLocation.riskScore === undefined) {
      return baseData;
    }

    // Scale trend lines around selected location's risk score
    const targetScore = selectedLocation.riskScore;
    return baseData.map((d, i, arr) => {
      const offset = (i - arr.length + 1) * 2.2;
      return {
        ...d,
        riskScore: Math.min(98, Math.max(10, Math.round(targetScore + offset))),
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Contextual Banner for Selected Location */}
      {selectedLocation && typeof selectedLocation.lat === 'number' && typeof selectedLocation.lng === 'number' && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-400/40 flex flex-wrap items-center justify-between gap-3 shadow-xl animate-fade-slide-up">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <MapPin className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-cyan-300">
                  Analytics for Selected Location:
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-white font-bold">
                  {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lng.toFixed(4)}°E
                </span>
              </div>
              <p className="text-[11px] text-white/60 font-sans mt-0.5">
                {selectedLocation.nearestCoast || 'Deep Ocean Grid'} • Charts synchronized with point-specific telemetry
              </p>
            </div>
          </div>

          {onResetLocation && (
            <button
              onClick={onResetLocation}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset to Basin View</span>
            </button>
          )}
        </div>
      )}

      {/* 2-Column Grid for Charts 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================
            CHART 1: MARINE RISK TREND
        ======================================================== */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white font-sans">
                  Marine Risk Trend
                </h3>
              </div>
              <p className="text-xs text-white/50 font-sans mt-0.5">
                Aggregate composite risk score (0-100) based on swell, winds, and cyclonic vortex
              </p>
            </div>

            {/* Timeframe selector toggle */}
            <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/15 self-start sm:self-auto">
              {(['7d', '30d', '3m', '1y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setRiskTimeframe(tf)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                    riskTimeframe === tf
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : tf === '3m' ? '3 Months' : '1 Year'}
                </button>
              ))}
            </div>
          </div>

          {/* Chart container */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getRiskTrendData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip content={<CustomTooltip unit="/ 100" />} />
                <Line
                  type="monotone"
                  dataKey="riskScore"
                  name="Risk Score"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ fill: '#f43f5e', r: 4, stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#f43f5e' }}
                />
                <Line
                  type="monotone"
                  dataKey="criticalZonesCount"
                  name="High-Risk Hotspots"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#fbbf24', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Threshold: &gt;70 indicates mandatory advisory</span>
            <span className="text-rose-400 font-semibold">Latest: 71 / 100</span>
          </div>
        </div>

        {/* ========================================================
            CHART 2: HAZARDS BY CATEGORY
        ======================================================== */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                Marine Hazards by Category
              </h3>
            </div>
            <p className="text-xs text-white/50 font-sans mt-0.5">
              Active hazardous meteorological and oceanographic event detections
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HAZARDS_BY_CATEGORY} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip content={<CustomTooltip unit="events" />} />
                <Bar
                  dataKey="count"
                  name="Detected Events"
                  radius={[6, 6, 0, 0]}
                  fill="#06b6d4"
                >
                  {HAZARDS_BY_CATEGORY.map((entry, index) => {
                    const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6'];
                    return <Cell key={`hazard-cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Primary Driver: Monsoon Deep Trough</span>
            <span className="text-cyan-400 font-semibold">Total: 106 Events</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid for Charts 3 & 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================
            CHART 3: SEA SURFACE TEMPERATURE TREND
        ======================================================== */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Thermometer className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                Sea Surface Temperature Trend
              </h3>
            </div>
            <p className="text-xs text-white/50 font-sans mt-0.5">
              Monthly SST variation against 30-year climatological baseline
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SST_TREND_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="sstGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  domain={[26, 31]}
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip content={<CustomTooltip unit="°C" />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', paddingTop: 8 }} />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  name="Observed SST"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#sstGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="historicalBaseline"
                  name="30-Yr Baseline"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Peak Month: May (29.6°C)</span>
            <span className="text-amber-400 font-semibold">Mean Anomaly: +0.52°C</span>
          </div>
        </div>

        {/* ========================================================
            CHART 4: POTENTIAL FISHING ZONES (PFZ) BY REGION
        ======================================================== */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                <Fish className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                Potential Fishing Zones by Region
              </h3>
            </div>
            <p className="text-xs text-white/50 font-sans mt-0.5">
              Active INCOIS-validated pelagic zones and estimated harvest potential
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PFZ_BY_REGION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="region"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip content={<CustomTooltip unit="Zones" />} />
                <Bar
                  dataKey="activeZones"
                  name="Active PFZ Zones"
                  fill="#06b6d4"
                  radius={[6, 6, 0, 0]}
                >
                  {PFZ_BY_REGION.map((entry, index) => (
                    <Cell
                      key={`pfz-cell-${index}`}
                      fill={entry.activeZones >= 7 ? '#22d3ee' : entry.activeZones >= 4 ? '#0ea5e9' : '#0284c7'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Highest Concentration: Konkan (9) & Tamil Nadu (8)</span>
            <span className="text-cyan-300 font-semibold">Total: 28 Active Zones</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid for Charts 5 & 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================
            CHART 5: RISK DISTRIBUTION
        ======================================================== */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                Marine Zone Risk Distribution
              </h3>
            </div>
            <p className="text-xs text-white/50 font-sans mt-0.5">
              Proportionate safety classification across 156 monitored coastal sectors
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={RISK_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                >
                  {RISK_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip unit="sectors" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Donut Legend */}
          <div className="mt-2 pt-3 border-t border-white/10 grid grid-cols-4 gap-2 text-center text-xs font-mono">
            {RISK_DISTRIBUTION.map((item) => (
              <div key={item.name} className="p-1.5 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-white/80">{item.name}</span>
                </div>
                <div className="font-bold text-white text-sm mt-0.5">{item.value}</div>
                <span className="text-[10px] text-white/40">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================
            CHART 6: MONTHLY ALERT TREND
        ======================================================== */}
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                Marine Alerts by Month
              </h3>
            </div>
            <p className="text-xs text-white/50 font-sans mt-0.5">
              Historical distribution showing Southwest Monsoon and Post-Monsoon cyclonic spikes
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_ALERTS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip content={<CustomTooltip unit="alerts" />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', paddingTop: 8 }} />
                <Area
                  type="monotone"
                  dataKey="totalAlerts"
                  name="Total Marine Alerts"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#alertGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="cycloneAlerts"
                  name="Cyclone Warnings"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Primary Peak: June (58 alerts)</span>
            <span className="text-blue-400 font-semibold">Seasonal Pattern: SW Monsoon</span>
          </div>
        </div>
      </div>
    </div>
  );
};
