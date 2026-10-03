/**
 * JSON repair: fixes common LLM output issues like trailing commas,
 * single quotes, unquoted keys, and truncated JSON.
 *
 * Never rewrite apostrophes inside already-valid JSON strings. A global
 * `'` → `"` replacement turns `Newton's` into broken JSON and is why
 * connected models still failed at paper generation.
 */

export function stripModelWrappers(raw: string): string {
  let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Incomplete thinking block: keep any JSON that follows, otherwise drop it.
  const openThink = s.search(/<think>/i);
  if (openThink !== -1) {
    const after = s.slice(openThink);
    const jsonStart = after.search(/[{[]/);
    s = jsonStart >= 0 ? after.slice(jsonStart) : s.slice(0, openThink).trim();
  }

  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return s;
}

function copyDoubleQuotedString(s: string, start: number): { text: string; end: number } {
  let i = start + 1;
  let escape = false;
  while (i < s.length) {
    const c = s[i];
    if (escape) {
      escape = false;
      i++;
      continue;
    }
    if (c === '\\') {
      escape = true;
      i++;
      continue;
    }
    if (c === '"') {
      return { text: s.slice(start, i + 1), end: i + 1 };
    }
    i++;
  }
  return { text: s.slice(start), end: s.length };
}

function convertSingleQuotedStrings(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"') {
      const copied = copyDoubleQuotedString(s, i);
      out += copied.text;
      i = copied.end;
      continue;
    }
    if (c === "'") {
      let j = i + 1;
      let escape = false;
      let inner = '';
      while (j < s.length) {
        const ch = s[j];
        if (escape) {
          inner += ch;
          escape = false;
          j++;
          continue;
        }
        if (ch === '\\') {
          escape = true;
          j++;
          continue;
        }
        if (ch === "'") break;
        inner += ch;
        j++;
      }
      out += JSON.stringify(inner);
      i = Math.min(j + 1, s.length);
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

export function repairJson(raw: string): string {
  let s = stripModelWrappers(raw);

  const start = s.search(/[{[]/);
  if (start > 0) s = s.slice(start);

  s = s.replace(/,\s*([}\]])/g, '$1');
  // JavaScript-style comments occasionally accompany otherwise valid JSON.
  // Restrict removal to text outside quoted strings so URLs and explanations
  // remain intact.
  s = stripJsonComments(s);
  s = convertSingleQuotedStrings(s);
  return s;
}

function stripJsonComments(s: string): string {
  let out = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (escape) {
      out += c;
      escape = false;
      continue;
    }
    if (c === '\\' && inString) {
      out += c;
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      out += c;
      continue;
    }
    if (!inString && c === '/' && s[i + 1] === '/') {
      i = s.indexOf('\n', i + 2);
      if (i === -1) break;
      out += '\n';
      continue;
    }
    if (!inString && c === '/' && s[i + 1] === '*') {
      const close = s.indexOf('*/', i + 2);
      i = close === -1 ? s.length : close + 1;
      continue;
    }
    out += c;
  }
  return out;
}

export function extractJson(raw: string): string {
  const repaired = repairJson(raw);
  let depth = 0;
  let inStr = false;
  let escape = false;
  let startIdx = -1;

  for (let i = 0; i < repaired.length; i++) {
    const c = repaired[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\') {
      escape = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
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

export function parseModelJson(raw: string): unknown {
  const stripped = stripModelWrappers(raw);
  try {
    return JSON.parse(stripped) as unknown;
  } catch {
    // fall through
  }

  const extracted = extractJson(raw);
  return JSON.parse(extracted) as unknown;
}
