import type { ZodType } from 'zod';
import { callWithRetry } from './client';
import type { LLMOptions } from './types';
import { extractJson } from './repair';

export function createOpenAICompatClient(baseUrl: string, model: string) {
  return {
    async generate<T>(
      prompt: string,
      schema: ZodType<T>,
      schemaName: string,
      options: LLMOptions = {}
    ): Promise<T> {
      const { temperature = 0.3, signal } = options;

      const fetchFn = async (sig: AbortSignal): Promise<string> => {
        const body = {
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: schemaName,
              strict: false,
            },
          },
          temperature,
        };

        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: sig,
        });

        if (!res.ok) {
          throw new Error(`OpenAI-compat endpoint returned HTTP ${res.status}: ${await res.text()}`);
        }

        const data = await res.json() as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content ?? '';
        return extractJson(content);
      };

      return callWithRetry(fetchFn, schema, signal);
    },
  };
}
