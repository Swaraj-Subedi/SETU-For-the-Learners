import type { ZodType } from 'zod';
import { callWithRetry } from './client';
import type { LLMOptions } from './types';
import { LLMError } from './types';

export function createOpenAICompatClient(baseUrl: string, model: string) {
  return {
    async generate<T>(
      prompt: string,
      schema: ZodType<T>,
      _schemaName: string,
      options: LLMOptions = {}
    ): Promise<T> {
      const { temperature = 0.3, maxTokens = 800, signal } = options;
      const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

      const fetchFn = async (sig: AbortSignal): Promise<string> => {
        const bodies: Array<Record<string, unknown>> = [
          {
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' },
          },
          {
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: maxTokens,
          },
        ];

        let lastError = 'OpenAI-compatible endpoint returned no response';
        for (const body of bodies) {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: sig,
          });

          if (!res.ok) {
            lastError = `OpenAI-compat endpoint returned HTTP ${res.status}`;
            if (res.status === 400 || res.status === 422) continue;
            const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
            throw new LLMError(
              'llm_unreachable',
              retryable ? 'The model server is temporarily busy. Retrying automatically.' : lastError,
              undefined,
              retryable
            );
          }

          const data = await res.json() as {
            choices?: Array<{ message?: { content?: string | null } }>;
          };
          return data.choices?.[0]?.message?.content ?? '';
        }

        throw new LLMError('llm_unreachable', lastError);
      };

      return callWithRetry(fetchFn, schema, signal);
    },
  };
}
