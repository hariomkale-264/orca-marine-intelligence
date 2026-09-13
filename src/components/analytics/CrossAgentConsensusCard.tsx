import React from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { ConsensusResult, AgentResult, AgentId } from '../../services/orcaLocationService';

interface CrossAgentConsensusCardProps {
  consensus: ConsensusResult;
  agents: Record<AgentId, AgentResult>;
}

export const CrossAgentConsensusCard: React.FC<CrossAgentConsensusCardProps> = ({
  consensus,
  agents,
}) => {
  const agentList: AgentResult[] = Object.values(agents);

  const getRiskPillColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      case 'HIGH':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'MODERATE':
        return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
      case 'LOW':
      default:
        return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3.5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono text-white tracking-wide">
              CROSS-AGENT REASONING & CONSENSUS
            </h4>
            <p className="text-[10px] text-white/50 font-sans">
              Inter-agent consensus arbitration & conflict resolution
            </p>
          </div>
        </div>

        {/* Agreement Ratio */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Agreement: {consensus.agentAgreement.ratioText}</span>
        </div>
      </div>

      {/* Mini Agent Matrix Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
        {agentList.map((agent) => (
          <div
            key={agent.id}
            className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between text-[10px] font-mono"
          >
            <span className="text-white/60 truncate pr-1">
              {agent.name.replace(' AGENT', '')}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${getRiskPillColor(
                agent.riskLevel
              )}`}
            >
              {agent.riskLevel}
            </span>
          </div>
        ))}
      </div>

      {/* Conflict / Arbitration Callout Box */}
      {consensus.isConflictPresent ? (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Arbitration Notice: {consensus.conflictingAgents.length} agent(s) divergent from majority
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-white/50 block mb-1">Supporting ({consensus.supportingAgents.length}):</span>
              <span className="text-emerald-300 font-semibold">
                {consensus.supportingAgents.join(', ')}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <span className="text-white/50 block mb-1">Conflicting ({consensus.conflictingAgents.length}):</span>
              <span className="text-rose-300 font-semibold">
                {consensus.conflictingAgents.join(', ')}
              </span>
            </div>
          </div>

          <p className="text-[11px] font-sans text-amber-100/80 leading-relaxed border-t border-amber-500/20 pt-1.5">
            <strong className="text-amber-200">ORCA Arbitration Policy: </strong>
            {consensus.conflictExplanation}
          </p>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Unanimous consensus: All 7 operational agents align on risk profile.</span>
        </div>
      )}
    </div>
  );
};
