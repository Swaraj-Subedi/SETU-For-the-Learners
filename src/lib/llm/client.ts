import type { ZodType } from 'zod';
import { LLMError } from './types';
import { extractJson } from './repair';

const TIMEOUT_MS = 120_000; // 2 minutes per call

/**
 * Shared helper: POST to an endpoint, parse JSON, validate with schema,
 * retry once with JSON repair if parse fails.
 */
export async function callWithRetry<T>(
  fetchFn: (signal: AbortSignal) => Promise<string>,
  schema: ZodType<T>,
  signal?: AbortSignal
): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal
    ? AbortSignal.any([signal, timeout])
    : timeout;

  let rawText: string;
  try {
    rawText = await fetchFn(combined);
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new LLMError('llm_timeout', 'The model took too long to respond. Try a shorter prompt or a faster model.');
    }
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
      throw err; // re-throw cancellation
    }
    throw new LLMError('llm_unreachable', `Cannot reach the model endpoint: ${err instanceof Error ? err.message : String(err)}`, err);
  }

  // First attempt: direct parse
  try {
    const parsed = JSON.parse(rawText) as unknown;
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
  } catch {
    // fall through to repair
  }

  // Second attempt: extract and repair
  try {
    const repaired = extractJson(rawText);
    const parsed = JSON.parse(repaired) as unknown;
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    throw new LLMError('llm_bad_output', `Model output did not match expected schema: ${result.error.message}`);
  } catch (err) {
    if (err instanceof LLMError) throw err;
    throw new LLMError('llm_bad_output', `Could not parse model output as JSON. Raw: ${rawText.slice(0, 200)}`);
  }
}
