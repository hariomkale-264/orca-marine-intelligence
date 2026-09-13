import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  ShieldAlert,
  Fish,
  Thermometer,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MarineZone, OrcaAiInsight } from '../../data/marineAnalyticsData';

interface ResearchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: MarineZone[];
  kpis: {
    activeRiskAlerts: number;
    activePfzZones: number;
    avgSst: number;
    monitoredZones: number;
    highRiskZones: number;
  };
  insights: OrcaAiInsight[];
}

export const ResearchReportModal: React.FC<ResearchReportModalProps> = ({
  isOpen,
  onClose,
  zones,
  kpis,
  insights,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleCopyText = () => {
    const text = `===============================================================
ORCA MARINE RESEARCH & RISK ADVISORY EXECUTIVE BRIEF
Smart India Hackathon Marine Intelligence Platform
Date of Generation: ${generatedDate}
Classification: RESTRICTED COMMAND ADVISORY
===============================================================

1. EXECUTIVE OVERVIEW
- Monitored Marine Zones: ${kpis.monitoredZones} sectors
- Active Risk Alerts: ${kpis.activeRiskAlerts} meteorological/oceanographic alerts
- High-Risk Hotspots: ${kpis.highRiskZones} sectors requiring fleet suspension
- Active PFZ Zones: ${kpis.activePfzZones} validated potential fishing grounds
- Mean Sea Surface Temp: ${kpis.avgSst.toFixed(1)}°C (+0.6°C climatological anomaly)

2. CRITICAL ZONES IDENTIFIED
${zones
  .filter((z) => z.riskLevel === 'HIGH' || z.riskLevel === 'CRITICAL')
  .map(
    (z) =>
      `• [${z.riskLevel}] ${z.name} (${z.lat}°N, ${z.lng}°E)\n  Hazards: ${z.currentHazards.join(', ')} | Wave: ${z.waveHeight}m | Wind: ${z.windSpeed}kts\n  Advisory: ${z.alertNotice || 'Vessel transit caution.'}`
  )
  .join('\n\n')}

3. SYNTHETIC AI DECISION SUPPORT INSIGHTS
${insights
  .map(
    (i) =>
      `• [${i.severity}] ${i.title} (Confidence: ${i.confidence}%)\n  Source: ${i.source}\n  Action: ${i.suggestedAction}`
  )
  .join('\n\n')}

4. MULTI-AGENCY DATA STREAMS INVOLVED
- INCOIS: Potential Fishing Zones, Ocean State Forecast (OSF)
- IMD: Coastal Cyclone Doppler Radar & Squall Bulletins
- ISRO NRSC: Oceansat-3 OCM-3 Chlorophyll & Thermal Infrared
- NIOT: Deep-Sea Moored Buoy Array (AD/BD Series)

===============================================================
Authorized by ORCA Marine Intelligence Engine
===============================================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl liquid-glass rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/15 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-sans">
                ORCA Marine Research & Decision Brief
              </h2>
              <p className="text-[11px] font-mono text-cyan-300">
                OFFICIAL REPORT • DATE: {generatedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Brief'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Report Content */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto text-white text-xs sm:text-sm font-sans leading-relaxed">
          {/* Official Letterhead Header */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                SMART INDIA HACKATHON • MARINE INTELLIGENCE DIVISION
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Integrated Coastal & EEZ Risk Assessment
              </h1>
              <p className="text-xs text-white/60">
                Prepared for Government Authorities, Fisheries Departments & Disaster Management
              </p>
            </div>
            <div className="text-right font-mono text-[11px] text-white/50 shrink-0">
              <div>Ref: ORCA-INTEL-{new Date().getFullYear()}</div>
              <div>Status: VALIDATED DEMO</div>
            </div>
          </div>

          {/* Key Executive Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] font-mono text-white/40 uppercase block">Active Risk Alerts</span>
              <span className="text-xl font-bold text-rose-400 font-sans">{kpis.activeRiskAlerts}</span>
              <span className="text-[10px] text-white/50 block">4 Critical squalls</span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] font-mono text-white/40 uppercase block">Active PFZ Zones</span>
              <span className="text-xl font-bold text-cyan-300 font-sans">{kpis.activePfzZones}</span>
              <span className="text-[10px] text-white/50 block">High pelagic density</span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] font-mono text-white/40 uppercase block">Mean SST</span>
              <span className="text-xl font-bold text-amber-400 font-sans">{kpis.avgSst.toFixed(1)}°C</span>
              <span className="text-[10px] text-white/50 block">+0.6°C thermal anomaly</span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] font-mono text-white/40 uppercase block">High-Risk Sectors</span>
              <span className="text-xl font-bold text-orange-400 font-sans">{kpis.highRiskZones}</span>
              <span className="text-[10px] text-white/50 block">Recall advisories</span>
            </div>
          </div>

          {/* Critical Hazard Alert Highlights */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-mono text-white/80 uppercase flex items-center gap-1.5 border-b border-white/10 pb-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              1. Priority High-Risk Maritime Sectors
            </h3>

            <div className="space-y-2">
              {zones
                .filter((z) => z.riskLevel === 'HIGH' || z.riskLevel === 'CRITICAL')
                .map((z) => (
                  <div key={z.id} className="p-3.5 rounded-xl bg-black/40 border border-rose-500/30">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{z.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {z.riskLevel}
                      </span>
                    </div>
                    <div className="text-xs text-white/80 font-mono flex flex-wrap gap-3 my-1">
                      <span>Coordinates: {z.lat}°N, {z.lng}°E</span>
                      <span>Wave: <b className="text-cyan-300">{z.waveHeight}m</b></span>
                      <span>Wind: <b className="text-teal-300">{z.windSpeed} kts ({z.windDirection})</b></span>
                      <span>SST: <b className="text-amber-300">{z.seaSurfaceTemp}°C</b></span>
                    </div>
                    {z.alertNotice && (
                      <p className="text-xs text-rose-200 mt-1 bg-rose-950/40 p-2 rounded-lg border border-rose-500/20">
                        ⚠️ <strong>Action Directive:</strong> {z.alertNotice}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* AI Decision Support Insights */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-mono text-white/80 uppercase flex items-center gap-1.5 border-b border-white/10 pb-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              2. Synthetic ORCA AI Decision Support Recommendations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((ins) => (
                <div key={ins.id} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-cyan-300">{ins.severity}</span>
                    <span className="text-white/40">Confidence: {ins.confidence}%</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{ins.title}</h4>
                  <p className="text-[11px] text-white/70 leading-relaxed">{ins.description}</p>
                  <div className="text-[10px] font-mono text-emerald-300 pt-1 border-t border-white/5">
                    Directive: {ins.suggestedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Pipeline Footnote */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] font-mono text-white/50 space-y-1">
            <div className="font-bold text-white/80 uppercase">Underlying Telemetry Pipelines</div>
            <p>Data integrated from INCOIS (OSF/PFZ), IMD (Doppler Radar & Cyclones), ISRO Oceansat-3 (OCM-3/SST), and NIOT Deep-Sea Moored Buoy telemetry.</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/15 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-white/40">
            ORCA Marine Analytics • Smart India Hackathon Prototype
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/15 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
