import { z } from 'zod';

// ── Shared helpers ─────────────────────────────────────────────────────────
const stringArray = z.union([z.array(z.string()), z.undefined()]).transform((v) => v ?? []);

const numberLike = z.coerce.number().refine((n) => Number.isFinite(n), 'Expected a number');

const markValue = numberLike.transform((n) => Math.max(1, Math.round(n)));
const weightValue = numberLike.transform((n) => Math.min(100, Math.max(0, n)));

const difficultyValue = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.enum(['easy', 'medium', 'hard']));

const optionKey = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .pipe(z.enum(['A', 'B', 'C', 'D']));

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
  weight: weightValue,
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
  marks: markValue,
});

export const QuestionOptionSchema = z.object({
  key: optionKey,
  text: z.string(),
});

export const MarkingPointSchema = z.object({
  point: z.string(),
  marks: markValue,
});

export const QuestionEvidenceSchema = z.object({
  chunk_id: z.string(),
  quote: z.string(),
});

const evidenceArray = z
  .union([z.array(QuestionEvidenceSchema), z.undefined()])
  .transform((v) => v ?? []);

const markingScheme = z
  .union([z.array(MarkingPointSchema), z.undefined()])
  .transform((v) => (v && v.length > 0 ? v : [{ point: 'Correct, complete answer', marks: 1 }]));

export const QuestionSchema = z.object({
  stem: z.string().min(10),
  marks: markValue,
  difficulty: difficultyValue,
  topic_id: z.string(),
  learning_outcome_ids: stringArray,
  passage: z.string().optional(),
  parts: z.array(QuestionPartSchema).optional(),
  options: z.array(QuestionOptionSchema).optional(),
  correct_option: optionKey.optional(),
  model_answer: z.string().min(5),
  key_points: stringArray,
  marking_scheme: markingScheme,
  explanation: z.string(),
  evidence: evidenceArray,
  estimated_minutes: z
    .union([numberLike, z.undefined()])
    .transform((v) => (v && v > 0 ? v : 3)),
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
