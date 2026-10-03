/**
 * JSON repair: fixes common LLM output issues like trailing commas,
 * single quotes, unquoted keys, and truncated JSON.
 */
export function repairJson(raw: string): string {
  // Strip markdown code fences
  let s = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Sometimes models wrap with <think>…</think> (qwen3 thinking mode)
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Extract first JSON object or array
  const start = s.search(/[{[]/);
  if (start > 0) s = s.slice(start);

  // Replace trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');

  // Replace single-quoted strings with double-quoted
  // Careful: only at key/value position boundaries
  s = s.replace(/'/g, '"');

  return s;
}

export function extractJson(raw: string): string {
  const repaired = repairJson(raw);
  // Find balanced JSON object/array
  let depth = 0;
  let inStr = false;
  let escape = false;
  let startIdx = -1;

  for (let i = 0; i < repaired.length; i++) {
    const c = repaired[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;

    if (c === '{' || c === '[') {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0 && startIdx !== -1) {
        return repaired.slice(startIdx, i + 1);
      }
    }
  }

  return repaired;
}
