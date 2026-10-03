import type { ZodType } from 'zod';
import { callWithRetry } from './client';
import { LLMError } from './types';
import type { LLMOptions } from './types';

/** Accept both the short API identifier and the `models/...` name Google lists. */
export function normalizeGeminiModel(model: string): string {
  const normalized = model.trim().replace(/^models\//i, '');
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(normalized)) {
    throw new Error('Enter a Gemini model name such as gemini-3.8-flash or models/gemini-3.8-flash.');
  }
  return normalized;
}

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: GeminiPart[] };
  }>;
  promptFeedback?: { blockReason?: string; blockReasonMessage?: string };
  error?: { message?: string };
}

function collectText(data: GeminiResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((part) => !part.thought)
    .map((part) => part.text ?? '')
    .join('')
    .trim() || parts.map((part) => part.text ?? '').join('').trim();
}

export function createGeminiClient(apiKey: string, model: string) {
  return {
    async generate<T>(
      prompt: string,
      schema: ZodType<T>,
      _schemaName: string,
      options: LLMOptions = {}
    ): Promise<T> {
      const { temperature = 0.3, maxTokens = 800, signal } = options;
      const modelName = normalizeGeminiModel(model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${apiKey}`;

      const fetchFn = async (sig: AbortSignal): Promise<string> => {
        const configs: Array<Record<string, unknown>> = [
          {
            responseMimeType: 'application/json',
            temperature,
            maxOutputTokens: maxTokens,
            thinkingConfig: { thinkingBudget: 0 },
          },
          {
            responseMimeType: 'application/json',
            temperature,
            maxOutputTokens: maxTokens,
          },
          {
            temperature,
            maxOutputTokens: maxTokens,
          },
        ];

        let lastError = 'Gemini returned no response';
        for (const generationConfig of configs) {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig,
            }),
            signal: sig,
          });

          const data = await res.json().catch(() => ({})) as GeminiResponse;
          if (!res.ok) {
            lastError = data.error?.message ?? `Gemini API error ${res.status}`;
            if (res.status === 400) continue;
            const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
            throw new LLMError(
              'llm_unreachable',
              retryable
                ? 'Gemini is temporarily busy. Retrying automatically.'
                : `Gemini could not accept this request: ${lastError}`,
              undefined,
              retryable
            );
          }

          if (data.promptFeedback?.blockReason) {
            throw new LLMError(
              'llm_bad_output',
              data.promptFeedback.blockReasonMessage
                ?? `Gemini blocked the request (${data.promptFeedback.blockReason}).`
            );
          }

          const content = collectText(data);
          if (content) return content;

          const reason = data.candidates?.[0]?.finishReason;
          lastError = reason === 'MAX_TOKENS'
            ? 'Gemini used the token budget before finishing the JSON. Raise maximum response tokens.'
            : `Gemini returned no text${reason ? ` (${reason})` : ''}.`;
          if (reason === 'MAX_TOKENS') {
            throw new LLMError('llm_bad_output', lastError);
          }
        }

        throw new LLMError('llm_bad_output', lastError);
      };

      return callWithRetry(fetchFn, schema, signal);
    },
  };
}
