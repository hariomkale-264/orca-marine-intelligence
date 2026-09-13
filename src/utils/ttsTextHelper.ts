/**
 * Text preparation and chunking helper for Web SpeechSynthesis.
 * Ensures natural spoken speech without markdown syntax artifacts,
 * and splits long responses into safe sequential chunks to prevent browser speech timeouts.
 */

/**
 * Strips markdown and special formatting syntax so TTS pronounces natural words
 * instead of saying "asterisk asterisk bullet code".
 * 
 * IMPORTANT: Preserves exact words, phrasing, and original script without translating.
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 2. Convert markdown links [Label](url) -> Label
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // 3. Remove header markers ###, ##, #
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 4. Remove bold & italic markup (**bold**, *italic*, __bold__, _italic_)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');

  // 5. Convert bullet points (- , • , * ) into clean pauses
  text = text.replace(/^\s*[-•*]\s+/gm, '');

  // 6. Strip HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // 7. Remove parenthetical citations like *(Based on telemetry)*
  text = text.replace(/\*\((.*?)\)\*/g, '($1)');

  // 8. Clean newlines safely:
  // If line ends with punctuation, just replace newline with a space.
  // If line doesn't end with punctuation, add a period pause.
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const normalizedLines = lines.map((line) => {
    if (/[.?!।॥:;,]$/.test(line)) {
      return line;
    }
    return line + '.';
  });

  text = normalizedLines.join(' ');

  // 9. Clean any double punctuation or extra spaces
  text = text.replace(/\s+([.,?!।॥])/g, '$1');
  text = text.replace(/([.,?!।॥])\1+/g, '$1');
  text = text.replace(/\s{2,}/g, ' ');

  return text.trim();
}

/**
 * Splits text into manageable speech chunks without breaking words, numbers, or sentences.
 * Chrome and Safari have known bugs where utterances longer than ~15-20 seconds can freeze.
 * Chunking safely prevents speech cancellation on long AI responses.
 */
export function splitIntoSpeechChunks(text: string, maxChunkLength = 160): string[] {
  if (!text || text.trim().length === 0) return [];
  if (text.length <= maxChunkLength) return [text.trim()];

  const chunks: string[] = [];

  // Split on sentence boundaries:
  // English period (not between digits), ?, !, and Indic Danda । or ॥ followed by space or end
  // We use tokenization that protects decimal numbers (e.g. 1.2, 28.4°C)
  const rawSentences: string[] = [];
  let buffer = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    buffer += char;

    const isTerminator =
      char === '?' ||
      char === '!' ||
      char === '।' ||
      char === '॥' ||
      (char === '.' && (i === text.length - 1 || !/\d/.test(text[i + 1]) || !/\d/.test(text[i - 1])));

    if (isTerminator) {
      // Check if next char is space or end of string
      const nextChar = text[i + 1];
      if (!nextChar || /\s/.test(nextChar) || nextChar === '"' || nextChar === ')') {
        if (buffer.trim()) {
          rawSentences.push(buffer.trim());
          buffer = '';
        }
      }
    }
  }

  if (buffer.trim()) {
    rawSentences.push(buffer.trim());
  }

  let currentChunk = '';

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // If adding this sentence stays within limit:
    if ((currentChunk + ' ' + trimmed).trim().length <= maxChunkLength) {
      currentChunk = (currentChunk + ' ' + trimmed).trim();
    } else {
      // If current chunk has content, push it first
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      // If the individual sentence itself is longer than maxChunkLength, split by commas or spaces
      if (trimmed.length > maxChunkLength) {
        const subParts = splitLongSentence(trimmed, maxChunkLength);
        for (let i = 0; i < subParts.length; i++) {
          if (i === subParts.length - 1 && subParts[i].length < maxChunkLength * 0.5) {
            currentChunk = subParts[i];
          } else {
            chunks.push(subParts[i]);
          }
        }
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Splits a single long sentence by clauses (comma, semicolon, dash) or space boundaries.
 */
function splitLongSentence(sentence: string, maxLength: number): string[] {
  const result: string[] = [];
  const words = sentence.split(' ');
  let buffer = '';

  for (const word of words) {
    if ((buffer + ' ' + word).trim().length <= maxLength) {
      buffer = (buffer + ' ' + word).trim();
    } else {
      if (buffer) result.push(buffer);
      buffer = word;
    }
  }

  if (buffer) {
    result.push(buffer);
  }

  return result;
}
