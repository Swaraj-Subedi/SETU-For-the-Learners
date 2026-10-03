import type { ZodType } from 'zod';
import { callWithRetry } from './client';
import type { LLMOptions } from './types';
import { LLMError } from './types';

export function createOllamaClient(baseUrl: string, model: string) {
  return {
    async generate<T>(
      prompt: string,
      schema: ZodType<T>,
      _schemaName: string,
      options: LLMOptions = {}
    ): Promise<T> {
      const { temperature = 0.3, numCtx = 8192, maxTokens = 800, signal } = options;
      const endpoint = `${baseUrl.replace(/\/$/, '')}/api/chat`;

      const fetchFn = async (sig: AbortSignal): Promise<string> => {
        const attempts: Array<Record<string, unknown>> = [
          { format: 'json', think: false },
          { format: 'json' },
          {},
        ];

        let lastError = 'Ollama returned no response';
        for (const extra of attempts) {
          const body = {
            model,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
            ...extra,
            options: {
              temperature,
              num_ctx: numCtx,
              num_predict: maxTokens,
              ...(options.seed !== undefined ? { seed: options.seed } : {}),
            },
          };

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: sig,
          });

          if (!res.ok) {
            lastError = `Ollama returned HTTP ${res.status}`;
            // Retry without optional fields that older Ollama builds reject.
            if (res.status === 400 || res.status === 422) continue;
            const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
            throw new LLMError(
              'llm_unreachable',
              retryable ? 'Ollama is temporarily busy. Retrying automatically.' : lastError,
              undefined,
              retryable
            );
          }

          const data = await res.json() as { message?: { content?: string }; response?: string };
          return data.message?.content ?? data.response ?? '';
        }

        throw new LLMError('llm_unreachable', lastError);
      };

      return callWithRetry(fetchFn, schema, signal);
    },
  };
}
