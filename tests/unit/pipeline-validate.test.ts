import { describe, it, expect } from 'vitest';
import { validateQuestion, repairQuestionForSlot } from '@/lib/pipeline/validate';
import { QuestionSchema } from '@/lib/pipeline/schemas';
import type { QuestionOutput } from '@/lib/pipeline/schemas';
import type { FileChunk } from '@/types';

describe('Pipeline Question Validator', () => {
  const dummyChunk: FileChunk = {
    id: 'c1',
    fileId: 'f1',
    fileName: 'notes.txt',
    text: 'The Compton effect involves scattering of photons by electrons, resulting in wavelength shift.',
    tokenCount: 15,
  };

  const validMcq: QuestionOutput = {
    topic_id: 't1',
    learning_outcome_ids: ['lo1'],
    marks: 1,
    difficulty: 'easy',
    stem: 'What phenomenon causes the wavelength of scattered X-rays to increase?',
    options: [
      { key: 'A', text: 'Compton scattering' },
      { key: 'B', text: 'Photoelectric effect' },
      { key: 'C', text: 'De Broglie diffraction' },
      { key: 'D', text: 'Blackbody radiation' },
    ],
    correct_option: 'A',
    model_answer: 'A - Compton scattering',
    key_points: ['Photon transfers momentum to electron'],
    marking_scheme: [{ point: 'Correct option selected', marks: 1 }],
    explanation: 'Compton scattering causes a shift towards longer wavelength.',
    evidence: [{ chunk_id: 'c1', quote: 'Compton effect involves scattering of photons' }],
    estimated_minutes: 1,
  };

  it('passes on a valid question matching slot marks and scheme', () => {
    const res = validateQuestion(
      validMcq,
      { marks: 1, type: 'mcq' },
      [dummyChunk],
      []
    );
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('fails if marking scheme sum does not equal question marks', () => {
    const badScheme: QuestionOutput = {
      ...validMcq,
      marking_scheme: [{ point: 'Option', marks: 2 }],
    };
    const res = validateQuestion(
      badScheme,
      { marks: 1, type: 'mcq' },
      [dummyChunk],
      []
    );
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('Marking scheme totals'))).toBe(true);
  });

  it('fails if MCQ has fewer than 4 options or duplicate keys', () => {
    const badMcq: QuestionOutput = {
      ...validMcq,
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
      ],
    };
    const res = validateQuestion(
      badMcq,
      { marks: 1, type: 'mcq' },
      [dummyChunk],
      []
    );
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('exactly 4 options'))).toBe(true);
  });

  it('rejects vague stems', () => {
    const vague: QuestionOutput = {
      ...validMcq,
      stem: 'Explain everything about quantum mechanics and photons.',
    };
    const res = validateQuestion(
      vague,
      { marks: 1, type: 'mcq' },
      [dummyChunk],
      []
    );
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('too vague'))).toBe(true);
  });

  it('rejects duplicates with high Jaccard token overlap', () => {
    const duplicate: QuestionOutput = {
      ...validMcq,
      stem: 'What phenomenon causes the wavelength of scattered X-rays to increase?',
    };
    const res = validateQuestion(
      duplicate,
      { marks: 1, type: 'mcq' },
      [dummyChunk],
      [validMcq]
    );
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('too similar to existing question'))).toBe(true);
  });

  it('accepts numeric fields sent as strings', () => {
    const parsed = QuestionSchema.parse({
      ...validMcq,
      marks: '1',
      difficulty: 'Easy',
      estimated_minutes: '2',
      marking_scheme: [{ point: 'Correct option selected', marks: '1' }],
    } as unknown);
    expect(parsed.marks).toBe(1);
    expect(parsed.difficulty).toBe('easy');
    expect(parsed.estimated_minutes).toBe(2);
    expect(parsed.marking_scheme[0]?.marks).toBe(1);
  });

  it('repairs missing evidence and marking-scheme totals', () => {
    const broken: QuestionOutput = {
      ...validMcq,
      evidence: [{ chunk_id: 'missing', quote: 'not in the notes' }],
      marking_scheme: [
        { point: 'Definition', marks: 2 },
        { point: 'Example', marks: 2 },
      ],
    };
    const repaired = repairQuestionForSlot(broken, { marks: 1, type: 'mcq' }, [dummyChunk]);
    const res = validateQuestion(repaired, { marks: 1, type: 'mcq' }, [dummyChunk], []);
    expect(res.ok).toBe(true);
    expect(repaired.evidence[0]?.chunk_id).toBe('c1');
  });
});
