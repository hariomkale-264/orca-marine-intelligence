/**
 * Voice Selection Helper for Browser SpeechSynthesis
 *
 * Implements intelligent matching priority:
 * 1. Exact locale match (e.g. 'mr-IN')
 * 2. Indian locale match (e.g. '*-IN' for matching language)
 * 3. Same language match (e.g. starts with 'mr' or 'hi')
 * 4. Fallback locale candidates (e.g. hi-IN for Devanagari or en-IN)
 * 5. Browser default fallback voice
 */

import { LanguageDetectionResult } from './detectLanguage.ts';

// Normalize locale string: 'mr_IN' -> 'mr-in', 'hi-in' -> 'hi-in'
function normalizeLocale(locale: string): string {
  return locale.toLowerCase().replace(/_/g, '-');
}

/**
 * Returns the best matching SpeechSynthesisVoice for the detected language.
 */
export function getBestVoice(
  langInfo: LanguageDetectionResult,
  availableVoices: SpeechSynthesisVoice[]
): { voice: SpeechSynthesisVoice | null; matchType: 'exact' | 'indic' | 'language' | 'fallback' | 'default' | 'none' } {
  if (!availableVoices || availableVoices.length === 0) {
    return { voice: null, matchType: 'none' };
  }

  const targetLocale = normalizeLocale(langInfo.ttsLocale);
  const targetLangCode = langInfo.code.toLowerCase();

  // 1. Exact locale match (e.g. 'mr-in', 'hi-in', 'en-in')
  for (const voice of availableVoices) {
    const vLocale = normalizeLocale(voice.lang);
    if (vLocale === targetLocale) {
      return { voice, matchType: 'exact' };
    }
  }

  // 2. Indian locale match with matching language (e.g. 'mr-in' or 'hi-in' variant)
  for (const voice of availableVoices) {
    const vLocale = normalizeLocale(voice.lang);
    if (vLocale.startsWith(targetLangCode) && vLocale.includes('-in')) {
      return { voice, matchType: 'indic' };
    }
  }

  // 3. Same language match regardless of country (e.g. 'mr', 'hi', 'en-US')
  for (const voice of availableVoices) {
    const vLocale = normalizeLocale(voice.lang);
    if (vLocale.startsWith(targetLangCode)) {
      return { voice, matchType: 'language' };
    }
  }

  // 4. Try fallback locales defined in language config
  if (langInfo.fallbackLocales && langInfo.fallbackLocales.length > 0) {
    for (const fb of langInfo.fallbackLocales) {
      const normFb = normalizeLocale(fb);
      const matched = availableVoices.find((v) => normalizeLocale(v.lang) === normFb);
      if (matched) {
        return { voice: matched, matchType: 'fallback' };
      }
    }

    // Try fallback by prefix
    for (const fb of langInfo.fallbackLocales) {
      const prefix = fb.split(/[-_]/)[0].toLowerCase();
      const matched = availableVoices.find((v) => normalizeLocale(v.lang).startsWith(prefix));
      if (matched) {
        return { voice: matched, matchType: 'fallback' };
      }
    }
  }

  // 5. If Devanagari (Marathi/Hindi) and no voice found, look for any Indian voice (e.g. hi-IN or en-IN)
  if (langInfo.isDevanagari) {
    const indicVoice = availableVoices.find((v) => {
      const loc = normalizeLocale(v.lang);
      return loc.includes('-in') || loc.startsWith('hi') || loc.startsWith('mr');
    });
    if (indicVoice) {
      return { voice: indicVoice, matchType: 'fallback' };
    }
  }

  // 6. Browser default voice or first available
  const defaultVoice = availableVoices.find((v) => v.default) || availableVoices[0] || null;
  return { voice: defaultVoice, matchType: defaultVoice ? 'default' : 'none' };
}

/**
 * Loads available speech synthesis voices asynchronously across browsers.
 */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const current = window.speechSynthesis.getVoices();
    if (current && current.length > 0) {
      resolve(current);
      return;
    }

    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(voices || []);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Safety timeout in case event doesn't fire
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(window.speechSynthesis.getVoices() || []);
    }, 600);
  });
}
