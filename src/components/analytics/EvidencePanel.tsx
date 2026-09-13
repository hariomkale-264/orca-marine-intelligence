import React from 'react';
import {
  Database,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { EvidenceItem } from '../../services/orcaLocationService';

interface EvidencePanelProps {
  evidence: EvidenceItem[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence }) => {
  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono text-white tracking-wide">
              EVIDENCE & TELEMETRY FEEDS
            </h4>
            <p className="text-[10px] text-white/50 font-sans">
              Ground truth ingestion from national maritime sensors & satellites
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
          <Radio className="w-2.5 h-2.5 animate-pulse" /> 6 Active Feeds
        </span>
      </div>

      <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5">
        {evidence.map((item, idx) => (
          <div
            key={`ev-${idx}`}
            className="p-2.5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white/90 truncate">{item.parameter}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-cyan-300 border border-white/10">
                  {item.source}
                </span>
              </div>
              <div className="text-[11px] text-white/50 mt-0.5 truncate">
                {item.timestamp}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span className="font-bold text-teal-300 text-xs sm:text-right">
                {item.value}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Safety & Prototype Transparency Disclaimer */}
      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-mono text-white/40 leading-relaxed">
        ℹ️ Telemetry synthesizes real-time and calibrated climatological feeds (INCOIS, IMD, ISRO OCM-3).
        Ready for production API binding at <code className="text-cyan-400">POST /api/analyze-location</code>.
      </div>
    </div>
  );
};
