import React from 'react';
import {
  Thermometer,
  Waves,
  Wind,
  CloudRain,
  Fish,
  AlertTriangle,
} from 'lucide-react';
import { MarineParameters } from '../../services/orcaLocationService';

interface MarineParameterCardsProps {
  params: MarineParameters;
}

export const MarineParameterCards: React.FC<MarineParameterCardsProps> = ({ params }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {/* 1. Sea Surface Temp */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-amber-400" /> SST
          </span>
        </div>
        <div className="text-base sm:text-lg font-bold font-mono text-amber-300 mt-1">
          {params.sst}°C
        </div>
        <span className="text-[9px] font-mono text-white/40 truncate">
          Thermal Infr
        </span>
      </div>

      {/* 2. Wave Height */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-blue-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <Waves className="w-3 h-3 text-blue-400" /> Wave
          </span>
        </div>
        <div className="text-base sm:text-lg font-bold font-mono text-blue-300 mt-1">
          {params.waveHeight}m
        </div>
        <span className="text-[9px] font-mono text-white/40 truncate">
          Sig. Swell
        </span>
      </div>

      {/* 3. Wind Speed */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-teal-400" /> Wind
          </span>
        </div>
        <div className="text-base sm:text-lg font-bold font-mono text-teal-300 mt-1 truncate">
          {params.windSpeed} <span className="text-[10px] font-normal text-white/50">km/h</span>
        </div>
        <span className="text-[9px] font-mono text-white/40 truncate">
          {params.windDirection} • {params.windSpeedKnots}kts
        </span>
      </div>

      {/* 4. Rainfall */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-purple-400" /> Rain
          </span>
        </div>
        <div className="text-base sm:text-lg font-bold font-mono text-purple-300 mt-1 truncate">
          {params.rainfall} <span className="text-[10px] font-normal text-white/50">mm</span>
        </div>
        <span className="text-[9px] font-mono text-white/40 truncate">
          24h Precip
        </span>
      </div>

      {/* 5. PFZ Suitability */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <Fish className="w-3 h-3 text-cyan-400" /> PFZ
          </span>
        </div>
        <div className={`text-base sm:text-lg font-bold font-mono mt-1 ${
          params.pfzSuitability === 'High'
            ? 'text-cyan-300'
            : params.pfzSuitability === 'Moderate'
            ? 'text-amber-300'
            : 'text-white/60'
        }`}>
          {params.pfzSuitability}
        </div>
        <span className="text-[9px] font-mono text-white/40 truncate">
          {params.chlorophyll} mg/m³
        </span>
      </div>

      {/* 6. Risk Score */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-rose-500/30 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Risk
          </span>
        </div>
        <div className={`text-base sm:text-lg font-bold font-mono mt-1 ${
          params.riskScore >= 75
            ? 'text-rose-400'
            : params.riskScore >= 45
            ? 'text-orange-400'
            : 'text-emerald-400'
        }`}>
          {params.riskScore}
          <span className="text-[10px] text-white/40 font-normal">/100</span>
        </div>
        <span className="text-[9px] font-mono text-white/40 truncate">
          Composite Index
        </span>
      </div>
    </div>
  );
};
