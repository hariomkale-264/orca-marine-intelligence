import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  Activity,
  Compass,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Search,
  ExternalLink,
  GitFork,
  Radio,
} from 'lucide-react';
import {
  ResearchResult,
  SpecializedAgentResult,
  AgentId,
  FreshnessStatus,
} from '../../services/modeController';

interface ResearchModePanelProps {
  data: ResearchResult;
  locationName: string;
}

export const ResearchModePanel: React.FC<ResearchModePanelProps> = ({
  data,
  locationName,
}) => {
  const { allAgents, oceanParameters, decadalAnomaly, consensusBreakdown, evidenceTrail, conclusion } = data;
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>('safety');

  const agentList: SpecializedAgentResult[] = Object.values(allAgents);

  const getStatusBadge = (status: SpecializedAgentResult['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'DATA_UNAVAILABLE':
      case 'FAILED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
      case 'NOT_REQUIRED':
        return 'bg-white/10 text-white/40 border-white/10';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  const getFreshnessBadge = (status: FreshnessStatus) => {
    switch (status) {
      case 'FRESH':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'RECENT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'AGING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'OUTDATED':
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  const activeAgent = allAgents[selectedAgentId] || agentList[0];

  return (
    <div className="space-y-4 animate-fade-slide-up">
      {/* 1. RESEARCH HERO SUMMARY */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-black/40 to-slate-900/40 border border-indigo-500/30 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-indigo-300">
            <GraduationCap className="w-5 h-5" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              7-AGENT ENSEMBLE TELEMETRY
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            {consensusBreakdown.agreementRatio}
          </span>
        </div>

        <p className="text-xs text-white/90 leading-relaxed">
          {conclusion.scientificSummary}
        </p>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center font-mono text-xs">
          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[9px] text-white/40 block">WAVE PERCENTILE</span>
            <span className="text-sm font-bold text-white">{decadalAnomaly.wavePercentile}th</span>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[9px] text-white/40 block">SST ANOMALY</span>
            <span className="text-sm font-bold text-cyan-300">{decadalAnomaly.sstDeviation}</span>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[9px] text-white/40 block">ENSEMBLE CONF</span>
            <span className="text-sm font-bold text-emerald-400">
              {(conclusion.aggregateConfidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE 7 AGENT SELECTOR STRIP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-white/50 px-1">
          <span>7 SPECIALIZED AGENTS EXECUTION STATUS:</span>
          <span>SELECT TO INSPECT</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {agentList.map((a) => {
            const isSelected = a.id === selectedAgentId;
            return (
              <button
                key={a.id}
                onClick={() => setSelectedAgentId(a.id)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500/20 text-white border-indigo-400/50 shadow-md ring-1 ring-indigo-400/30'
                    : 'bg-black/40 text-white/70 border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono font-bold truncate">
                    {a.name.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[8px] font-mono px-1 rounded uppercase ${getStatusBadge(
                      a.status
                    )}`}
                  >
                    {a.status === 'COMPLETED' ? 'OK' : a.status}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-white/40 block">
                  Conf: {(a.confidence * 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SELECTED AGENT DEEP AUDIT CARD */}
      {activeAgent && (
        <div className="p-4 rounded-2xl bg-black/50 border border-white/15 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div>
              <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <span>{activeAgent.name}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border ${getStatusBadge(activeAgent.status)}`}>
                  {activeAgent.status}
                </span>
              </h4>
              <p className="text-[11px] text-white/50">{activeAgent.responsibility}</p>
            </div>
            <div className="text-right font-mono text-xs text-white/80">
              <span className="text-[10px] text-white/40 block">Data Latency</span>
              <span className="text-cyan-300 font-bold">{activeAgent.data_age}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/90 leading-relaxed font-sans">
            "{activeAgent.result}"
          </div>

          {activeAgent.keyMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(activeAgent.keyMetrics).map(([k, v], idx) => (
                <div key={idx} className="p-2 rounded-xl bg-black/40 border border-white/5 text-xs">
                  <span className="text-[10px] text-white/40 block">{k}</span>
                  <span className="font-mono font-bold text-white">{v}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pt-1 border-t border-white/10">
            <span className="truncate">Source: {activeAgent.source}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] border ${getFreshnessBadge(activeAgent.freshness_status)}`}>
              {activeAgent.freshness_status}
            </span>
          </div>
        </div>
      )}

      {/* 4. CROSS-AGENT REASONING & CONFLICT RESOLUTION */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
        <div className="flex items-center gap-2 text-white/80">
          <GitFork className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            CROSS-AGENT ARBITRATION & CONSENSUS
          </span>
        </div>

        <p className="text-xs text-white/80 leading-relaxed">
          {consensusBreakdown.conflictReasoning}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {consensusBreakdown.supportingAgentNames.map((s, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
            >
              ✓ {s}
            </span>
          ))}
        </div>
      </div>

      {/* 5. EVIDENCE TRAIL & SENSOR LATENCY MATRIX */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-white/80">
          <span className="font-mono font-bold uppercase flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" /> Ground-Truth Feeds
          </span>
          <span className="text-[10px] font-mono text-white/40">Audit Trail</span>
        </div>

        <div className="space-y-1.5">
          {evidenceTrail.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
            >
              <div>
                <span className="text-white font-medium block">{item.parameter}</span>
                <span className="text-[10px] text-white/40">{item.source} • {item.sensor}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-white font-bold block">{item.value}</span>
                <span className="text-[10px] text-cyan-400">{item.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
