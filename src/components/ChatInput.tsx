import React, { useState, useRef, useEffect } from 'react';
import { Mic, Plus, ArrowUp, Type } from 'lucide-react';
import { OrcaRole } from '../types.ts';
import { RoleSelector } from './RoleSelector.tsx';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeRole: OrcaRole;
  onSelectRole: (role: OrcaRole) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  activeRole,
  onSelectRole,
}) => {
  const [text, setText] = useState('');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Auto-resize textarea up to max-height (approx 140px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 140);
      textarea.style.height = `${Math.max(newHeight, 28)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '28px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  return (
    <div className="w-full max-w-3xl sm:max-w-4xl mx-auto relative px-2 sm:px-4">
      {/* Current Operating Role Indicator Pill */}
      <div className="flex items-center justify-between mb-2 px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-[11px] font-mono tracking-wider">ACTIVE MODE:</span>
          <button
            onClick={() => setIsRoleMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-[11px] transition-all duration-200 cursor-pointer"
            title="Click to change operating role"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>{activeRole}</span>
          </button>
        </div>

        {isListening && (
          <span className="text-xs font-mono text-cyan-400 animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Listening...
          </span>
        )}
      </div>

      {/* Main Glass Chat Input Box (Liquid Glass Style) */}
      <div
        id="orca-chat-input-container"
        className="liquid-glass rounded-2xl sm:rounded-3xl border border-white/20 p-2 sm:p-2.5 flex items-end gap-2 shadow-[0_12px_36px_rgba(0,0,0,0.6)] focus-within:border-white/40 focus-within:shadow-[0_12px_44px_rgba(255,255,255,0.08)] transition-all duration-300"
      >
        {/* LEFT: Text input indicator */}
        <div className="p-2 text-white/40 flex items-center justify-center shrink-0 self-center">
          <Type className="w-4 h-4 text-white/50" aria-label="Text Input" />
        </div>

        {/* CENTER: Multiline textarea */}
        <div className="flex-1 min-w-0 py-1">
          <textarea
            ref={textareaRef}
            id="orca-chat-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask ORCA anything..."
            className="w-full bg-transparent text-white placeholder:text-white/40 text-sm sm:text-base focus:outline-none resize-none leading-relaxed overflow-y-auto max-h-[140px] scrollbar-thin"
          />
        </div>

        {/* RIGHT: Controls - Microphone, Plus (Role Selector), Send */}
        <div className="flex items-center gap-1.5 shrink-0 self-end pb-0.5 relative">
          {/* Microphone button */}
          <button
            type="button"
            id="orca-mic-button"
            onClick={toggleSpeechRecognition}
            disabled={!speechSupported}
            title={
              speechSupported
                ? isListening
                  ? 'Stop listening'
                  : 'Voice input (Speech to text)'
                : 'Speech recognition not available'
            }
            className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
              isListening
                ? 'bg-cyan-500 text-black animate-pulse'
                : 'text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Plus button inside circular button (Role Selector) */}
          <div className="relative">
            <button
              type="button"
              id="orca-plus-role-button"
              onClick={() => setIsRoleMenuOpen((prev) => !prev)}
              aria-label="Select ORCA role"
              title="Change ORCA operational role"
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                isRoleMenuOpen
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40'
              }`}
            >
              <Plus className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isRoleMenuOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* Role selector dropdown popover */}
            <RoleSelector
              activeRole={activeRole}
              onSelectRole={onSelectRole}
              isOpen={isRoleMenuOpen}
              onClose={() => setIsRoleMenuOpen(false)}
            />
          </div>

          {/* SEND button */}
          <button
            type="button"
            id="orca-send-button"
            onClick={handleSend}
            disabled={!text.trim() || isLoading}
            aria-label="Send query"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100 transition-all duration-200 cursor-pointer shrink-0 shadow-md"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
