import type { ZodType } from 'zod';
import { callWithRetry } from './client';
import type { LLMOptions } from './types';
import { extractJson } from './repair';

export function createGeminiClient(apiKey: string, model: string) {
  return {
    async generate<T>(
      prompt: string,
      schema: ZodType<T>,
      _schemaName: string,
      options: LLMOptions = {}
    ): Promise<T> {
      const { temperature = 0.3, signal } = options;

      const fetchFn = async (sig: AbortSignal): Promise<string> => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const body = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature,
          },
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: sig,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(err.error?.message ?? `Gemini API error ${res.status}`);
        }

        const data = await res.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return extractJson(content);
      };

      return callWithRetry(fetchFn, schema, signal);
    },
  };
}
