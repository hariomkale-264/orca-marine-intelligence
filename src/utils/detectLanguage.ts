/**
 * Language Detection & TTS Locale Mapping Utility for ORCA Marine Intelligence
 * 
 * Supports high-accuracy detection for:
 * - English (en-IN)
 * - Marathi (mr-IN)
 * - Hindi (hi-IN)
 * 
 * Extensible for additional Indian languages:
 * - Gujarati (gu-IN), Bengali (bn-IN), Tamil (ta-IN), Telugu (te-IN),
 *   Kannada (kn-IN), Malayalam (ml-IN), Punjabi (pa-IN)
 */

export interface LanguageDetectionResult {
  code: string;           // ISO 639-1 code e.g. 'mr', 'hi', 'en'
  name: string;           // Human readable e.g. 'Marathi', 'Hindi', 'English'
  ttsLocale: string;      // BCP 47 locale tag e.g. 'mr-IN', 'hi-IN', 'en-IN'
  fallbackLocales: string[]; // Fallback candidates if primary voice is missing
  confidence: number;     // 0 to 1
  isDevanagari?: boolean;
}

export const SUPPORTED_TTS_LANGUAGES: Record<string, LanguageDetectionResult> = {
  mr: {
    code: 'mr',
    name: 'Marathi',
    ttsLocale: 'mr-IN',
    fallbackLocales: ['mr_IN', 'mr', 'hi-IN', 'hi_IN', 'en-IN'],
    confidence: 1.0,
    isDevanagari: true,
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    ttsLocale: 'hi-IN',
    fallbackLocales: ['hi_IN', 'hi', 'en-IN', 'en_IN'],
    confidence: 1.0,
    isDevanagari: true,
  },
  en: {
    code: 'en',
    name: 'English',
    ttsLocale: 'en-IN',
    fallbackLocales: ['en_IN', 'en-GB', 'en-US', 'en'],
    confidence: 1.0,
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    ttsLocale: 'gu-IN',
    fallbackLocales: ['gu_IN', 'gu', 'hi-IN'],
    confidence: 1.0,
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    ttsLocale: 'bn-IN',
    fallbackLocales: ['bn_IN', 'bn-BD', 'bn', 'hi-IN'],
    confidence: 1.0,
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    ttsLocale: 'ta-IN',
    fallbackLocales: ['ta_IN', 'ta-LK', 'ta', 'en-IN'],
    confidence: 1.0,
  },
  te: {
    code: 'te',
    name: 'Telugu',
    ttsLocale: 'te-IN',
    fallbackLocales: ['te_IN', 'te', 'en-IN'],
    confidence: 1.0,
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    ttsLocale: 'kn-IN',
    fallbackLocales: ['kn_IN', 'kn', 'en-IN'],
    confidence: 1.0,
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    ttsLocale: 'ml-IN',
    fallbackLocales: ['ml_IN', 'ml', 'en-IN'],
    confidence: 1.0,
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    ttsLocale: 'pa-IN',
    fallbackLocales: ['pa_IN', 'pa', 'hi-IN'],
    confidence: 1.0,
  },
};

// Distinct Marathi vocabulary, auxiliary verbs, and case markers
const MARATHI_MARKERS = [
  'आहे', 'आहेत', 'होते', 'होती', 'झाले', 'झाली', 'झाला', 'करावे',
  'येण्याची', 'शक्यता', 'किनाऱ्याजवळ', 'मासेमारी', 'असेल', 'नाही',
  'म्हणून', 'आपल्या', 'त्यांच्या', 'मध्ये', 'कसे', 'काय', 'केले',
  'येईल', 'सांगतो', 'लाटा', 'पाणी', 'माहिती', 'समुद्रात', 'किनाऱ्यापासून',
  'सुरक्षित', 'अंतर', 'ठेवा', 'हवामान', 'वारे', 'नॉट्स', 'मीटरपर्यंत',
  'खवळलेला', 'सागरी', 'बुद्धिमत्ता', 'प्रणाली', 'बोट', 'नाव', 'मच्छिमार',
  'मदत', 'खाडी', 'पट्टा', 'वेळ', 'जवळ', 'दिवस', 'रात्र', 'महिना'
];

