import type { ZodType } from 'zod';
import { LLMError } from './types';
import { parseModelJson } from './repair';

const MAX_ATTEMPTS = 3;

function wasCancelled(err: unknown): boolean {
  return err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('aborted'));
}

function isTransientTransportError(err: unknown): boolean {
  if (err instanceof LLMError) return err.retryable;
  const message = err instanceof Error ? err.message : String(err);
  return /\b(408|409|425|429|500|502|503|504)\b|high demand|overloaded|temporar|rate limit|network|failed to fetch/i.test(message);
}

function waitForRetry(attempt: number, signal?: AbortSignal): Promise<void> {
  const delay = 600 * 2 ** attempt;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, delay);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('The request was cancelled.', 'AbortError'));
    }, { once: true });
  });
}

/**
 * Shared helper: call an endpoint, parse JSON, and validate with a schema.
 * A new completion is requested for transient provider failures and malformed
 * output. Generation deliberately has no elapsed-time limit: local models can
 * take several minutes on CPU-only machines.
 */
export async function callWithRetry<T>(
  fetchFn: (signal: AbortSignal) => Promise<string>,
  schema: ZodType<T>,
  signal?: AbortSignal
): Promise<T> {
  const activeSignal = signal ?? new AbortController().signal;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const rawText = await fetchFn(activeSignal);
      if (!rawText.trim()) {
        throw new LLMError('llm_bad_output', 'The model returned an empty response.');
      }

      let parsed: unknown;
      try {
        parsed = parseModelJson(rawText);
      } catch {
        throw new LLMError('llm_bad_output', 'The model returned incomplete or invalid JSON.');
      }

      const result = schema.safeParse(parsed);
      if (result.success) return result.data;
      throw new LLMError('llm_bad_output', 'The model returned JSON that did not match the requested format.');
    } catch (err) {
      if (wasCancelled(err)) throw err;
      lastError = err;
      const retryable = err instanceof LLMError
        ? err.code === 'llm_bad_output' || err.retryable
        : isTransientTransportError(err);
      if (!retryable || attempt === MAX_ATTEMPTS - 1) break;
      await waitForRetry(attempt, signal);
    }
  }

  if (lastError instanceof LLMError && lastError.code === 'llm_bad_output') {
    throw new LLMError(
      'llm_bad_output',
      `The model could not produce a complete valid response after ${MAX_ATTEMPTS} attempts. Increase “Maximum response tokens” to at least 3,072, then retry.`,
      lastError
    );
  }
  if (lastError instanceof LLMError && lastError.retryable) {
    throw new LLMError(
      lastError.code,
      `The model is still temporarily busy after ${MAX_ATTEMPTS} attempts. Wait a minute, then retry.`,
      lastError
    );
  }
  if (lastError instanceof LLMError) throw lastError;
  throw new LLMError(
    'llm_unreachable',
    'Cannot reach the model endpoint. Check the model connection and try again.',
    lastError
  );
}
