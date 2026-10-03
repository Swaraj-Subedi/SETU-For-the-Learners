import { describe, it, expect } from 'vitest';
import { cleanExtractedText } from '@/lib/files/clean';

describe('Text Cleaning', () => {
  it('de-hyphenates words split across lines', () => {
    const raw = 'The charac-\nteristic of this func-\ntion is clear.';
    const cleaned = cleanExtractedText(raw);
    expect(cleaned).toBe('The characteristic of this function is clear.');
  });

  it('removes standalone running page numbers and headers', () => {
    const raw = `
Unit 1: Quantum Mechanics
Page 14
This is the core content describing wave functions.
Page 14 of 90
- 15 -
16
And the conclusion follows here.
    `;
    const cleaned = cleanExtractedText(raw);
    expect(cleaned).not.toContain('Page 14');
    expect(cleaned).not.toContain('- 15 -');
    expect(cleaned).toContain('Unit 1: Quantum Mechanics');
    expect(cleaned).toContain('This is the core content describing wave functions.');
    expect(cleaned).toContain('And the conclusion follows here.');
  });

  it('normalizes excessive whitespace while preserving paragraphs', () => {
    const raw = 'Paragraph one with   extra    spaces.\n\n\n\n\nParagraph two.';
    const cleaned = cleanExtractedText(raw);
    expect(cleaned).toBe('Paragraph one with extra spaces.\n\nParagraph two.');
  });
});