// Distinct Hindi vocabulary, auxiliary verbs, and case markers
const HINDI_MARKERS = [
  'है', 'हैं', 'था', 'थी', 'थे', 'होगा', 'होगी', 'होंगे', 'होगे',
  'सकता', 'सकती', 'सकते', 'संभावना', 'कीजिए', 'करें', 'समुद्र',
  'लहरों', 'ऊंची', 'मछली', 'मछुआरों', 'तटीय', 'सुरक्षा', 'मौसम',
  'तापमान', 'अपना', 'हमारे', 'इसका', 'उसका', 'नहीं', 'कहा', 'गया',
  'गई', 'गए', 'होने', 'चेतावनी', 'हवा', 'किलोमीटर', 'स्थान', 'कृपया',
  'सकेंगे', 'सूचना', 'मार्ग', 'नाविक', 'बंदरगाह', 'दिन', 'रात'
];

/**
 * Normalizes input text and detects the language.
 * 
 * @param text The message text to analyze
 * @param metadataLang Optional explicit language tag or hint from server (e.g. 'mr', 'hi', 'en', 'Marathi')
 * @returns LanguageDetectionResult with code, ttsLocale, and fallback candidates
 */
export function detectLanguage(text: string, metadataLang?: string): LanguageDetectionResult {
  if (!text || typeof text !== 'string') {
    return SUPPORTED_TTS_LANGUAGES.en;
  }

  // 1. If trusted metadata specifies an exact supported language code, map directly
  if (metadataLang) {
    const norm = metadataLang.toLowerCase().trim();
    if (norm === 'mr' || norm === 'marathi') return SUPPORTED_TTS_LANGUAGES.mr;
    if (norm === 'hi' || norm === 'hindi') return SUPPORTED_TTS_LANGUAGES.hi;
    if (norm === 'en' || norm === 'english') return SUPPORTED_TTS_LANGUAGES.en;
    if (norm === 'gu' || norm === 'gujarati') return SUPPORTED_TTS_LANGUAGES.gu;
    if (norm === 'bn' || norm === 'bengali') return SUPPORTED_TTS_LANGUAGES.bn;
    if (norm === 'ta' || norm === 'tamil') return SUPPORTED_TTS_LANGUAGES.ta;
    if (norm === 'te' || norm === 'telugu') return SUPPORTED_TTS_LANGUAGES.te;
    if (norm === 'kn' || norm === 'kannada') return SUPPORTED_TTS_LANGUAGES.kn;
    if (norm === 'ml' || norm === 'malayalam') return SUPPORTED_TTS_LANGUAGES.ml;
    if (norm === 'pa' || norm === 'punjabi') return SUPPORTED_TTS_LANGUAGES.pa;
  }

  // Strip markdown, numbers, and common punctuation for accurate script counting
  const clean = text
    .replace(/[*_#`~\[\]()<>]/g, ' ')
    .replace(/[0-9]/g, '')
    .trim();

  // Character counts by Unicode script block
  let devanagariCount = 0;
  let tamilCount = 0;
  let teluguCount = 0;
  let kannadaCount = 0;
  let malayalamCount = 0;
  let bengaliCount = 0;
  let gujaratiCount = 0;
  let gurmukhiCount = 0;
  let latinCount = 0;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097f) devanagariCount++;
    else if (code >= 0x0b80 && code <= 0x0bff) tamilCount++;
    else if (code >= 0x0c00 && code <= 0x0c7f) teluguCount++;
    else if (code >= 0x0c80 && code <= 0x0cff) kannadaCount++;
    else if (code >= 0x0d00 && code <= 0x0d7f) malayalamCount++;
    else if (code >= 0x0980 && code <= 0x09ff) bengaliCount++;
    else if (code >= 0x0a80 && code <= 0x0aff) gujaratiCount++;
    else if (code >= 0x0a00 && code <= 0x0a7f) gurmukhiCount++;
    else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) latinCount++;
  }

  // 2. Check distinct Indian scripts first
  if (tamilCount > 5 && tamilCount > latinCount) return SUPPORTED_TTS_LANGUAGES.ta;
  if (teluguCount > 5 && teluguCount > latinCount) return SUPPORTED_TTS_LANGUAGES.te;
  if (kannadaCount > 5 && kannadaCount > latinCount) return SUPPORTED_TTS_LANGUAGES.kn;
  if (malayalamCount > 5 && malayalamCount > latinCount) return SUPPORTED_TTS_LANGUAGES.ml;
  if (bengaliCount > 5 && bengaliCount > latinCount) return SUPPORTED_TTS_LANGUAGES.bn;
  if (gujaratiCount > 5 && gujaratiCount > latinCount) return SUPPORTED_TTS_LANGUAGES.gu;
  if (gurmukhiCount > 5 && gurmukhiCount > latinCount) return SUPPORTED_TTS_LANGUAGES.pa;

  // 3. Devanagari Script Analysis: Differentiate Marathi vs Hindi
  if (devanagariCount > 0 && devanagariCount >= latinCount * 0.3) {
    let marathiScore = 0;
    let hindiScore = 0;

    // A. Character-level phonological tests:
    // 'ळ' (U+0933 - Marathi retroflex lateral approximant) is signature Marathi
    if (/[\u0933]/.test(clean)) {
      marathiScore += 8;
    }
    // 'ऱ' (U+0931 - Eyelash Reph) used in Marathi
    if (/[\u0931]/.test(clean)) {
      marathiScore += 5;
    }
    // 'ॅ' (U+0945) / 'ॲ' (U+0972) / 'ऑ' (U+0911)
    if (/[\u0945\u0972\u0911]/.test(clean)) {
      marathiScore += 4;
    }

    // B. Word-level frequency tests:
    const lowerClean = clean.toLowerCase();
    for (const word of MARATHI_MARKERS) {
      if (lowerClean.includes(word)) {
        marathiScore += 3;
      }
    }

    for (const word of HINDI_MARKERS) {
      if (lowerClean.includes(word)) {
        hindiScore += 3;
      }
    }

    // Suffix checks:
    // Marathi common suffixes: -च्या, -तील, -साठी, -कडून, -मध्ये, -तात
    if (/च्या|तील|साठी|कडून|मध्ये|तात|ल्या|णार/.test(clean)) {
      marathiScore += 4;
    }
    // Hindi common postpositions: के, की, का, में, से, को, पर
    if (/\s(के|की|का|में|से|को|पर|और|था|थी)\s/.test(` ${clean} `)) {
      hindiScore += 4;
    }

    if (marathiScore > hindiScore) {
      return {
        ...SUPPORTED_TTS_LANGUAGES.mr,
        confidence: Math.min(1.0, 0.6 + (marathiScore / (marathiScore + hindiScore + 1)) * 0.4),
      };
    }

    if (hindiScore > marathiScore) {
      return {
        ...SUPPORTED_TTS_LANGUAGES.hi,
        confidence: Math.min(1.0, 0.6 + (hindiScore / (marathiScore + hindiScore + 1)) * 0.4),
      };
    }

    // Default to Marathi if tie or generic Devanagari since ORCA is primarily maritime Maharashtra/Konkan coast,
    // or Hindi if standard Devanagari markers indicate
    return SUPPORTED_TTS_LANGUAGES.mr;
  }

  // 4. Default to English (en-IN)
  return SUPPORTED_TTS_LANGUAGES.en;
}
