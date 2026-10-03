/**
 * Pipeline validators — all in TypeScript (no model calls).
 */
import type { Question, FileChunk } from '@/types';
import type { QuestionOutput } from './schemas';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

// Normalize text for comparison
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// Token Jaccard overlap between two strings
function jaccard(a: string, b: string): number {
  const setA = new Set(norm(a).split(' '));
  const setB = new Set(norm(b).split(' '));
  const inter = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

// Check if quote appears (normalized, fuzzy) in chunk text
function quoteInChunk(quote: string, chunkText: string): boolean {
  const normQuote = norm(quote);
  const normText = norm(chunkText);
  if (normQuote.length === 0) return true;
  // Allow partial match (quoted text may be trimmed)
  const words = normQuote.split(' ').filter((w) => w.length > 2);
  if (words.length === 0) return true;
  const matchCount = words.filter((w) => normText.includes(w)).length;
  return matchCount / words.length >= 0.7;
}

function quoteFromChunk(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.slice(0, 80) || compact;
}

function rescaleMarks<T extends { marks: number }>(items: T[], total: number): T[] {
  if (items.length === 0) return items;
  if (total < items.length) {
    return [{ ...items[0]!, marks: total }];
  }
  const current = items.reduce((sum, item) => sum + item.marks, 0);
  if (current === total) return items;
  const next = items.map((item) => ({ ...item }));
  if (current <= 0) {
    next[0]!.marks = total;
    return next;
  }
  let allocated = 0;
  for (let i = 0; i < next.length; i++) {
    const share = i === next.length - 1
      ? Math.max(1, total - allocated)
      : Math.max(1, Math.round((next[i]!.marks / current) * total));
    next[i]!.marks = share;
    allocated += share;
  }
  const drift = total - next.reduce((sum, item) => sum + item.marks, 0);
  if (drift !== 0) {
    const last = next[next.length - 1]!;
    last.marks = Math.max(1, last.marks + drift);
  }
  return next;
}

/**
 * Deterministically fix marks, scheme totals, and evidence citations so a
 * schema-valid model answer is not discarded for copy errors local models make.
 */
export function repairQuestionForSlot(
  q: QuestionOutput,
  slot: { marks: number; type: string; topic_id?: string; difficulty?: QuestionOutput['difficulty'] },
  chunks: FileChunk[]
): QuestionOutput {
  const repaired: QuestionOutput = {
    ...q,
    marks: slot.marks,
    topic_id: slot.topic_id ?? q.topic_id,
    difficulty: slot.difficulty ?? q.difficulty,
    marking_scheme: rescaleMarks(q.marking_scheme, slot.marks),
    parts: q.parts && q.parts.length > 0 ? rescaleMarks(q.parts, slot.marks) : q.parts,
  };

  const chunkMap = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const grounded = repaired.evidence.filter((ev) => {
    const chunk = chunkMap.get(ev.chunk_id);
    return chunk ? quoteInChunk(ev.quote, chunk.text) : false;
  });

  if (grounded.length === 0 && chunks.length > 0) {
    const fallback = chunks[0]!;
    repaired.evidence = [{ chunk_id: fallback.id, quote: quoteFromChunk(fallback.text) }];
  } else {
    repaired.evidence = grounded;
  }

  return repaired;
}

export function validateQuestion(
  q: QuestionOutput,
  slot: { marks: number; type: string },
  allChunks: FileChunk[],
  existingQuestions: QuestionOutput[]
): ValidationResult {
  const errors: string[] = [];

  // Marks equality
  if (q.marks !== slot.marks) {
    errors.push(`Marks mismatch: expected ${slot.marks}, got ${q.marks}`);
  }

  // MCQ-specific
  if (slot.type === 'mcq') {
    if (!q.options || q.options.length !== 4) {
      errors.push('MCQ must have exactly 4 options');
    } else {
      const keys = q.options.map((o) => o.key);
      const uniqueKeys = new Set<string>(keys);
      if (uniqueKeys.size !== 4 || !['A', 'B', 'C', 'D'].every((key) => uniqueKeys.has(key))) {
        errors.push('MCQ options must have distinct keys A/B/C/D');
      }
    }
    if (!q.correct_option || !q.options?.some((option) => option.key === q.correct_option)) {
      errors.push('MCQ must specify a correct option from A/B/C/D');
    }
  }

  if (slot.type === 'case_based' && (!q.passage || !q.parts || q.parts.length < 2)) {
    errors.push('Case-based question must include a passage and at least two parts');
  }

  // Marking scheme sum
  const schemeTotal = q.marking_scheme.reduce((s, p) => s + p.marks, 0);
  if (schemeTotal !== slot.marks) {
    errors.push(`Marking scheme totals ${schemeTotal}, expected ${slot.marks}`);
  }

  // Parts sum (if present)
  if (q.parts && q.parts.length > 0) {
    const partsTotal = q.parts.reduce((s, p) => s + p.marks, 0);
    if (partsTotal !== slot.marks) {
      errors.push(`Parts marks total ${partsTotal}, expected ${slot.marks}`);
    }
  }

  // Vague stem check
  const vaguePatterns = [/explain everything/i, /describe all/i, /discuss the topic/i, /write about/i];
  if (vaguePatterns.some((p) => p.test(q.stem))) {
    errors.push('Stem is too vague');
  }

  // Stem length
  if (q.stem.trim().length < 10) {
    errors.push('Stem is too short');
  }

  // Evidence chunk validity
  const chunkMap = new Map(allChunks.map((c) => [c.id, c]));
  if (q.evidence.length === 0) {
    errors.push('Question must include at least one evidence quote from the supplied material');
  }
  q.evidence.forEach((ev) => {
    const chunk = chunkMap.get(ev.chunk_id);
    if (!chunk) {
      errors.push(`Evidence cites an unknown chunk ${ev.chunk_id}`);
      return;
    }
    if (!quoteInChunk(ev.quote, chunk.text)) {
      errors.push(`Evidence quote not found in chunk ${ev.chunk_id}`);
    }
  });

  // Duplicate check (Jaccard < 0.6 against all existing stems)
  for (const existing of existingQuestions) {
    const similarity = jaccard(q.stem, existing.stem);
    if (similarity >= 0.6) {
      errors.push(`Stem too similar to existing question (Jaccard ${similarity.toFixed(2)})`);
      break;
    }
  }

  return { ok: errors.length === 0, errors };
}

// Build a Question from QuestionOutput + slot data
export function assembleQuestion(
  q: QuestionOutput,
  slot: { slot_id: string; type: string },
  questionId: string
): Question {
  return {
    id: questionId,
    slot_id: slot.slot_id,
    type: slot.type as Question['type'],
    topic_id: q.topic_id,
    learning_outcome_ids: q.learning_outcome_ids,
    marks: q.marks,
    difficulty: q.difficulty,
    stem: q.stem,
    passage: q.passage,
    parts: q.parts,
    options: q.options,
    correct_option: q.correct_option,
    model_answer: q.model_answer,
    key_points: q.key_points,
    marking_scheme: q.marking_scheme,
    explanation: q.explanation,
    evidence: q.evidence,
    estimated_minutes: q.estimated_minutes,
  };
}
