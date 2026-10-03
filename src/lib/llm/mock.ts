/**
 * Mock LLM provider — deterministic, schema-valid output for testing.
 * Only active when VITE_ENABLE_MOCK=true.
 */
import type { ZodType } from 'zod';
import type { LLMOptions } from './types';
import type { FileChunk } from '@/types';


function buildMockQuestion(
  slotIndex: number,
  type: string,
  marks: number,
  difficulty: string,
  topicId: string,
  chunks: FileChunk[]
): Record<string, unknown> {
  const evidenceChunk = chunks[slotIndex % Math.max(chunks.length, 1)];
  const quote = evidenceChunk
    ? evidenceChunk.text.slice(0, 80).replace(/\n/g, ' ')
    : 'From your syllabus material.';

  const base = {
    stem: `Explain the concept of ${topicId.replace(/_/g, ' ')} in the context of your course material.`,
    marks,
    difficulty,
    topic_id: topicId,
    model_answer: `The concept refers to core principles outlined in the study material. Key aspects include definition, application, and real-world significance.`,
    key_points: ['Defines the concept clearly', 'Provides at least one example', 'Explains significance'],
    marking_scheme: [
      { point: 'Correct definition', marks: Math.ceil(marks * 0.4) },
      { point: 'Example or application', marks: Math.floor(marks * 0.4) },
      { point: 'Clarity and accuracy', marks: marks - Math.ceil(marks * 0.4) - Math.floor(marks * 0.4) },
    ],
    explanation: 'This tests foundational understanding of the topic as covered in your material.',
    evidence: [{ chunk_id: evidenceChunk?.id ?? 'mock-chunk-1', quote }],
    estimated_minutes: Math.max(2, marks * 2),
    learning_outcome_ids: [],
  };

  if (type === 'mcq') {
    return {
      ...base,
      stem: `Which of the following best describes ${topicId.replace(/_/g, ' ')}?`,
      marks: 1,
      marking_scheme: [{ point: 'Correct option selected', marks: 1 }],
      options: [
        { key: 'A', text: 'The primary definition as given in the course material' },
        { key: 'B', text: 'An unrelated concept from a different subject' },
        { key: 'C', text: 'A partially correct interpretation' },
        { key: 'D', text: 'None of the above' },
      ],
      correct_option: 'A',
      estimated_minutes: 1,
    };
  }

  if (type === 'case_based') {
    return {
      ...base,
      passage: `Consider the following scenario drawn from your study material: ${quote}`,
      parts: [
        { label: 'i', text: 'Identify the main concept presented.', marks: Math.ceil(marks / 2) },
        { label: 'ii', text: 'Evaluate its significance.', marks: Math.floor(marks / 2) },
      ],
    };
  }

  return base;
}

export function createMockClient(chunks: FileChunk[]) {
  return {
    async generate<T>(
      _prompt: string,
      schema: ZodType<T>,
      schemaName: string,
      _options: LLMOptions = {}
    ): Promise<T> {
      // Simulate a small delay
      await new Promise<void>((resolve) => setTimeout(resolve, 200));

      // For syllabus map
      if (schemaName === 'SyllabusMap') {
        const mockMap = {
          units: [
            {
              id: 'unit_1',
              title: 'Core Concepts',
              weight: 40,
              topics: [
                { id: 'topic_1_1', title: 'Introduction', subtopics: ['Definitions', 'History'], learning_outcomes: ['Define key terms', 'Identify origins'] },
                { id: 'topic_1_2', title: 'Principles', subtopics: ['Core principles', 'Applications'], learning_outcomes: ['Explain principles'] },
              ],
            },
            {
              id: 'unit_2',
              title: 'Advanced Topics',
              weight: 35,
              topics: [
                { id: 'topic_2_1', title: 'Analysis', subtopics: ['Methods', 'Tools'], learning_outcomes: ['Apply analytical methods'] },
              ],
            },
            {
              id: 'unit_3',
              title: 'Applications',
              weight: 25,
              topics: [
                { id: 'topic_3_1', title: 'Case Studies', subtopics: ['Real-world examples'], learning_outcomes: ['Evaluate case studies'] },
              ],
            },
          ],
          weightInferred: true,
        };
        const r = schema.safeParse(mockMap);
        if (r.success) return r.data;
        throw new Error(`Mock failed SyllabusMap schema: ${r.error.message}`);
      }

      // For question generation
      if (schemaName.startsWith('Question_')) {
        const parts = schemaName.split('_');
        const type = parts[1] ?? 'short';
        const marks = parseInt(parts[2] ?? '3', 10);
        const difficulty = parts[3] ?? 'medium';
        const topicId = parts[4] ?? 'topic_1_1';
        const slotIndex = parseInt(parts[5] ?? '0', 10);

        const q = buildMockQuestion(slotIndex, type, marks, difficulty, topicId, chunks);
        const r = schema.safeParse(q);
        if (r.success) return r.data;
        // Return partial mock that passes
        return q as T;
      }

      // For critic
      if (schemaName === 'CriticScore') {
        const score = { groundedness: 4, clarity: 4, answerability: 4, difficulty_fit: 4, rubric_quality: 4 };
        const r = schema.safeParse(score);
        if (r.success) return r.data;
        return score as T;
      }

      // Fallback
      throw new Error(`Mock: unknown schemaName "${schemaName}"`);
    },
  };
}
