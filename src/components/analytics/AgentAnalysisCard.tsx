import React, { useState } from 'react';
import {
  CloudLightning,
  Waves,
  Fish,
  ShieldAlert,
  Compass,
  Leaf,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { AgentResult, RiskLevel, AgentStatus } from '../../services/orcaLocationService';

interface AgentAnalysisCardProps {
  agent: AgentResult;
  isProcessing?: boolean;
}

export const AgentAnalysisCard: React.FC<AgentAnalysisCardProps> = ({
  agent,
  isProcessing = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'weather':
        return <CloudLightning className="w-4 h-4 text-purple-400" />;
      case 'ocean':
        return <Waves className="w-4 h-4 text-blue-400" />;
      case 'fisheries':
        return <Fish className="w-4 h-4 text-cyan-400" />;
      case 'risk':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'navigation':
        return <Compass className="w-4 h-4 text-amber-400" />;
      case 'environment':
        return <Leaf className="w-4 h-4 text-emerald-400" />;
      case 'research':
      default:
        return <GraduationCap className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-500 animate-ping',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          dot: 'bg-orange-400',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
        };
    }
  };

  const badge = getRiskBadge(agent.riskLevel);

  return (
    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/30 transition-all shadow-md">
      {/* Top row: Agent Name & Risk Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
            {getAgentIcon(agent.id)}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold font-mono text-white tracking-wider truncate">
              {agent.name}
            </h4>
            <p className="text-[10px] text-white/50 truncate font-sans">
              {agent.roleTitle}
            </p>
          </div>
        </div>

        {/* Status / Risk indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isProcessing ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> ANALYZING
            </span>
          ) : (
            <span
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-mono font-semibold ${badge.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {agent.riskLevel}
            </span>
          )}
        </div>
      </div>

      {/* Short Conclusion */}
      <p className="text-xs text-white/80 font-sans leading-relaxed mb-2.5">
        {agent.shortConclusion}
      </p>

      {/* Key Metric & Confidence Row */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] font-mono text-white/60">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-white/40">{agent.keyMetric.label}:</span>
          <span className="font-bold text-cyan-300 truncate">
            {agent.keyMetric.value}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-white/40">Conf:</span>
            <span className="text-emerald-400 font-bold">{agent.confidence}%</span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer rounded"
            title="Toggle Details"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable telemetry detail & data sources */}
      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2 animate-fade-slide-up">
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-mono text-white/70 leading-normal">
            {agent.detailedAnalysis}
          </div>

          <div className="space-y-1 text-[10px] font-mono text-white/50">
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" />
              <span className="text-white/40">Sources:</span>
              <span className="text-white/70 truncate">{agent.dataSources.join(', ')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-white/40" />
              <span>{agent.lastUpdated}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
