import { describe, it, expect } from 'vitest';
import { extractJson, repairJson, parseModelJson } from '@/lib/llm/repair';

describe('LLM Output JSON Repair', () => {
  it('strips markdown code fences', () => {
    const raw = '```json\n{"key": "value"}\n```';
    expect(repairJson(raw)).toBe('{"key": "value"}');
  });

  it('strips qwen3 thinking blocks (<think>...</think>)', () => {
    const raw = '<think>I need to construct question 1 carefully.</think>{"stem": "Explain the concept"}';
    const jsonStr = extractJson(raw);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.stem).toBe('Explain the concept');
  });

  it('removes trailing commas before closing braces', () => {
    const raw = '{"items": [1, 2, ], "details": {"name": "test", }, }';
    const repaired = repairJson(raw);
    expect(JSON.parse(repaired)).toEqual({
      items: [1, 2],
      details: { name: 'test' },
    });
  });

  it('extracts balanced JSON substring from surrounding conversational text', () => {
    const raw = 'Here is the question requested:\n\n{"id": "q1", "marks": 5}\n\nHope this helps!';
    const jsonStr = extractJson(raw);
    expect(JSON.parse(jsonStr)).toEqual({ id: 'q1', marks: 5 });
  });

  it('keeps apostrophes inside valid JSON strings', () => {
    const raw = '{"stem": "State Newton\'s second law of motion."}';
    expect(parseModelJson(raw)).toEqual({ stem: "State Newton's second law of motion." });
  });

  it('parses JSON after a thinking block without damaging apostrophes', () => {
    const raw = '<think>choose a law</think>{"stem": "What is Newton\'s second law?"}';
    expect(parseModelJson(raw)).toEqual({ stem: "What is Newton's second law?" });
  });

  it('converts single-quoted JSON without touching unrelated text', () => {
    const repaired = repairJson("{'stem': 'Define osmosis'}");
    expect(JSON.parse(repaired)).toEqual({ stem: 'Define osmosis' });
  });

  it('removes JavaScript-style comments without corrupting strings', () => {
    const raw = '{// field\n"url":"https://example.test", /* keep valid */ "marks": 2}';
    expect(parseModelJson(raw)).toEqual({ url: 'https://example.test', marks: 2 });
  });
});
