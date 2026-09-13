import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Flame,
  Fish,
  Wind,
  ShieldAlert,
  Clock,
  Database,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Bot,
} from 'lucide-react';
import { ORCA_AI_INSIGHTS, OrcaAiInsight } from '../../data/marineAnalyticsData';

interface OrcaAiInsightsSectionProps {
  onAskAi?: (insight: OrcaAiInsight) => void;
}

export const OrcaAiInsightsSection: React.FC<OrcaAiInsightsSectionProps> = ({ onAskAi }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const handleCopy = (insight: OrcaAiInsight) => {
    const text = `[ORCA AI INSIGHT - ${insight.severity}] ${insight.title}\nConfidence: ${insight.confidence}%\nSource: ${insight.source}\nRegion: ${insight.affectedRegion}\nDetails: ${insight.description}\nRecommended Action: ${insight.suggestedAction}`;
    navigator.clipboard.writeText(text);
    setCopiedId(insight.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered =
    filterSeverity === 'all'
      ? ORCA_AI_INSIGHTS
      : ORCA_AI_INSIGHTS.filter((i) => i.severity === filterSeverity);

  const getSeverityBadge = (severity: OrcaAiInsight['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400 animate-ping',
          icon: ShieldAlert,
        };
      case 'HIGH RISK':
        return {
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          dot: 'bg-orange-400',
          icon: AlertTriangle,
        };
      case 'PFZ OPPORTUNITY':
        return {
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          dot: 'bg-cyan-400',
          icon: Fish,
        };
      case 'ADVISORY':
      default:
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          icon: Wind,
        };
    }
  };

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-sans tracking-tight">
                ORCA AI Insights
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Decision Support Engine
              </span>
            </div>
            <p className="text-xs text-white/50 font-sans">
              Automated multi-modal synthesis for maritime risk prevention and sustainable fisheries
            </p>
          </div>
        </div>

        {/* Severity filter pills */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
          {['all', 'CRITICAL', 'HIGH RISK', 'PFZ OPPORTUNITY', 'ADVISORY'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterSeverity === sev
                  ? 'bg-white/20 text-white font-bold border border-white/30'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {sev === 'all' ? 'All Insights' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Notice disclaiming demo predictions */}
      <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center gap-2 text-xs text-cyan-200/80 font-sans">
        <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Synthetic AI Analysis:</strong> Generated using fused sensor vectors from INCOIS, ISRO Oceansat-3, and IMD models for validation demonstrations.
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {filtered.map((insight) => {
          const badge = getSeverityBadge(insight.severity);
          const Icon = badge.icon;
          const isCopied = copiedId === insight.id;

          return (
            <div
              key={insight.id}
              className="p-5 rounded-2xl bg-black/40 border border-white/15 hover:border-cyan-400/40 transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-cyan-950/20"
            >
              <div>
                {/* Top Badge, Confidence, and Region */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${badge.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <Icon className="w-3 h-3" />
                    {insight.severity}
                  </span>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-white/40">Confidence:</span>
                    <span className="font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                      {insight.confidence}%
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white font-sans group-hover:text-cyan-300 transition-colors">
                  {insight.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-300 mt-2 leading-relaxed font-sans">
                  {insight.description}
                </p>

                {/* Recommended Operational Action */}
                <div className="mt-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Recommended Command Action
                  </div>
                  <p className="text-white/90 font-sans text-xs leading-tight">
                    {insight.suggestedAction}
                  </p>
                </div>
              </div>

              {/* Footer Metadata & Actions */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-white/50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-white/70">
                    <Database className="w-3 h-3 text-cyan-400" />
                    {insight.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {insight.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(insight)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title="Copy insight brief"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {onAskAi && (
                    <button
                      onClick={() => onAskAi(insight)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <span>Inquire</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
