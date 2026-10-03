import type { LLMConfig } from '@/types';
import type { ZodType } from 'zod';

export interface LLMOptions {
  temperature?: number;
  seed?: number;
  numCtx?: number;
  signal?: AbortSignal;
}

export interface LLMClient {
  generate<T>(
    prompt: string,
    schema: ZodType<T>,
    schemaName: string,
    options?: LLMOptions
  ): Promise<T>;
}

export type LLMErrorCode = 'llm_unreachable' | 'llm_timeout' | 'llm_bad_output';

export class LLMError extends Error {
  constructor(
    public readonly code: LLMErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export type { LLMConfig };
