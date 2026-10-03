/**
 * Blueprint — deterministic slot builder.
 * Total marks is always exact (integer arithmetic, no rounding drift).
 */
import type { BlueprintSlot, QuestionType, DifficultyLevel } from '@/types';
import type { SyllabusMap } from './schemas';
import type { PaperSettings } from '@/store/session';

// Default mark ranges per question type
const TYPE_MARKS: Record<QuestionType, number> = {
  mcq: 1,
  short: 3,
  long: 6,
  application: 5,
  analytical: 5,
  case_based: 8,
  exam_style: 5,
};

// Difficulty distribution per setting (easy / medium / hard fractions)
const DIFFICULTY_DIST: Record<DifficultyLevel, [number, number, number]> = {
  easy: [0.6, 0.3, 0.1],
  balanced: [0.3, 0.5, 0.2],
  hard: [0.1, 0.4, 0.5],
  mixed: [0.25, 0.5, 0.25],
};

type Difficulty = 'easy' | 'medium' | 'hard';

function rotateDifficulty(
  index: number,
  dist: [number, number, number],
  total: number
): Difficulty {
  const targets = [
    Math.round(dist[0] * total),
    Math.round(dist[1] * total),
    Math.round(dist[2] * total),
  ];
  // Adjust last bucket to fix rounding
  targets[2] = total - targets[0] - targets[1];
  const counts: [number, number, number] = [0, 0, 0];
  const assignments: Difficulty[] = [];
  for (let i = 0; i < total; i++) {
    let chosen = 0;
    let maxShortfall = -Infinity;
    for (let d = 0; d < 3; d++) {
      const shortfall = targets[d] - counts[d];
      if (shortfall > maxShortfall) {
        maxShortfall = shortfall;
        chosen = d;
      }
    }
    counts[chosen]++;
    assignments.push((['easy', 'medium', 'hard'] as Difficulty[])[chosen]);
  }
  return assignments[index % total] ?? 'medium';
}

function spreadTopics(syllabusMap: SyllabusMap, count: number): string[] {
  const allTopics = syllabusMap.units.flatMap((u) => u.topics);
  if (allTopics.length === 0) return Array(count).fill('topic_general') as string[];

  // Weight topics by unit weight
  const topicIds: string[] = [];
  syllabusMap.units.forEach((unit) => {
    const unitSlots = Math.max(1, Math.round((unit.weight / 100) * count));
    const topicsInUnit = unit.topics;
    if (topicsInUnit.length === 0) return;
    for (let i = 0; i < unitSlots; i++) {
      topicIds.push(topicsInUnit[i % topicsInUnit.length].id);
    }
  });

  // Pad or trim to exactly count
  while (topicIds.length < count) topicIds.push(topicIds[topicIds.length - 1] ?? 'topic_general');
  return topicIds.slice(0, count);
}

function assignSections(slots: Omit<BlueprintSlot, 'section'>[]): BlueprintSlot[] {
  const byType = new Map<QuestionType, Omit<BlueprintSlot, 'section'>[]>();
  slots.forEach((s) => {
    const arr = byType.get(s.type) ?? [];
    arr.push(s);
    byType.set(s.type, arr);
  });

  const sectionLabels = ['A', 'B', 'C', 'D'];
  let sectionIndex = 0;
  const result: BlueprintSlot[] = [];

  byType.forEach((group) => {
    const label = sectionLabels[sectionIndex++ % sectionLabels.length];
    group.forEach((s) => result.push({ ...s, section: `Section ${label}` }));
  });

  return result;
}

export interface Blueprint {
  slots: BlueprintSlot[];
  totalMarks: number;
}

export function buildBlueprint(
  settings: PaperSettings,
  syllabusMap: SyllabusMap
): Blueprint {
  const { questionCount, totalMarks, difficulty, questionTypes } = settings;

  // Limit types to what's feasible
  const usableTypes = questionTypes.slice(0, questionCount);
  if (usableTypes.length === 0) throw new Error('No question types selected');

  const diffDist = DIFFICULTY_DIST[difficulty];
  const topicAssignment = spreadTopics(syllabusMap, questionCount);

  // Assign one type per slot (round-robin over usable types)
  const typeAssignment: QuestionType[] = Array.from(
    { length: questionCount },
    (_, i) => usableTypes[i % usableTypes.length]
  );

  // Compute base marks per slot from type defaults
  const basePer = typeAssignment.map((t) => TYPE_MARKS[t]);
  const baseSum = basePer.reduce((a, b) => a + b, 0);

  // Scale marks proportionally then fix rounding with the last slot
  let marks: number[];
  if (baseSum === 0) {
    marks = Array(questionCount).fill(1) as number[];
  } else {
    const scale = totalMarks / baseSum;
    marks = basePer.map((m) => Math.max(1, Math.round(m * scale)));
    // Fix total to be exact
    const diff_ = totalMarks - marks.reduce((a, b) => a + b, 0);
    marks[marks.length - 1] = Math.max(1, (marks[marks.length - 1] ?? 1) + diff_);
  }

  const slots: Omit<BlueprintSlot, 'section'>[] = Array.from(
    { length: questionCount },
    (_, i) => ({
      slot_id: `slot_${i + 1}`,
      type: typeAssignment[i],
      marks: marks[i] ?? 1,
      difficulty: rotateDifficulty(i, diffDist, questionCount),
      topic_id: topicAssignment[i] ?? 'topic_general',
    })
  );

  // Final safety: verify exact total
  const computedTotal = slots.reduce((s, sl) => s + sl.marks, 0);
  if (computedTotal !== totalMarks) {
    const delta = totalMarks - computedTotal;
    const last = slots[slots.length - 1];
    if (last) last.marks = Math.max(1, last.marks + delta);
  }

  return {
    slots: assignSections(slots),
    totalMarks,
  };
}
