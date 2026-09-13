import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Send,
  Copy,
  Check,
  Compass,
  Radio,
  FileCheck,
  BellRing,
} from 'lucide-react';
import { LocationAnalysisResponse } from '../../services/orcaLocationService';

interface AuthorityViewProps {
  data: LocationAnalysisResponse;
}

export const AuthorityView: React.FC<AuthorityViewProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  if (!data || !data.location) return null;

  const { location, parameters, consensus } = data;
  const latVal = typeof location?.lat === 'number' ? location.lat.toFixed(4) : '18.9220';
  const lngVal = typeof location?.lng === 'number' ? location.lng.toFixed(4) : '72.8346';
  const isSafe = consensus.overallRisk === 'LOW' || consensus.overallRisk === 'MODERATE';

  const handleCopy = () => {
    const text = `ORCA Maritime Notice: ${latVal}°N, ${lngVal}°E (${location.nearestCoast || 'Coastal Sector'}). Risk: ${consensus.overallRisk}. Wind: ${parameters.windSpeed} km/h, Wave: ${parameters.waveHeight}m. Advisory: ${consensus.recommendedAction}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Quick Executive Status Badge */}
      <div
        className={`p-4 rounded-2xl border ${
          isSafe
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        } flex items-center justify-between gap-3 shadow-xl`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSafe ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {isSafe ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 animate-pulse" />}
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider block opacity-70">
              COASTAL COMMAND READINESS
            </span>
            <h3 className="text-base font-bold font-mono text-white">
              {isSafe ? 'SECTOR CLEAR FOR TRANSIT' : 'TRANSIT ADVISORY / WARNING IN EFFECT'}
            </h3>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase tracking-wider ${
            isSafe ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white animate-bounce'
          }`}
        >
          {consensus.overallRisk} RISK
        </span>
      </div>

      {/* Critical Operating Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-white/40 block text-[10px]">WIND VECTOR</span>
          <span className="text-base font-bold text-teal-300">
            {parameters.windSpeed} km/h
          </span>
          <span className="text-[10px] text-white/50 block">{parameters.windDirection} • {parameters.windSpeedKnots} kts</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-white/40 block text-[10px]">SWELL CREST</span>
          <span className="text-base font-bold text-blue-300">
            {parameters.waveHeight} m
          </span>
          <span className="text-[10px] text-white/50 block">Hs Significant</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-white/40 block text-[10px]">COORDINATES</span>
          <span className="text-xs font-bold text-cyan-300 truncate block">
            {latVal}°N, {lngVal}°E
          </span>
          <span className="text-[10px] text-white/50 block truncate">{location.nearestCoast}</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-white/40 block text-[10px]">CONFIDENCE</span>
          <span className="text-base font-bold text-emerald-400">
            {consensus.confidence}%
          </span>
          <span className="text-[10px] text-white/50 block">Ensemble Agreement</span>
        </div>
      </div>

      {/* Directive Recommended Action */}
      <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
          <Radio className="w-3.5 h-3.5" />
          <span>AUTHORITY DIRECTIVE</span>
        </div>
        <p className="text-xs font-sans text-white/90 leading-relaxed font-medium">
          {consensus.recommendedAction}
        </p>
      </div>

      {/* Operational Actions Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={handleBroadcast}
          disabled={broadcastSent}
          className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer disabled:opacity-50"
        >
          {broadcastSent ? (
            <>
              <Check className="w-4 h-4" /> Bulletin Queued
            </>
          ) : (
            <>
              <BellRing className="w-4 h-4" /> Broadcast VHF Advisory
            </>
          )}
        </button>

        <button
          onClick={handleCopy}
          className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Notice'}</span>
        </button>
      </div>
    </div>
  );
};
