import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { detectLanguage, LanguageDetectionResult, SUPPORTED_TTS_LANGUAGES } from '../utils/detectLanguage.ts';
import { getBestVoice, loadVoices } from '../utils/getBestVoice.ts';
import { cleanTextForSpeech, splitIntoSpeechChunks } from '../utils/ttsTextHelper.ts';

export type PlaybackState = 'idle' | 'preparing' | 'speaking' | 'paused';
export type SpeechSpeedRate = 0.75 | 1 | 1.25 | 1.5;

export interface ReadAloudContextValue {
  activeMessageId: string | null;
  playbackState: PlaybackState;
  activeLanguage: LanguageDetectionResult | null;
  speechRate: SpeechSpeedRate;
  isSupported: boolean;
  errorMessage: string | null;
  speak: (messageId: string, text: string, metadataLang?: string) => void;
  stop: () => void;
  replay: (messageId: string, text: string, metadataLang?: string) => void;
  setSpeechRate: (rate: SpeechSpeedRate) => void;
  cycleSpeechRate: () => void;
  clearError: () => void;
}

const ReadAloudContext = createContext<ReadAloudContextValue | null>(null);

const SPEED_STEPS: SpeechSpeedRate[] = [1, 1.25, 1.5, 0.75];

export const ReadAloudProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [activeLanguage, setActiveLanguage] = useState<LanguageDetectionResult | null>(null);
  const [speechRate, setSpeechRateState] = useState<SpeechSpeedRate>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs for tracking speech state across chunk callbacks
  const activeSessionRef = useRef<number>(0);
  const activeChunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);
  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Initialize and load voices
  useEffect(() => {
    if (!isSpeechSupported) return;

    loadVoices().then((voices) => {
      setAvailableVoices(voices);
    });

    const handleVoicesChanged = () => {
      setAvailableVoices(window.speechSynthesis.getVoices() || []);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      // Clean up speech synthesis on component unmount
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [isSpeechSupported]);

  // Handle page visibility/unload cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const stop = useCallback(() => {
    activeSessionRef.current += 1; // Invalidate active session to cancel further chunks
    activeChunksRef.current = [];
    currentChunkIndexRef.current = 0;

    if (isSpeechSupported && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('Speech cancellation error:', err);
      }
    }

    setActiveMessageId(null);
    setPlaybackState('idle');
    setActiveLanguage(null);
  }, [isSpeechSupported]);

  const speakChunk = useCallback(
    (sessionId: number, chunkIndex: number, langInfo: LanguageDetectionResult, rate: SpeechSpeedRate) => {
      if (!isSpeechSupported || !window.speechSynthesis) return;

      // Ensure session is still the active one
      if (sessionId !== activeSessionRef.current) return;

      const chunks = activeChunksRef.current;
      if (chunkIndex >= chunks.length) {
        // Finished all chunks
        stop();
        return;
      }

      currentChunkIndexRef.current = chunkIndex;
      const textToSpeak = chunks[chunkIndex];

      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // 1. Configure language locale
      utterance.lang = langInfo.ttsLocale;
      utterance.rate = rate;
      utterance.pitch = 1.0;

      // 2. Select best matching voice for this language
      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      const { voice } = getBestVoice(langInfo, voices);
      if (voice) {
        utterance.voice = voice;
      }

      // Handle utterance boundary and end
      utterance.onstart = () => {
        if (sessionId === activeSessionRef.current) {
          setPlaybackState('speaking');
        }
      };

      utterance.onend = () => {
        if (sessionId === activeSessionRef.current) {
          // Speak next chunk
          const nextIndex = chunkIndex + 1;
          if (nextIndex < chunks.length) {
            speakChunk(sessionId, nextIndex, langInfo, rate);
          } else {
            // Completed all speech
            setActiveMessageId(null);
            setPlaybackState('idle');
            setActiveLanguage(null);
          }
        }
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        // 'canceled' or 'interrupted' is expected when user clicks Stop or another message
        if (event.error === 'canceled' || event.error === 'interrupted') {
          return;
        }

        console.warn('SpeechSynthesis error:', event.error);
        if (sessionId === activeSessionRef.current) {
          // If error on chunk, try next chunk or stop gracefully
          const nextIndex = chunkIndex + 1;
          if (nextIndex < chunks.length) {
            speakChunk(sessionId, nextIndex, langInfo, rate);
          } else {
            stop();
          }
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err: any) {
        console.error('Failed to trigger window.speechSynthesis.speak:', err);
        setErrorMessage('Read aloud could not start audio on this browser.');
        stop();
      }
    },
    [isSpeechSupported, availableVoices, stop]
  );

  const speak = useCallback(
    (messageId: string, rawText: string, metadataLang?: string) => {
      // Clear previous errors
      setErrorMessage(null);

      // Check browser support
      if (!isSpeechSupported || !window.speechSynthesis) {
        setErrorMessage('Read aloud is currently unavailable on this device.');
        return;
      }

      // If user clicked the same message while it's playing, stop immediately
      if (activeMessageId === messageId && playbackState === 'speaking') {
        stop();
        return;
      }

      // 1. Immediately cancel any currently playing speech to enforce ONE message at a time
      activeSessionRef.current += 1;
      const currentSessionId = activeSessionRef.current;

      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      // 2. Detect language of the message text (or respect explicit metadata)
      const detected = detectLanguage(rawText, metadataLang);
      setActiveLanguage(detected);
      setActiveMessageId(messageId);
      setPlaybackState('preparing');

      // 3. Clean markdown and prepare speech chunks
      const cleaned = cleanTextForSpeech(rawText);
      if (!cleaned) {
        setPlaybackState('idle');
        setActiveMessageId(null);
        return;
      }

      const chunks = splitIntoSpeechChunks(cleaned);
      activeChunksRef.current = chunks;
      currentChunkIndexRef.current = 0;

      // 4. Brief delay to allow chrome cancel() to clear before starting new utterance
      setTimeout(() => {
        if (currentSessionId === activeSessionRef.current) {
          speakChunk(currentSessionId, 0, detected, speechRate);
        }
      }, 50);
    },
    [isSpeechSupported, activeMessageId, playbackState, stop, speakChunk, speechRate]
  );

  const replay = useCallback(
    (messageId: string, rawText: string, metadataLang?: string) => {
      speak(messageId, rawText, metadataLang);
    },
    [speak]
  );

  const setSpeechRate = useCallback(
    (rate: SpeechSpeedRate) => {
      setSpeechRateState(rate);
      // If currently speaking, restart current chunk with new rate
      if (activeMessageId && playbackState === 'speaking' && activeLanguage) {
        const sessionId = activeSessionRef.current;
        const currentIdx = currentChunkIndexRef.current;
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
        speakChunk(sessionId, currentIdx, activeLanguage, rate);
      }
    },
    [activeMessageId, playbackState, activeLanguage, speakChunk]
  );

  const cycleSpeechRate = useCallback(() => {
    const nextIdx = (SPEED_STEPS.indexOf(speechRate) + 1) % SPEED_STEPS.length;
    setSpeechRate(SPEED_STEPS[nextIdx]);
  }, [speechRate, setSpeechRate]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const value: ReadAloudContextValue = {
    activeMessageId,
    playbackState,
    activeLanguage,
    speechRate,
    isSupported: isSpeechSupported,
    errorMessage,
    speak,
    stop,
    replay,
    setSpeechRate,
    cycleSpeechRate,
    clearError,
  };

  return (
    <ReadAloudContext.Provider value={value}>
      {children}
      {/* Toast alert for speech error if any */}
      {errorMessage && (
        <div
          role="alert"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-950/90 border border-red-500/40 text-red-200 text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-slide-up"
        >
          <span>{errorMessage}</span>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-white ml-2 text-xs font-bold"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
    </ReadAloudContext.Provider>
  );
};

export function useReadAloud(): ReadAloudContextValue {
  const context = useContext(ReadAloudContext);
  if (!context) {
    throw new Error('useReadAloud must be used within a ReadAloudProvider');
  }
  return context;
}
