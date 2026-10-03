import type { FileChunk } from '@/types';

/**
 * Estimates token count from text using word/character heuristic (1 token ~ 4 characters / 0.75 words)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * 1.33);
}

export interface ChunkOptions {
  targetTokens?: number; // default ~700
  overlapTokens?: number; // default ~100
}

/**
 * Splits extracted document text into overlapping chunks respecting paragraph boundaries
 */
export function chunkDocument(
  fileId: string,
  fileName: string,
  text: string,
  pageNumber?: number,
  options?: ChunkOptions
): FileChunk[] {
  const targetTokens = options?.targetTokens ?? 700;
  const overlapTokens = options?.overlapTokens ?? 100;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split into paragraphs
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: FileChunk[] = [];
  let currentChunkParagraphs: string[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);

    // If adding this paragraph exceeds targetTokens and we already have content, finalize current chunk
    if (currentTokens + paraTokens > targetTokens && currentChunkParagraphs.length > 0) {
      const chunkText = currentChunkParagraphs.join('\n\n');
      chunks.push({
        id: `${fileId}-chunk-${++chunkIndex}`,
        fileId,
        fileName,
        page: pageNumber,
        text: chunkText,
        tokenCount: currentTokens,
      });

      // Retain trailing paragraphs for overlap
      let overlapCount = 0;
      const overlapParagraphs: string[] = [];
      for (let i = currentChunkParagraphs.length - 1; i >= 0; i--) {
        const pTokens = estimateTokens(currentChunkParagraphs[i]);
        if (overlapCount + pTokens <= overlapTokens) {
          overlapParagraphs.unshift(currentChunkParagraphs[i]);
          overlapCount += pTokens;
        } else {
          break;
        }
      }

      currentChunkParagraphs = [...overlapParagraphs, para];
      currentTokens = overlapCount + paraTokens;
    } else {
      currentChunkParagraphs.push(para);
      currentTokens += paraTokens;
    }
  }

  // Remaining content
  if (currentChunkParagraphs.length > 0) {
    const chunkText = currentChunkParagraphs.join('\n\n');
    chunks.push({
      id: `${fileId}-chunk-${++chunkIndex}`,
      fileId,
      fileName,
      page: pageNumber,
      text: chunkText,
      tokenCount: currentTokens,
    });
  }

  return chunks;
}
