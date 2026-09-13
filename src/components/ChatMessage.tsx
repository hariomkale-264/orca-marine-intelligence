import React, { useState } from 'react';
import { ChatMessageItem } from '../types.ts';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Share2,
  RotateCw,
} from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton.tsx';
import { useReadAloud } from '../hooks/useReadAloud.ts';

interface ChatMessageProps {
  message: ChatMessageItem;
  onRegenerate?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRegenerate }) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);

  const { activeMessageId, playbackState } = useReadAloud();
  const isSpeaking = activeMessageId === message.id && playbackState === 'speaking';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ORCA Marine AI Telemetry & Advisory',
          text: message.text,
        });
        return;
      } catch {
        // Fallback to clipboard if share was cancelled or failed
      }
    }
    navigator.clipboard.writeText(message.text);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleLike = () => {
    setFeedback((prev) => (prev === 'liked' ? null : 'liked'));
  };

  const handleDislike = () => {
    setFeedback((prev) => (prev === 'disliked' ? null : 'disliked'));
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
  };

  // Basic markdown renderer for lines (bold, bullet points, code)
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const content = line.trim().slice(2);
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-sm text-gray-200">
            <span className="text-white/60 font-mono mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
          </div>
        );
      }

      // Headers like **ORCA Marine Advisory**
      return (
        <p
          key={idx}
          className="text-sm leading-relaxed text-gray-100 my-1"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    });
  };

  // Inline markdown formatter for bolding, code, etc.
  const formatInline = (str: string): string => {
    let escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    escaped = escaped.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-cyan-200">$1</code>');

    return escaped;
  };

  return (
    <div
      id={`chat-msg-${message.id}`}
      className={`w-full flex flex-col my-3 animate-fade-slide-up ${
        isUser ? 'items-end' : 'items-start'
      }`}
    >
      <div className={`max-w-[95%] sm:max-w-[85%] md:max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Sender meta */}
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-white/40 font-mono">
          <span>{isUser ? 'YOU' : 'ORCA MARINE AI'}</span>
          {message.role && !isUser && (
            <>
              <span>•</span>
              <span className="text-white/60 font-sans">{message.role}</span>
            </>
          )}
          <span>•</span>
          <span>{message.timestamp}</span>

          {/* Active Speaking Indicator in Meta header */}
          {isSpeaking && (
            <>
              <span>•</span>
              <span className="text-cyan-300 font-sans flex items-center gap-1 font-semibold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                READING ALOUD
              </span>
            </>
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
            isUser
              ? 'bg-white/15 border border-white/25 text-white shadow-lg backdrop-blur-md rounded-tr-sm'
              : `liquid-glass border text-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-tl-sm ${
                  isSpeaking
                    ? 'border-cyan-400/60 shadow-[0_0_28px_rgba(6,182,212,0.22)] ring-1 ring-cyan-400/40'
                    : 'border-white/15'
                }`
          }`}
        >
          <div className="break-words">
            {renderFormattedText(message.text)}
          </div>

          {/* AI Response Action Toolbar */}
          {!isUser && (
            <div className="mt-3.5 pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-white/40">
              {/* Telemetry / Model Origin Info */}
              <span className="font-mono text-[10px] text-white/50 tracking-wider">
                {message.mode === 'gemini-live' ? 'GEMINI 3.8 FLASH • LIVE' : 'ORCA TELEMETRY MATRIX'}
              </span>

              {/* Action Toolbar: [Copy] [Like/Dislike] [Share] [Regenerate] [🔊 Read Aloud] */}
              <div
                className="flex items-center flex-wrap gap-1 sm:gap-1.5 self-end sm:self-auto"
                role="toolbar"
                aria-label="Message actions"
              >
                {/* 1. Copy */}
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy response text"
                  aria-label="Copy response text"
                  className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer flex items-center gap-1 text-xs"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {/* 2. Like / Dislike */}
                <div className="flex items-center bg-white/[0.04] rounded-lg border border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={handleLike}
                    title="Helpful response"
                    aria-label="Like response"
                    className={`p-1 rounded-md transition-all duration-200 cursor-pointer ${
                      feedback === 'liked'
                        ? 'bg-emerald-500/25 text-emerald-300'
                        : 'text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDislike}
                    title="Not helpful"
                    aria-label="Dislike response"
                    className={`p-1 rounded-md transition-all duration-200 cursor-pointer ${
                      feedback === 'disliked'
                        ? 'bg-rose-500/25 text-rose-300'
                        : 'text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3. Share */}
                <button
                  type="button"
                  onClick={handleShare}
                  title="Share response"
                  aria-label="Share response"
                  className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer flex items-center gap-1 text-xs"
                >
                  {shared ? (
                    <Check className="w-3.5 h-3.5 text-cyan-300" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden md:inline">{shared ? 'Shared' : 'Share'}</span>
                </button>

                {/* 4. Regenerate */}
                {onRegenerate && (
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    title="Regenerate response"
                    aria-label="Regenerate response"
                    className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Regenerate</span>
                  </button>
                )}

                {/* 5. [🔊 Read Aloud] - Replaces former 3-dot menu with clearly visible speaker button */}
                <ReadAloudButton
                  messageId={message.id}
                  text={message.text}
                  languageMetadata={message.language}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
