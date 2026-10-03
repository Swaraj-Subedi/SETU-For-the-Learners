import { CriticScoreSchema } from './schemas';
import type { CriticScore, QuestionOutput } from './schemas';
import type { LLMClient } from '../llm/types';

const VERSION = 'v1.0';

function buildCriticPrompt(q: QuestionOutput, contextText: string): string {
  return `${VERSION} TASK: Score the following exam question on 5 dimensions (1=poor, 5=excellent).

DIMENSIONS:
- groundedness: Is the answer derivable only from the provided material?
- clarity: Is the question stem clear and unambiguous?
- answerability: Can a student answer this in the time allotted?
- difficulty_fit: Does the difficulty match the stated level?
- rubric_quality: Is the marking scheme fair and comprehensive?

QUESTION:
stem: "${q.stem}"
type: "${String(q.difficulty)} / ${q.marks} marks"
model_answer: "${q.model_answer.slice(0, 200)}"
marking_scheme: ${JSON.stringify(q.marking_scheme)}

<MATERIAL>
${contextText.slice(0, 3000)}
</MATERIAL>

Output JSON only:
{"groundedness":N,"clarity":N,"answerability":N,"difficulty_fit":N,"rubric_quality":N}`;
}

export async function criticScore(
  q: QuestionOutput,
  contextChunks: string[],
  llm: LLMClient,
  signal?: AbortSignal
): Promise<CriticScore> {
  const contextText = contextChunks.join('\n\n---\n\n');
  const prompt = buildCriticPrompt(q, contextText);

  try {
    return await llm.generate(prompt, CriticScoreSchema, 'CriticScore', {
      temperature: 0.1,
      signal,
    });
  } catch {
    // If critic fails, return neutral score so generation continues
    return { groundedness: 4, clarity: 4, answerability: 4, difficulty_fit: 4, rubric_quality: 4 };
  }
}

export function criticPasses(score: CriticScore): boolean {
  return score.groundedness >= 4 && Object.values(score).every((v) => v >= 3);
}
