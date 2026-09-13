import React, { useState } from 'react';
import {
  Bot,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { AgentResult, AgentId } from '../../services/orcaLocationService';
import { AgentAnalysisCard } from './AgentAnalysisCard';

interface SevenAgentAnalysisSectionProps {
  agents: Record<AgentId, AgentResult>;
  isAnalyzing: boolean;
  analyzingStep?: number; // 0..7
  onReAnalyze: () => void;
}

export const SevenAgentAnalysisSection: React.FC<SevenAgentAnalysisSectionProps> = ({
  agents,
  isAnalyzing,
  analyzingStep = 7,
  onReAnalyze,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WARNINGS' | 'CRITICAL'>('ALL');

  const agentOrder: AgentId[] = [
    'weather',
    'ocean',
    'fisheries',
    'risk',
    'navigation',
    'environment',
    'research',
  ];

  const filteredAgentIds = agentOrder.filter((id) => {
    const agent = agents[id];
    if (!agent) return false;
    if (activeFilter === 'WARNINGS') {
      return agent.riskLevel === 'HIGH' || agent.riskLevel === 'CRITICAL' || agent.riskLevel === 'MODERATE';
    }
    if (activeFilter === 'CRITICAL') {
      return agent.riskLevel === 'HIGH' || agent.riskLevel === 'CRITICAL';
    }
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Section Header with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold font-mono text-white tracking-wide">
              7-AGENT MARINE ANALYSIS
            </h3>
            <p className="text-[10px] text-white/50 font-sans">
              Decentralized multi-agent cognitive synthesis
            </p>
          </div>
        </div>

        {/* Filter Pills & Re-run action */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[10px] font-mono">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            All (7)
          </button>
          <button
            onClick={() => setActiveFilter('WARNINGS')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'WARNINGS'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Advisories
          </button>
          <button
            onClick={onReAnalyze}
            disabled={isAnalyzing}
            className="p-1 hover:bg-white/10 text-white/60 hover:text-cyan-300 rounded transition-colors cursor-pointer disabled:opacity-40"
            title="Re-run 7-Agent Evaluation"
          >
            <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Analysis Progress Stepper (Visible while analyzing) */}
      {isAnalyzing && (
        <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-cyan-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>ORCA Neural Ensemble Processing...</span>
            </span>
            <span>{Math.min(7, analyzingStep)} / 7 Agents Ready</span>
          </div>
          <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-teal-300 h-full transition-all duration-200"
              style={{ width: `${(Math.min(7, analyzingStep) / 7) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Agent Cards Grid */}
      <div className="space-y-2.5">
        {filteredAgentIds.map((id, index) => {
          const agent = agents[id];
          if (!agent) return null;
          const isAgentStillProcessing = isAnalyzing && index >= analyzingStep;

          return (
            <AgentAnalysisCard
              key={agent.id}
              agent={agent}
              isProcessing={isAgentStillProcessing}
            />
          );
        })}
      </div>
    </div>
  );
};
