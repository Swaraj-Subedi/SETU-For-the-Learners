import { describe, it, expect } from 'vitest';
import { chunkDocument, estimateTokens } from '@/lib/files/chunk';

describe('Document Chunking', () => {
  it('estimates token counts reasonably', () => {
    const text = 'This is a sample sentence with exactly eight words.';
    const tokens = estimateTokens(text);
    // 8 words * 1.33 ~ 11 tokens
    expect(tokens).toBeGreaterThan(7);
    expect(tokens).toBeLessThan(15);
  });

  it('chunks documents with target size and overlap', () => {
    // Generate paragraphs
    const paragraphs: string[] = [];
    for (let i = 1; i <= 20; i++) {
      paragraphs.push(
        `Paragraph ${i}: ` +
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
      );
    }
    const fullText = paragraphs.join('\n\n');

    const chunks = chunkDocument('test-doc', 'syllabus.pdf', fullText, 1, {
      targetTokens: 300,
      overlapTokens: 60,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].fileId).toBe('test-doc');
    expect(chunks[0].fileName).toBe('syllabus.pdf');
    expect(chunks[0].page).toBe(1);
    expect(chunks[0].id).toContain('chunk-1');

    // Chunks should contain overlapping content
    expect(chunks[0].tokenCount).toBeGreaterThan(100);
  });

  it('handles empty text gracefully', () => {
    const chunks = chunkDocument('test-doc', 'empty.txt', '');
    expect(chunks).toEqual([]);
  });
});
