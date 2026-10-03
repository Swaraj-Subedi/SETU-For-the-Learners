/**
 * BM25 retriever — pure TypeScript, no external dependencies.
 */
import type { FileChunk } from '@/types';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

interface BM25Index {
  chunks: FileChunk[];
  tf: Map<string, Map<number, number>>; // term -> docIdx -> count
  df: Map<string, number>;             // term -> doc count
  docLengths: number[];
  avgDocLength: number;
  N: number;
}

function buildIndex(chunks: FileChunk[]): BM25Index {
  const tf = new Map<string, Map<number, number>>();
  const df = new Map<string, number>();
  const docLengths: number[] = [];

  chunks.forEach((chunk, docIdx) => {
    const tokens = tokenize(chunk.text);
    docLengths.push(tokens.length);
    const seen = new Set<string>();

    tokens.forEach((term) => {
      const docMap = tf.get(term) ?? new Map<number, number>();
      docMap.set(docIdx, (docMap.get(docIdx) ?? 0) + 1);
      tf.set(term, docMap);

      if (!seen.has(term)) {
        df.set(term, (df.get(term) ?? 0) + 1);
        seen.add(term);
      }
    });
  });

  const avgDocLength = docLengths.length > 0
    ? docLengths.reduce((a, b) => a + b, 0) / docLengths.length
    : 1;

  return { chunks, tf, df, docLengths, avgDocLength, N: chunks.length };
}

function score(index: BM25Index, query: string, k1 = 1.5, b = 0.75): [number, number][] {
  const queryTerms = tokenize(query);
  const scores = new Float64Array(index.N);

  queryTerms.forEach((term) => {
    const docFreq = index.df.get(term) ?? 0;
    if (docFreq === 0) return;
    const idf = Math.log((index.N - docFreq + 0.5) / (docFreq + 0.5) + 1);
    const termMap = index.tf.get(term);
    if (!termMap) return;

    termMap.forEach((freq, docIdx) => {
      const dl = index.docLengths[docIdx] ?? 1;
      const tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (dl / index.avgDocLength)));
      scores[docIdx] += idf * tf;
    });
  });

  return Array.from(scores.entries())
    .filter(([, s]) => s > 0)
    .sort(([, a], [, b]) => b - a);
}

export function retrieve(
  query: string,
  chunks: FileChunk[],
  topK = 4
): FileChunk[] {
  if (chunks.length === 0) return [];
  const index = buildIndex(chunks);
  const results = score(index, query, 1.5, 0.75);
  return results.slice(0, topK).map(([docIdx]) => chunks[docIdx]).filter(Boolean) as FileChunk[];
}
