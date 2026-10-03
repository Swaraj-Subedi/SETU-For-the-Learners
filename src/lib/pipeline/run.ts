/**
 * Pipeline runner — orchestrates all stages end-to-end.
 */
import type { FileChunk, GeneratedPaper, LLMConfig } from '@/types';
import type { PaperSettings } from '@/store/session';
import { analyseSyllabus } from './syllabus';
import { buildBlueprint } from './blueprint';
import { retrieve } from './retrieve';
import { generateQuestion } from './generate';
import { validateQuestion, assembleQuestion, repairQuestionForSlot } from './validate';
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

function topicQuery(map: SyllabusMap, topicId: string, questionType: string): string {
  const topic = map.units.flatMap((unit) => unit.topics).find((item) => item.id === topicId);
  // Topic titles and subtopics are present in the student's notes; opaque IDs are not.
  return [topic?.title, ...(topic?.subtopics ?? []), questionType].filter(Boolean).join(' ');
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
  // Questions should be grounded in notes when notes exist. The syllabus maps
  // scope, but must not crowd out the actual teaching material.
  const questionSourceChunks = materialChunks.length > 0 ? materialChunks : syllabusChunks;

  const llm = createLLMClient(llmConfig, allChunks);

  // Stage 1: Analyse syllabus
  onStage?.('mapping', 'Mapping the topics');
  const syllabusMap = await analyseSyllabus(syllabusChunks, llm, signal, {
    maxContextTokens: llmConfig.maxContextTokens,
    maxOutputTokens: llmConfig.maxOutputTokens,
  });

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

  for (const [slotIndex, slot] of blueprint.slots.entries()) {
    if (signal?.aborted) throw new Error('Pipeline cancelled');

    onStage?.('drafting', `Drafting question ${slotIndex + 1} of ${settings.questionCount}`);
    const contextChunks = retrieve(topicQuery(syllabusMap, slot.topic_id, slot.type), questionSourceChunks, 6);
    let qOutput: QuestionOutput | null = null;
    let lastErrors: string[] = [];

    // A single malformed model response used to silently remove a question.
    // Retry once at the question level; JSON transport retries happen inside
    // generateQuestion. This is much faster than a second model critic call.
    for (let generationAttempt = 0; generationAttempt < 2; generationAttempt++) {
      const candidate = await generateQuestion(
        slot,
        syllabusMap,
        {
          subject: settings.subject,
          academicLevel: settings.level,
          assessmentStyle: settings.style === 'custom' ? settings.customStyleName ?? 'Custom assessment' : settings.style.replace(/_/g, ' '),
          assessmentInstructions: settings.assessmentInstructions,
          maxContextTokens: llmConfig.maxContextTokens,
          maxOutputTokens: llmConfig.maxOutputTokens,
        },
        contextChunks,
        existingStems,
        llm,
        signal,
        2,
        lastErrors.join('; ')
      );
      if (!candidate) {
        lastErrors = ['The model did not return valid JSON.'];
        continue;
      }

      const repaired = repairQuestionForSlot(candidate, slot, contextChunks.length > 0 ? contextChunks : questionSourceChunks);
      const validation = validateQuestion(repaired, slot, questionSourceChunks, filledOutputs);
      if (validation.ok) {
        qOutput = repaired;
        break;
      }
      onStage?.('checking', `Correcting question ${slotIndex + 1} of ${settings.questionCount}`);
      lastErrors = validation.errors;
    }

    if (!qOutput) {
      throw new Error(`Could not create question ${filledQuestions.length + 1} of ${settings.questionCount}. ${lastErrors[0] ?? 'Please try a model that supports JSON output.'}`);
    }

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

  onStage?.('setting', 'Setting the paper');
  // Never disguise an incomplete paper by rescaling the surviving questions.
  // A successful run always contains exactly the requested count and marks.
  const questions = filledQuestions;
  const totalMarks = settings.totalMarks;

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
