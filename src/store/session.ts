import { create } from 'zustand';
import type {
  IngestedFile,
  AssessmentStyle,
  DifficultyLevel,
  QuestionType,
  LLMConfig,
  PipelineStage,
  GeneratedPaper,
} from '@/types';

export interface PaperSettings {
  subject: string;
  level: string;
  style: AssessmentStyle;
  difficulty: DifficultyLevel;
  questionCount: number;
  durationMinutes: number;
  totalMarks: number;
  questionTypes: QuestionType[];
}

export const DEFAULT_SETTINGS: PaperSettings = {
  subject: '',
  level: '',
  style: 'class_test',
  difficulty: 'balanced',
  questionCount: 10,
  durationMinutes: 45,
  totalMarks: 30,
  questionTypes: ['mcq', 'short', 'application'],
};

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'ollama',
  ollamaAddress: 'http://localhost:11434',
  ollamaModel: 'qwen3:4b',
  openaiAddress: 'http://localhost:1234/v1',
  openaiModel: 'default',
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
};

export interface SessionState {
  // Step 1: Syllabus
  syllabus: IngestedFile | null;

  // Step 2: Study Materials
  studyMaterials: IngestedFile[];

  // Step 3 & 4: Settings
  settings: PaperSettings;

  // Model Layer
  llmConfig: LLMConfig;
  isModelConnected: boolean;
  modelConnectionStatus: 'untested' | 'testing' | 'connected' | 'error';
  modelConnectionError?: string;

  // Pipeline Execution State
  pipelineStage: PipelineStage;
  stageMessage: string;
  abortController: AbortController | null;

  // Paper & Attempt State
  paper: GeneratedPaper | null;
  attempts: Record<string, string>; // questionId -> answer
  revealedAnswers: Record<string, boolean>; // questionId -> boolean
  includeAnswerKey: boolean;

  // Actions
  setSyllabus: (file: IngestedFile | null) => void;
  removeSyllabus: () => void;
  addStudyMaterials: (files: IngestedFile[]) => void;
  updateStudyMaterial: (id: string, updates: Partial<IngestedFile>) => void;
  removeStudyMaterial: (id: string) => void;

  updateSettings: (settings: Partial<PaperSettings>) => void;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;
  setModelConnection: (
    status: 'untested' | 'testing' | 'connected' | 'error',
    isConnected: boolean,
    error?: string
  ) => void;

  setPipelineStage: (stage: PipelineStage, message: string) => void;
  setAbortController: (controller: AbortController | null) => void;
  cancelPipeline: () => void;

  setPaper: (paper: GeneratedPaper | null) => void;
  clearPaper: () => void;
  setAttempt: (questionId: string, text: string) => void;
  revealAnswer: (questionId: string) => void;
  toggleIncludeAnswerKey: () => void;
  updateQuestionInPaper: (updatedQuestion: GeneratedPaper['questions'][0]) => void;

  clearEverything: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  syllabus: null,
  studyMaterials: [],
  settings: { ...DEFAULT_SETTINGS },
  llmConfig: { ...DEFAULT_LLM_CONFIG },
  isModelConnected: false,
  modelConnectionStatus: 'untested',
  modelConnectionError: undefined,

  pipelineStage: 'idle',
  stageMessage: '',
  abortController: null,

  paper: null,
  attempts: {},
  revealedAnswers: {},
  includeAnswerKey: false,

  setSyllabus: (file) => set({ syllabus: file }),
  removeSyllabus: () => set({ syllabus: null }),

  addStudyMaterials: (files) =>
    set((state) => ({
      studyMaterials: [...state.studyMaterials, ...files].slice(0, 10),
    })),

  updateStudyMaterial: (id, updates) =>
    set((state) => ({
      studyMaterials: state.studyMaterials.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  removeStudyMaterial: (id) =>
    set((state) => ({
      studyMaterials: state.studyMaterials.filter((f) => f.id !== id),
    })),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  updateLLMConfig: (config) =>
    set((state) => ({
      llmConfig: { ...state.llmConfig, ...config },
    })),

  setModelConnection: (status, isConnected, error) =>
    set({
      modelConnectionStatus: status,
      isModelConnected: isConnected,
      modelConnectionError: error,
    }),

  setPipelineStage: (stage, message) =>
    set({
      pipelineStage: stage,
      stageMessage: message,
    }),

  setAbortController: (controller) => set({ abortController: controller }),

  cancelPipeline: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      pipelineStage: 'idle',
      stageMessage: '',
      abortController: null,
    });
  },

  setPaper: (paper) =>
    set({
      paper,
      pipelineStage: paper ? 'done' : 'idle',
      attempts: {},
      revealedAnswers: {},
    }),

  clearPaper: () =>
    set({
      paper: null,
      pipelineStage: 'idle',
      stageMessage: '',
      attempts: {},
      revealedAnswers: {},
    }),

  setAttempt: (questionId, text) =>
    set((state) => ({
      attempts: { ...state.attempts, [questionId]: text },
    })),

  revealAnswer: (questionId) =>
    set((state) => ({
      revealedAnswers: { ...state.revealedAnswers, [questionId]: true },
    })),

  toggleIncludeAnswerKey: () =>
    set((state) => ({
      includeAnswerKey: !state.includeAnswerKey,
    })),

  updateQuestionInPaper: (updatedQuestion) =>
    set((state) => {
      if (!state.paper) return state;
      const updatedQuestions = state.paper.questions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      );
      const updatedSections = state.paper.sections.map((sec) => ({
        ...sec,
        questions: sec.questions.map((q) =>
          q.id === updatedQuestion.id ? updatedQuestion : q
        ),
      }));
      // Clear attempt and revealed answer for this question
      const newAttempts = { ...state.attempts };
      delete newAttempts[updatedQuestion.id];
      const newRevealed = { ...state.revealedAnswers };
      delete newRevealed[updatedQuestion.id];

      return {
        paper: {
          ...state.paper,
          questions: updatedQuestions,
          sections: updatedSections,
        },
        attempts: newAttempts,
        revealedAnswers: newRevealed,
      };
    }),

  clearEverything: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      syllabus: null,
      studyMaterials: [],
      settings: { ...DEFAULT_SETTINGS },
      paper: null,
      attempts: {},
      revealedAnswers: {},
      includeAnswerKey: false,
      pipelineStage: 'idle',
      stageMessage: '',
      abortController: null,
    });
  },
}));
