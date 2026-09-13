import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div
      id="orca-typing-indicator"
      className="flex items-start gap-3 my-2 text-white animate-fade-slide-up"
    >
      <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-1">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
      </div>

      <div className="liquid-glass rounded-2xl px-4 py-3 border border-white/10 text-xs text-white/70 flex items-center gap-2">
        <span className="font-mono text-[11px] tracking-wider text-white/50">ORCA ANALYZING</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
