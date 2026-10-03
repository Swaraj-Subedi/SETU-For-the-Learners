/**
 * Rebalance — deterministic; called when fewer slots were filled than requested.
 * Redistributes marks so total stays exact.
 */
import type { Question } from '@/types';

export interface RebalanceResult {
  questions: Question[];
  notice: string | undefined;
  totalMarks: number;
}

export function rebalance(
  questions: Question[],
  targetTotal: number,
  requestedCount: number
): RebalanceResult {
  if (questions.length === 0) {
    return { questions: [], notice: undefined, totalMarks: 0 };
  }

  const actual = questions.length;
  const currentTotal = questions.reduce((s, q) => s + q.marks, 0);

  // If all slots were filled and marks are correct, nothing to do
  if (actual === requestedCount && currentTotal === targetTotal) {
    return { questions, notice: undefined, totalMarks: targetTotal };
  }

  // Scale marks proportionally so total equals targetTotal
  const scale = targetTotal / currentTotal;
  const rescaled = questions.map((q) => ({
    ...q,
    marks: Math.max(1, Math.round(q.marks * scale)),
  }));

  // Fix rounding drift on last question
  const rescaledTotal = rescaled.reduce((s, q) => s + q.marks, 0);
  const delta = targetTotal - rescaledTotal;
  if (delta !== 0 && rescaled.length > 0) {
    const last = rescaled[rescaled.length - 1];
    if (last) last.marks = Math.max(1, last.marks + delta);
  }

  const finalTotal = rescaled.reduce((s, q) => s + q.marks, 0);

  let notice: string | undefined;
  if (actual < requestedCount) {
    notice = `Your material supported ${actual} of the ${requestedCount} questions you asked for, so the marks were rebalanced to ${targetTotal}.`;
  }

  return { questions: rescaled, notice, totalMarks: finalTotal };
}
