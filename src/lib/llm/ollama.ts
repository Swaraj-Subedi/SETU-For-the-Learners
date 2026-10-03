import type { ZodType } from 'zod';
import { callWithRetry } from './client';
import type { LLMOptions } from './types';
import { extractJson } from './repair';

export function createOllamaClient(baseUrl: string, model: string) {
  return {
    async generate<T>(
      prompt: string,
      schema: ZodType<T>,
      _schemaName: string,
      options: LLMOptions = {}
    ): Promise<T> {
      const { temperature = 0.3, numCtx = 8192, signal } = options;

      const fetchFn = async (sig: AbortSignal): Promise<string> => {
        const body = {
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          format: 'json',
          options: {
            temperature,
            num_ctx: numCtx,
            ...(options.seed !== undefined ? { seed: options.seed } : {}),
          },
        };

        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: sig,
        });

        if (!res.ok) {
          throw new Error(`Ollama returned HTTP ${res.status}: ${await res.text()}`);
        }

        const data = await res.json() as { message?: { content?: string }; response?: string };
        const content = data.message?.content ?? data.response ?? '';

        // qwen3 thinking mode: strip <think> blocks
        return extractJson(content);
      };

      return callWithRetry(fetchFn, schema, signal);
    },
  };
}
