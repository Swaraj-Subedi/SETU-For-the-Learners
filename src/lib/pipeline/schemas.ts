import { z } from 'zod';

// ── Shared helpers ─────────────────────────────────────────────────────────
// Use z.union to handle both provided and missing arrays with correct inference
const stringArray = z.union([z.array(z.string()), z.undefined()]).transform((v) => v ?? []);

// ── Syllabus Analysis ──────────────────────────────────────────────────────
export const TopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtopics: stringArray,
  learning_outcomes: stringArray,
});

export const UnitSchema = z.object({
  id: z.string(),
  title: z.string(),
  weight: z.number().min(0).max(100),
  topics: z.array(TopicSchema),
});

export const SyllabusMapSchema = z.object({
  units: z.array(UnitSchema).min(1),
  weightInferred: z.union([z.boolean(), z.undefined()]).transform((v) => v ?? false),
});

export type SyllabusMap = z.infer<typeof SyllabusMapSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Unit = z.infer<typeof UnitSchema>;

// ── Question ───────────────────────────────────────────────────────────────
export const QuestionPartSchema = z.object({
  label: z.string(),
  text: z.string(),
  marks: z.number().int().positive(),
});

export const QuestionOptionSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string(),
});

export const MarkingPointSchema = z.object({
  point: z.string(),
  marks: z.number().int().positive(),
});

export const QuestionEvidenceSchema = z.object({
  chunk_id: z.string(),
  quote: z.string(),
});

const evidenceArray = z
  .union([z.array(QuestionEvidenceSchema), z.undefined()])
  .transform((v) => v ?? []);

export const QuestionSchema = z.object({
  stem: z.string().min(10),
  marks: z.number().int().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topic_id: z.string(),
  learning_outcome_ids: stringArray,
  passage: z.string().optional(),
  parts: z.array(QuestionPartSchema).optional(),
  options: z.array(QuestionOptionSchema).optional(),
  correct_option: z.enum(['A', 'B', 'C', 'D']).optional(),
  model_answer: z.string().min(5),
  key_points: stringArray,
  marking_scheme: z.array(MarkingPointSchema),
  explanation: z.string(),
  evidence: evidenceArray,
  estimated_minutes: z
    .union([z.number().positive(), z.undefined()])
    .transform((v) => v ?? 3),
});

export type QuestionOutput = z.infer<typeof QuestionSchema>;

// ── Critic ────────────────────────────────────────────────────────────────
export const CriticScoreSchema = z.object({
  groundedness: z.number().int().min(1).max(5),
  clarity: z.number().int().min(1).max(5),
  answerability: z.number().int().min(1).max(5),
  difficulty_fit: z.number().int().min(1).max(5),
  rubric_quality: z.number().int().min(1).max(5),
});

export type CriticScore = z.infer<typeof CriticScoreSchema>;
