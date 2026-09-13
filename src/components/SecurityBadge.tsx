import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const SecurityBadge: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-2 pb-0.5 text-white/45 text-[11px] font-medium tracking-wide">
      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400/70" aria-hidden="true" />
      <span>Secure authentication</span>
      <span className="inline-block w-1 h-1 rounded-full bg-emerald-400/60 ml-0.5 animate-pulse" />
    </div>
  );
};
