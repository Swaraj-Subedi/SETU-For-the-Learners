/**
 * Pipeline runner — orchestrates all stages end-to-end.
 */
import type { FileChunk, GeneratedPaper, LLMConfig } from '@/types';
import type { PaperSettings } from '@/store/session';
import { analyseSyllabus } from './syllabus';
import { buildBlueprint } from './blueprint';
import { retrieve } from './retrieve';
import { generateQuestion } from './generate';
import { validateQuestion, assembleQuestion } from './validate';
import { criticScore, criticPasses } from './critic';
import { rebalance } from './rebalance';
import type { QuestionOutput, SyllabusMap } from './schemas';
import { createOllamaClient } from '../llm/ollama';
import { createOpenAICompatClient } from '../llm/openaiCompat';
import { createGeminiClient } from '../llm/gemini';
import { createMockClient } from '../llm/mock';
import type { LLMClient } from '../llm/types';

export type StageCallback = (stage: string, message: string) => void;

function createLLMClient(config: LLMConfig, allChunks: FileChunk[]): LLMClient {
  const isMock = import.meta.env.VITE_ENABLE_MOCK === 'true' || config.provider === 'mock';
  if (isMock) return createMockClient(allChunks);

  switch (config.provider) {
    case 'ollama':
      return createOllamaClient(config.ollamaAddress, config.ollamaModel);
    case 'openai_compat':
      return createOpenAICompatClient(config.openaiAddress, config.openaiModel);
    case 'gemini':
      return createGeminiClient(config.geminiApiKey, config.geminiModel);
    default:
      return createMockClient(allChunks);
  }
}

function buildSections(
  questions: ReturnType<typeof assembleQuestion>[],
  slotsMap: Map<string, { section: string; type: string }>
): GeneratedPaper['sections'] {
  const sectionMap = new Map<string, { questions: typeof questions; totalMarks: number; type: string }>();

  questions.forEach((q) => {
    const slotInfo = slotsMap.get(q.slot_id);
    const sectionName = slotInfo?.section ?? 'Section A';
    const existing = sectionMap.get(sectionName) ?? { questions: [], totalMarks: 0, type: slotInfo?.type ?? '' };
    existing.questions.push(q);
    existing.totalMarks += q.marks;
    sectionMap.set(sectionName, existing);
  });

  return Array.from(sectionMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, data]) => ({
      name: `${name} — ${formatTypeName(data.type)} (${data.totalMarks} marks)`,
      totalMarks: data.totalMarks,
      questions: data.questions,
    }));
}

function formatTypeName(type: string): string {
  const labels: Record<string, string> = {
    mcq: 'Multiple choice',
    short: 'Short answer',
    long: 'Long answer',
    application: 'Application',
    analytical: 'Analytical',
    case_based: 'Case-based',
    exam_style: 'Examination questions',
  };
  return labels[type] ?? type;
}

function buildCoverageSentence(questions: ReturnType<typeof assembleQuestion>[], map: SyllabusMap): string {
  const coveredUnits = new Set<string>();
  const allTopicIds = new Set(questions.map((q) => q.topic_id));

  map.units.forEach((u) => {
    if (u.topics.some((t) => allTopicIds.has(t.id))) {
      coveredUnits.add(u.id);
    }
  });

  const totalUnits = map.units.length;
  const covered = coveredUnits.size;

  if (covered === totalUnits && totalUnits > 0) {
    return `Covers all ${totalUnits} unit${totalUnits > 1 ? 's' : ''} of your syllabus.`;
  }
  return `Covers ${covered} of ${totalUnits} units of your syllabus.`;
}

export interface PipelineInput {
  syllabusChunks: FileChunk[];
  materialChunks: FileChunk[];
  settings: PaperSettings;
  llmConfig: LLMConfig;
  signal?: AbortSignal;
  onStage?: StageCallback;
}

export async function runPipeline(input: PipelineInput): Promise<GeneratedPaper> {
  const { syllabusChunks, materialChunks, settings, llmConfig, signal, onStage } = input;
  const allChunks = [...syllabusChunks, ...materialChunks];

  const llm = createLLMClient(llmConfig, allChunks);

  // Stage 1: Analyse syllabus
  onStage?.('mapping', 'Mapping the topics');
  const syllabusMap = await analyseSyllabus(syllabusChunks, llm, signal);

  // Stage 2: Blueprint (deterministic)
  const blueprint = buildBlueprint(settings, syllabusMap);

  // Stage 3: Generate questions
  onStage?.('drafting', 'Drafting questions');
  const filledQuestions: ReturnType<typeof assembleQuestion>[] = [];
  const filledOutputs: QuestionOutput[] = [];
  const existingStems: string[] = [];
  const slotsMap = new Map(
    blueprint.slots.map((s) => [s.slot_id, { section: s.section, type: s.type }])
  );

  let questionIndex = 0;

  for (const slot of blueprint.slots) {
    if (signal?.aborted) throw new Error('Pipeline cancelled');

    const contextChunks = retrieve(
      `${slot.topic_id} ${slot.type}`,
      allChunks,
      6
    );

    const qOutput = await generateQuestion(
      slot,
      syllabusMap,
      contextChunks,
      existingStems,
      llm,
      signal
    );

    if (!qOutput) continue;

    // Stage 4: Validate
    const validation = validateQuestion(qOutput, slot, allChunks, filledOutputs);
    if (!validation.ok) {
      // One retry with adjusted prompt (skip for now — rebalance handles missing questions)
      continue;
    }

    // Stage 5: Critic
    onStage?.('checking', 'Checking coverage and marks');
    const criticResult = await criticScore(
      qOutput,
      contextChunks.map((c) => c.text),
      llm,
      signal
    );

    if (!criticPasses(criticResult)) continue;

    questionIndex++;
    const assembled = assembleQuestion(
      qOutput,
      slot,
      `q_${questionIndex}`
    );
    filledQuestions.push(assembled);
    filledOutputs.push(qOutput);
    existingStems.push(qOutput.stem);
  }

  // Stage 6: Rebalance
  onStage?.('setting', 'Setting the paper');
  const { questions, notice, totalMarks } = rebalance(
    filledQuestions,
    settings.totalMarks,
    settings.questionCount
  );

  if (questions.length === 0) {
    throw new Error('Could not generate any valid questions from your material. Try adding more study notes or a different model.');
  }

  // Build paper
  const sections = buildSections(questions, slotsMap);
  const coverageSentence = buildCoverageSentence(questions, syllabusMap);

  const instructions = buildInstructions(settings);

  const paper: GeneratedPaper = {
    id: `paper_${Date.now()}`,
    title: `${settings.subject} Practice Paper`,
    subject: settings.subject,
    level: settings.level,
    style: settings.style,
    durationMinutes: settings.durationMinutes,
    totalMarks,
    coverageSentence,
    instructions,
    sections,
    questions,
    rebalancedNotice: notice,
  };

  return paper;
}

function buildInstructions(settings: PaperSettings): string[] {
  const instr: string[] = [];
  instr.push(`Answer all questions. Total marks: ${settings.totalMarks}.`);
  instr.push(`Duration: ${settings.durationMinutes} minutes.`);

  if (settings.questionTypes.includes('mcq')) {
    instr.push('For multiple choice questions, circle or clearly indicate your chosen option.');
  }
  if (settings.questionTypes.some((t) => ['long', 'analytical', 'case_based'].includes(t))) {
    instr.push('For extended response questions, write in clear, full sentences.');
  }
  instr.push('Marks for each question are shown in brackets.');
  return instr;
}
