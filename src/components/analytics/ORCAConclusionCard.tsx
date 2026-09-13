import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Compass,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { ConsensusResult, RiskLevel } from '../../services/orcaLocationService';

interface ORCAConclusionCardProps {
  consensus: ConsensusResult;
  locationName?: string;
}

export const ORCAConclusionCard: React.FC<ORCAConclusionCardProps> = ({
  consensus,
  locationName,
}) => {
  const getRiskTheme = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          glow: 'from-rose-500/20 via-rose-900/20 to-transparent border-rose-500/50',
          badge: 'bg-rose-500 text-white font-bold',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
          statusText: 'CRITICAL MARINE HAZARD',
          btnBg: 'bg-rose-600 hover:bg-rose-500',
        };
      case 'HIGH':
        return {
          glow: 'from-orange-500/20 via-orange-950/20 to-transparent border-orange-500/50',
          badge: 'bg-orange-500 text-white font-bold',
          icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
          statusText: 'HIGH MARINE RISK WARNING',
          btnBg: 'bg-orange-600 hover:bg-orange-500',
        };
      case 'MODERATE':
        return {
          glow: 'from-amber-500/15 via-amber-950/15 to-transparent border-amber-500/40',
          badge: 'bg-amber-500 text-black font-bold',
          icon: <Compass className="w-5 h-5 text-amber-400" />,
          statusText: 'MODERATE OPERATIONAL CAUTION',
          btnBg: 'bg-amber-600 hover:bg-amber-500',
        };
      case 'LOW':
      default:
        return {
          glow: 'from-emerald-500/15 via-emerald-950/15 to-transparent border-emerald-500/40',
          badge: 'bg-emerald-500 text-black font-bold',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          statusText: 'NORMAL / FAVORABLE CONDITIONS',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500',
        };
    }
  };

  const theme = getRiskTheme(consensus.overallRisk);

  return (
    <div
      className={`relative rounded-3xl p-5 border bg-gradient-to-br ${theme.glow} bg-[#071322] shadow-2xl overflow-hidden transition-all`}
    >
      {/* Background ambient pattern */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/20 flex items-center justify-center">
            {theme.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono text-cyan-300 tracking-wider">
                ORCA FINAL SYNTHESIS
              </span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-[10px] font-mono text-white/50">
              Validated Consensus • 7 Operational Engines
            </span>
          </div>
        </div>

        {/* Confidence & Risk Badges */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-black/60 border border-white/20 text-xs font-mono text-white/80">
            Conf: <strong className="text-emerald-400">{consensus.confidence}%</strong>
          </span>
          <span className={`px-3 py-1 rounded-xl text-xs font-mono uppercase tracking-wide ${theme.badge} shadow-lg`}>
            {consensus.overallRisk} RISK
          </span>
        </div>
      </div>

      {/* Reason / Summary */}
      <div className="p-3 rounded-2xl bg-black/50 border border-white/10 mb-3 text-xs font-sans text-white/90 leading-relaxed">
        <p>{consensus.summary}</p>
      </div>

      {/* Action Directive */}
      <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 tracking-wider">
            RECOMMENDED ACTION:
          </span>
          <p className="text-xs font-sans text-white/80">
            {consensus.recommendedAction}
          </p>
        </div>

        <div className="shrink-0 text-[11px] font-mono text-white/50 self-end sm:self-auto">
          Consensus: <span className="text-cyan-300 font-bold">{consensus.agentAgreement.ratioText}</span>
        </div>
      </div>
    </div>
  );
};
