import React from 'react';
import {
  AlertTriangle,
  Fish,
  Thermometer,
  ShieldCheck,
  Radio,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';

interface KpiData {
  activeRiskAlerts: number;
  activePfzZones: number;
  avgSst: number;
  monitoredZones: number;
  highRiskZones: number;
  dataSourcesOnline: { online: number; total: number };
}

interface AnalyticsKpiSectionProps {
  kpis: KpiData;
  onKpiClick?: (metricId: string) => void;
}

export const AnalyticsKpiSection: React.FC<AnalyticsKpiSectionProps> = ({ kpis, onKpiClick }) => {
  const cards = [
    {
      id: 'kpi-risk-alerts',
      title: 'ACTIVE RISK ALERTS',
      value: kpis.activeRiskAlerts,
      unit: 'ALERTS',
      subtitle: '4 Critical gale & squall warnings',
      change: '+2 in past 6h',
      isIncreaseBad: true,
      trendUp: true,
      icon: AlertTriangle,
      color: 'from-rose-500/20 to-orange-500/10',
      borderColor: 'border-rose-500/30',
      iconColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'kpi-pfz-zones',
      title: 'ACTIVE PFZ ZONES',
      value: kpis.activePfzZones,
      unit: 'ZONES',
      subtitle: 'Potential fishing zones identified',
      change: '+4 high-yield fronts',
      isIncreaseBad: false,
      trendUp: true,
      icon: Fish,
      color: 'from-cyan-500/20 to-teal-500/10',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    },
    {
      id: 'kpi-avg-sst',
      title: 'AVG SEA SURFACE TEMP',
      value: `${kpis.avgSst.toFixed(1)}°C`,
      unit: 'CELSIUS',
      subtitle: '+0.6°C thermal anomaly vs baseline',
      change: '+0.3°C this week',
      isIncreaseBad: true,
      trendUp: true,
      icon: Thermometer,
      color: 'from-amber-500/20 to-yellow-500/10',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'kpi-monitored-zones',
      title: 'MONITORED MARINE ZONES',
      value: kpis.monitoredZones,
      unit: 'SECTORS',
      subtitle: 'Continuous coastal & EEZ radar grid',
      change: '100% telemetry coverage',
      isIncreaseBad: false,
      trendUp: false,
      icon: Layers,
      color: 'from-blue-500/20 to-indigo-500/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    },
    {
      id: 'kpi-high-risk',
      title: 'HIGH-RISK ZONES',
      value: kpis.highRiskZones,
      unit: 'HOTSPOTS',
      subtitle: 'Sectors requiring vessel advisory',
      change: 'Malabar & S. Karnataka',
      isIncreaseBad: true,
      trendUp: true,
      icon: ShieldCheck,
      color: 'from-orange-500/20 to-rose-500/10',
      borderColor: 'border-orange-500/30',
      iconColor: 'text-orange-400',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      id: 'kpi-data-sources',
      title: 'DATA SOURCES ONLINE',
      value: `${kpis.dataSourcesOnline.online}/${kpis.dataSourcesOnline.total}`,
      unit: 'ACTIVE',
      subtitle: 'ISRO, INCOIS, IMD, NIOT Buoys',
      change: '99.2% network uptime',
      isIncreaseBad: false,
      trendUp: false,
      icon: Radio,
      color: 'from-emerald-500/20 to-teal-500/10',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onKpiClick?.(card.id)}
            className={`group relative liquid-glass rounded-2xl p-4 border ${card.borderColor} bg-gradient-to-br ${card.color} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between`}
          >
            {/* Top row: title & icon */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono tracking-wider text-white/60 uppercase font-semibold leading-tight">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg bg-black/40 border border-white/10 ${card.iconColor} group-hover:scale-110 transition-transform duration-200 shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Value display */}
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-tight">
                  {card.value}
                </span>
                <span className="text-[10px] font-mono text-white/40">{card.unit}</span>
              </div>
            </div>

            {/* Bottom row: trend & subtitle */}
            <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border ${card.badgeBg}`}>
                  {card.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <TrendingUp className="w-3 h-3" />
                  )}
                  {card.change}
                </span>
              </div>
              <p className="text-[10px] text-white/50 leading-tight truncate" title={card.subtitle}>
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
