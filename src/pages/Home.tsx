import React, { useRef, useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { useChat } from '../hooks/useChat.ts';
import { ChatMessage } from '../components/ChatMessage.tsx';
import { TypingIndicator } from '../components/TypingIndicator.tsx';
import { ChatInput } from '../components/ChatInput.tsx';
import { OrcaRole } from '../types.ts';

// Quick prompt suggestions based on selected role
const ROLE_SUGGESTIONS: Record<OrcaRole, string[]> = {
  Fisherman: [
    'Is it safe to go fishing today?',
    'What are the wave heights and swell forecast?',
    'Where are the latest potential fishing zones (PFZ)?',
    'आज समुद्रात मासेमारी करणे सुरक्षित आहे का?',
  ],
  'Marine Researchers': [
    'Retrieve Sea Surface Temperature (SST) telemetry',
    'Summarize benthic salinity and CTD profile data',
    'What are the Chlorophyll-a satellite concentration gradients?',
    'Compare current thermocline depth against seasonal norms',
  ],
  'Coastal Authorities': [
    'Review active coastal hazard indices and tidal inundation',
    'Check vessel traffic and AIS boundary violations',
    'Are there any cyclone or high wind meteorological warnings?',
    'What is the current port clearance and SAR operational status?',
  ],
  'Maritime Operators': [
    'Optimize commercial transit route for fuel conservation',
    'Evaluate significant wave height (Hs) along western passage',
    'Check navigational notices (NOTMAR) and dredged channel depths',
    'What is the expected berth approach weather window?',
  ],
  'Default Mode': [
    'How do ocean tides work and what causes neap tides?',
    'What is the distance between Mumbai and Goa by sea in nautical miles?',
    'Explain the theory of relativity in simple terms',
    'Calculate: 24.5 knots in km/h and mph',
    'What are the deepest ocean trenches on Earth?',
    'आज समुद्र में मौसम कैसा है और क्या नेविगेशन सुरक्षित है?',
  ],
};

export const Home: React.FC = () => {
  const {
    messages,
    isLoading,
    activeRole,
    setActiveRole,
    sendMessage,
    regenerateResponse,
  } = useChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isInitialState = messages.length <= 1;

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isScrolledUp);
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // Auto-scroll when new messages arrive or loading state changes, unless user scrolled up
  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(true);
    }
  }, [messages.length, isLoading]);

  return (
    <div
      id="orca-home-page"
      className="relative w-full flex-1 flex flex-col justify-between max-w-5xl mx-auto px-3 sm:px-6 pb-3 pt-1 select-text h-full min-h-0 overflow-hidden"
    >
      {/* Scrollable Conversation Container with min-h-0 for proper flex scrolling */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-1 sm:px-4 py-2 sm:py-3 space-y-4 overscroll-contain"
      >
        {/* If initial or minimal conversation, show minimal branded greeting */}
        {isInitialState && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center my-auto animate-fade-slide-up px-2">
            {/* Minimal ORCA Crest */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white/[0.06] border border-white/20 backdrop-blur-md flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
              <svg
                viewBox="0 0 480 480"
                className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M480 240a240 240 0 0 0-240 240 240 240 0 0 0 240-240Z" />
                <path d="M240 0A240 240 0 0 0 0 240 240 240 0 0 0 240 0Z" />
                <path d="M480 240A240 240 0 0 0 240 0a240 240 0 0 0 240 240Z" />
                <path d="M240 480A240 240 0 0 0 0 240a240 240 0 0 0 240 240Z" />
              </svg>
            </div>

            {/* Short Minimal Useful Heading (Section 7) */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-sans max-w-2xl">
              How can ORCA assist you?
            </h1>

            <p className="text-white/60 text-xs sm:text-sm max-w-lg mt-3 font-normal leading-relaxed">
              Ask any question—from real-time marine intelligence, ocean telemetry, and smart navigation to science, calculations, and general knowledge.
            </p>

            {/* Suggested quick prompt pills */}
            <div className="mt-8 w-full max-w-2xl flex flex-wrap items-center justify-center gap-2">
              {ROLE_SUGGESTIONS[activeRole]?.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  className="px-3.5 py-2 rounded-xl text-xs text-white/80 bg-black/40 hover:bg-white hover:text-black border border-white/15 backdrop-blur-sm transition-all duration-200 cursor-pointer text-left shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Message Feed */}
        {!isInitialState && (
          <div className="w-full max-w-4xl mx-auto space-y-3 pt-2">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onRegenerate={regenerateResponse}
              />
            ))}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll To Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-6 sm:right-8 z-30 px-3 py-2 rounded-full bg-black/80 hover:bg-white hover:text-black text-white text-xs font-medium border border-white/20 backdrop-blur-md shadow-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer animate-fade-slide-up"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Latest</span>
        </button>
      )}

      {/* Responsive Chat Input Fixed at Bottom */}
      <div className="w-full pt-2 shrink-0">
        <ChatInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          activeRole={activeRole}
          onSelectRole={setActiveRole}
        />
      </div>
    </div>
  );
};

