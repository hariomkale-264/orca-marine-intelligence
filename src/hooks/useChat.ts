import { useState, useEffect, useCallback } from 'react';
import { ChatMessageItem, OrcaRole } from '../types.ts';
import { sendOrcaQuery } from '../services/geminiService.ts';

const STORAGE_KEY_ROLE = 'orca_active_role';
const STORAGE_KEY_LANG = 'orca_preferred_language';

const INITIAL_GREETING: Record<OrcaRole, string> = {
  Fisherman: `Hello. I am **ORCA**, your marine decision-support assistant configured for **Fishermen**. Ask me about real-time wave heights, surface water temperatures, potential fishing zones (PFZ), barometric trends, or safe harbor routes.`,
  'Marine Researchers': `Greetings. **ORCA Marine Intelligence** is calibrated for **Marine Researchers**. Query oceanographic datasets, sea surface salinity (SSS), CTD depth profiles, chlorophyll proxies, or acoustic telemetry logs.`,
  'Coastal Authorities': `Welcome. **ORCA Decision Support** is initialized for **Coastal Authorities**. Monitor coastal hazard indices, tidal surges, AIS vessel traffic boundaries, port clearance, and emergency alerts.`,
  'Maritime Operators': `**ORCA Maritime Navigation Engine** active for **Maritime Operators**. Inquire about commercial passage weather routing, significant wave height (Hs), hull stress vectors, bunkering currents, and port approach safety.`,
  'Default Mode': `Welcome to **ORCA Marine Intelligence**. How can ORCA assist your oceanic mission today? Ask any question regarding sea conditions, marine navigation, or oceanographic telemetry.`,
};

export function useChat() {
  const [activeRole, setActiveRoleState] = useState<OrcaRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE);
    return (saved as OrcaRole) || 'Default Mode';
  });

  const [preferredLanguage, setPreferredLanguageState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_LANG) || 'English';
  });

  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return [
      {
        id: 'init-msg',
        sender: 'orca',
        text: INITIAL_GREETING['Default Mode'],
        timestamp: timeStr,
        role: 'Default Mode',
      },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync role changes
  const setActiveRole = useCallback((newRole: OrcaRole) => {
    setActiveRoleState(newRole);
    localStorage.setItem(STORAGE_KEY_ROLE, newRole);

    // Provide a subtle confirmation message when role shifts
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: `role-switch-${Date.now()}`,
        sender: 'orca',
        text: `**Operating Role updated to: ${newRole}**\n\n${INITIAL_GREETING[newRole]}`,
        timestamp: timeStr,
        role: newRole,
      },
    ]);
  }, []);

  const setPreferredLanguage = useCallback((lang: string) => {
    setPreferredLanguageState(lang);
    localStorage.setItem(STORAGE_KEY_LANG, lang);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsg: ChatMessageItem = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: text.trim(),
        timestamp: userTime,
      };

      // 1. Display user message immediately
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // 2. Query Gemini / Server API with role, language, and recent history
        const result = await sendOrcaQuery({
          message: text.trim(),
          role: activeRole,
          language: preferredLanguage,
          history: [...messages, userMsg],
        });

        const orcaTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const orcaMsg: ChatMessageItem = {
          id: `orca-${Date.now()}`,
          sender: 'orca',
          text: result.reply,
          timestamp: orcaTime,
          role: activeRole,
          language: result.language,
          mode: result.mode,
        };

        setMessages((prev) => [...prev, orcaMsg]);
      } catch (err: any) {
        console.error('Failed to get ORCA response:', err);
        const orcaTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'orca',
            text: `An error occurred while connecting to ORCA telemetry intelligence. Please check your network connection and try again.`,
            timestamp: orcaTime,
            role: activeRole,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeRole, preferredLanguage, messages, isLoading]
  );

  const regenerateResponse = useCallback(
    async (messageId?: string) => {
      if (isLoading) return;
      // Find previous user message
      let promptToResend = '';
      if (messageId) {
        const msgIndex = messages.findIndex((m) => m.id === messageId);
        if (msgIndex > 0) {
          for (let i = msgIndex - 1; i >= 0; i--) {
            if (messages[i].sender === 'user') {
              promptToResend = messages[i].text;
              break;
            }
          }
        }
      }

      if (!promptToResend) {
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].sender === 'user') {
            promptToResend = messages[i].text;
            break;
          }
        }
      }

      if (promptToResend) {
        sendMessage(promptToResend);
      }
    },
    [messages, isLoading, sendMessage]
  );

  const clearChat = useCallback(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'orca',
        text: INITIAL_GREETING[activeRole],
        timestamp: timeStr,
        role: activeRole,
      },
    ]);
  }, [activeRole]);

  return {
    messages,
    isLoading,
    activeRole,
    setActiveRole,
    preferredLanguage,
    setPreferredLanguage,
    sendMessage,
    regenerateResponse,
    clearChat,
  };
}
