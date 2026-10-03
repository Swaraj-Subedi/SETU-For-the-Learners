import { describe, it, expect } from 'vitest';
import { retrieve } from '@/lib/pipeline/retrieve';
import type { FileChunk } from '@/types';

describe('BM25 In-Browser Retriever', () => {
  const chunks: FileChunk[] = [
    {
      id: 'c1',
      fileId: 'f1',
      fileName: 'notes.txt',
      text: 'The photoelectric effect demonstrates the particle nature of light. Photons transfer energy to electrons.',
      tokenCount: 20,
    },
    {
      id: 'c2',
      fileId: 'f1',
      fileName: 'notes.txt',
      text: 'In special relativity, length contraction causes moving objects to appear shorter along the direction of motion.',
      tokenCount: 20,
    },
    {
      id: 'c3',
      fileId: 'f1',
      fileName: 'notes.txt',
      text: 'The Heisenberg uncertainty principle states that position and momentum cannot both be simultaneously measured with arbitrary precision.',
      tokenCount: 25,
    },
  ];

  it('retrieves most relevant chunk for a query', () => {
    const results = retrieve('photoelectric photons electrons', chunks, 1);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('c1');
  });

  it('ranks relativity chunk highest for length contraction query', () => {
    const results = retrieve('relativity length contraction', chunks, 2);
    expect(results[0].id).toBe('c2');
  });

  it('handles empty query or empty chunks gracefully', () => {
    expect(retrieve('', chunks)).toEqual([]);
    expect(retrieve('quantum', [])).toEqual([]);
  });

  it('uses a bounded material fallback when the topic query has no lexical match', () => {
    const results = retrieve('topic_1_2', chunks, 2);
    expect(results).toEqual(chunks.slice(0, 2));
  });
});
