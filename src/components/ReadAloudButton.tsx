import React, { useState } from 'react';
import { Volume2, Square, RotateCcw, Gauge } from 'lucide-react';
import { useReadAloud } from '../hooks/useReadAloud.ts';
import { detectLanguage } from '../utils/detectLanguage.ts';

interface ReadAloudButtonProps {
  messageId: string;
  text: string;
  languageMetadata?: string;
}

export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({
  messageId,
  text,
  languageMetadata,
}) => {
  const {
    activeMessageId,
    playbackState,
    activeLanguage,
    speechRate,
    speak,
    stop,
    cycleSpeechRate,
  } = useReadAloud();

  const [isHovered, setIsHovered] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const isCurrentActive = activeMessageId === messageId;
  const isSpeaking = isCurrentActive && playbackState === 'speaking';
  const isPreparing = isCurrentActive && playbackState === 'preparing';

  // Preview language for tooltip
  const previewLang = isCurrentActive && activeLanguage
    ? activeLanguage
    : detectLanguage(text, languageMetadata);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking || isPreparing) {
      stop();
    } else {
      speak(messageId, text, languageMetadata);
    }
  };

  const handleSpeedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cycleSpeechRate();
  };

  const ariaLabel = isSpeaking
    ? 'Stop reading'
    : isPreparing
    ? 'Preparing read aloud...'
    : `Read aloud in ${previewLang.name}`;

  const tooltipText = isSpeaking
    ? 'Click to stop reading'
    : isPreparing
    ? 'Preparing audio...'
    : `Read aloud (${previewLang.name})`;

  return (
    <div className="relative inline-flex items-center gap-1">
      <button
        type="button"
        id={`read-aloud-btn-${messageId}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={ariaLabel}
        title={tooltipText}
        className={`relative flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-cyan-400/60 ${
          isSpeaking
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-semibold'
            : isPreparing
            ? 'bg-white/10 text-white/90 border border-white/20 animate-pulse'
            : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'
        }`}
      >
        {/* Dynamic Icon State */}
        {isSpeaking ? (
          isHovered ? (
            <Square className="w-3.5 h-3.5 fill-current text-cyan-300 animate-in fade-in" />
          ) : (
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-3.5 bg-cyan-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2.5 bg-cyan-400 rounded-full animate-bounce" />
            </div>
          )
        ) : (
          <Volume2 className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
        )}

        {/* Text Label */}
        <span className="text-[11px] whitespace-nowrap">
          {isSpeaking
            ? isHovered
              ? 'Stop'
              : 'Speaking...'
            : isPreparing
            ? 'Loading...'
            : 'Read Aloud'}
        </span>

        {/* Subtle Language Indicator Badge */}
        <span
          className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono ${
            isSpeaking
              ? 'bg-cyan-400/25 text-cyan-200 border border-cyan-300/30'
              : 'bg-white/10 text-white/50 border border-white/10'
          }`}
          title={`Detected Language: ${previewLang.name} (${previewLang.ttsLocale})`}
        >
          {previewLang.code}
        </span>
      </button>

      {/* Speed Control Pill (Visible when speaking or active) */}
      {isCurrentActive && (
        <button
          type="button"
          onClick={handleSpeedClick}
          title={`Speech Speed: ${speechRate}x (Click to change: 1x, 1.25x, 1.5x, 0.75x)`}
          aria-label={`Speech rate ${speechRate}x`}
          className="px-1.5 py-1 rounded-md text-[10px] font-mono bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 transition-all cursor-pointer select-none flex items-center gap-0.5"
        >
          <Gauge className="w-2.5 h-2.5 opacity-70" />
          <span>{speechRate}x</span>
        </button>
      )}
    </div>
  );
};
