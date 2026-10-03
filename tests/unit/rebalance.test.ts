import { describe, it, expect } from 'vitest';
import { rebalance } from '@/lib/pipeline/rebalance';
import type { Question } from '@/types';

describe('Deterministic Marks Rebalancer', () => {
  const sampleQuestions: Question[] = [
    {
      id: 'q1',
      slot_id: 's1',
      type: 'mcq',
      topic_id: 't1',
      learning_outcome_ids: [],
      marks: 1,
      difficulty: 'easy',
      stem: 'Stem 1',
      model_answer: 'Ans 1',
      key_points: [],
      marking_scheme: [{ point: 'pt', marks: 1 }],
      explanation: 'exp',
      evidence: [],
      estimated_minutes: 1,
    },
    {
      id: 'q2',
      slot_id: 's2',
      type: 'short',
      topic_id: 't1',
      learning_outcome_ids: [],
      marks: 3,
      difficulty: 'medium',
      stem: 'Stem 2',
      model_answer: 'Ans 2',
      key_points: [],
      marking_scheme: [{ point: 'pt', marks: 3 }],
      explanation: 'exp',
      evidence: [],
      estimated_minutes: 3,
    },
  ];

  it('keeps total marks exact and generates student notice when fewer questions are supported', () => {
    // 2 questions supported out of 5 requested, target total marks 30
    const res = rebalance(sampleQuestions, 30, 5);

    expect(res.questions.length).toBe(2);
    const sum = res.questions.reduce((s, q) => s + q.marks, 0);
    expect(sum).toBe(30);
    expect(res.notice).toBe(
      'Your material supported 2 of the 5 questions you asked for, so the marks were rebalanced to 30.'
    );
  });

  it('no notice when all requested questions are filled and total marks matches', () => {
    const res = rebalance(sampleQuestions, 4, 2);
    expect(res.notice).toBeUndefined();
    expect(res.totalMarks).toBe(4);
  });
});
