import { describe, it, expect } from 'vitest';
import { buildBlueprint } from '@/lib/pipeline/blueprint';
import type { PaperSettings } from '@/store/session';
import type { SyllabusMap } from '@/lib/pipeline/schemas';
import type { DifficultyLevel, QuestionType } from '@/types';

const MOCK_SYLLABUS_MAP: SyllabusMap = {
  units: [
    {
      id: 'u1',
      title: 'Unit 1: Quantum Mechanics',
      weight: 40,
      topics: [
        { id: 't1', title: 'Wave-particle duality', subtopics: ['De Broglie', 'Compton'], learning_outcomes: [] },
        { id: 't2', title: 'Uncertainty principle', subtopics: ['Heisenberg'], learning_outcomes: [] },
      ],
    },
    {
      id: 'u2',
      title: 'Unit 2: Relativity',
      weight: 60,
      topics: [
        { id: 't3', title: 'Lorentz transforms', subtopics: ['Dilation', 'Contraction'], learning_outcomes: [] },
      ],
    },
  ],
  weightInferred: false,
};

const ALL_TYPES: QuestionType[] = [
  'mcq',
  'short',
  'long',
  'application',
  'analytical',
  'case_based',
  'exam_style',
];

const DIFFICULTIES: DifficultyLevel[] = ['easy', 'balanced', 'hard', 'mixed'];

describe('Deterministic Blueprint Arithmetic', () => {
  it('total marks is EXACT across 500 randomized settings', () => {
    for (let i = 0; i < 500; i++) {
      const questionCount = Math.floor(Math.random() * 40) + 1; // 1 to 40
      const totalMarks = questionCount + Math.floor(Math.random() * 150); // totalMarks >= questionCount
      const difficulty = DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];

      // Pick a random subset of question types (at least 1)
      const shuffled = [...ALL_TYPES].sort(() => 0.5 - Math.random());
      const typeCount = Math.floor(Math.random() * ALL_TYPES.length) + 1;
      const questionTypes = shuffled.slice(0, typeCount);

      const settings: PaperSettings = {
        subject: 'Physics',
        level: 'Grade 12',
        style: 'class_test',
        difficulty,
        questionCount,
        durationMinutes: 60,
        totalMarks,
        questionTypes,
      };

      const blueprint = buildBlueprint(settings, MOCK_SYLLABUS_MAP);

      expect(blueprint.slots.length).toBe(questionCount);

      const computedTotal = blueprint.slots.reduce((sum, s) => sum + s.marks, 0);
      expect(computedTotal).toBe(totalMarks);

      // Verify every question has positive integer marks
      for (const slot of blueprint.slots) {
        expect(Number.isInteger(slot.marks)).toBe(true);
        expect(slot.marks).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('distributes slots across sections A, B, C, D', () => {
    const settings: PaperSettings = {
      subject: 'Physics',
      level: 'Grade 12',
      style: 'final_exam',
      difficulty: 'balanced',
      questionCount: 15,
      durationMinutes: 90,
      totalMarks: 50,
      questionTypes: ['mcq', 'short', 'long'],
    };

    const blueprint = buildBlueprint(settings, MOCK_SYLLABUS_MAP);
    const sections = new Set(blueprint.slots.map((s) => s.section));
    expect(sections.size).toBeGreaterThanOrEqual(2);
  });

  it('uses a user question plan exactly, including marks per question', () => {
    const settings: PaperSettings = {
      subject: 'Physics', level: 'Grade 12', style: 'class_test', difficulty: 'balanced',
      questionCount: 99, totalMarks: 99, durationMinutes: 45, questionTypes: ['mcq', 'long'],
      questionPlan: [
        { type: 'mcq', count: 2, marksPerQuestion: 1 },
        { type: 'long', count: 3, marksPerQuestion: 6 },
      ],
    };
    const blueprint = buildBlueprint(settings, MOCK_SYLLABUS_MAP);
    expect(blueprint.slots).toHaveLength(5);
    expect(blueprint.slots.filter((slot) => slot.type === 'mcq').every((slot) => slot.marks === 1)).toBe(true);
    expect(blueprint.slots.filter((slot) => slot.type === 'long').every((slot) => slot.marks === 6)).toBe(true);
    expect(blueprint.totalMarks).toBe(20);
  });
});
