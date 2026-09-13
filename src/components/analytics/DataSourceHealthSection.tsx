import React, { useState } from 'react';
import {
  Radio,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Wifi,
  Clock,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { DATA_SOURCES, DataSourceStatus } from '../../data/marineAnalyticsData';

export const DataSourceHealthSection: React.FC = () => {
  const [sources, setSources] = useState<DataSourceStatus[]>(DATA_SOURCES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('Just now');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSources((prev) =>
        prev.map((s) => ({
          ...s,
          lastUpdated: 'Just now',
          latencyMs: Math.floor(30 + Math.random() * 40),
        }))
      );
      setIsRefreshing(false);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    }, 600);
  };

  const getStatusBadge = (status: DataSourceStatus['status']) => {
    switch (status) {
      case 'ONLINE':
        return {
          label: 'ONLINE',
          className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400 animate-ping',
          icon: CheckCircle2,
        };
      case 'DELAYED':
        return {
          label: 'DELAYED',
          className: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          icon: AlertCircle,
        };
      case 'OFFLINE':
      default:
        return {
          label: 'OFFLINE',
          className: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
          icon: XCircle,
        };
    }
  };

  const onlineCount = sources.filter((s) => s.status === 'ONLINE').length;

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-sans tracking-tight">
                Data Source Health & Telemetry Streams
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {onlineCount}/{sources.length} ONLINE
              </span>
            </div>
            <p className="text-xs text-white/50 font-sans">
              API streaming pipelines from ISRO, INCOIS, IMD, and NIOT Moored Buoy arrays
            </p>
          </div>
        </div>

        {/* Sync Status & Refresh Button */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-white/40">
            Synced: {lastRefreshedAt}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isRefreshing ? 'Pinging APIs...' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Data Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {sources.map((source) => {
          const badge = getStatusBadge(source.status);
          const StatusIcon = badge.icon;

          return (
            <div
              key={source.id}
              className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Name and Status */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans group-hover:text-cyan-300 transition-colors">
                      {source.name}
                    </h3>
                    <p className="text-[11px] text-white/50 font-sans leading-tight mt-0.5">
                      {source.provider}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${badge.className}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                </div>

                {/* Telemetry Stream Type */}
                <div className="my-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-mono text-cyan-300/90">
                  <span className="text-white/40 block text-[9px] uppercase">Payload:</span>
                  {source.streamType}
                </div>
              </div>

              {/* Metrics Matrix: Freshness, Availability, Latency, Updated */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] font-mono text-white/70">
                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Updated</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> {source.lastUpdated}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Freshness</span>
                  <span className="text-emerald-400 font-semibold">{source.freshness}</span>
                </div>

                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Uptime</span>
                  <span className="text-white font-semibold">{source.availability}</span>
                </div>

                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Ping / Latency</span>
                  <span className="text-cyan-400 font-semibold">{source.latencyMs} ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
