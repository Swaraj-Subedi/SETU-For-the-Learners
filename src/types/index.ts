export type QuestionType =
  | 'mcq'
  | 'short'
  | 'long'
  | 'application'
  | 'analytical'
  | 'case_based'
  | 'exam_style';

export type AssessmentStyle =
  | 'class_test'
  | 'mid_term'
  | 'final_exam'
  | 'quick_revision'
  | 'entrance'
  | 'custom';

export type DifficultyLevel = 'easy' | 'balanced' | 'hard' | 'mixed';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionPlanItem {
  type: QuestionType;
  count: number;
  marksPerQuestion: number;
}

export interface FileChunk {
  id: string;
  fileId: string;
  fileName: string;
  page?: number;
  text: string;
  tokenCount: number;
}

export type FileStatus = 'idle' | 'reading' | 'ready' | 'error';

export interface IngestedFile {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  error?: string;
  text?: string;
  pageCount?: number;
  isScanned?: boolean;
  chunks: FileChunk[];
}

export interface QuestionPart {
  label: string;
  text: string;
  marks: number;
}

export interface QuestionOption {
  key: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface MarkingPoint {
  point: string;
  marks: number;
}

export interface QuestionEvidence {
  chunk_id: string;
  quote: string;
}

export interface Question {
  id: string;
  slot_id: string;
  type: QuestionType;
  topic_id: string;
  learning_outcome_ids: string[];
  marks: number;
  difficulty: QuestionDifficulty;
  stem: string;
  passage?: string;
  parts?: QuestionPart[];
  options?: QuestionOption[];
  correct_option?: string;
  model_answer: string;
  key_points: string[];
  marking_scheme: MarkingPoint[];
  explanation: string;
  evidence: QuestionEvidence[];
  estimated_minutes: number;
}

export interface BlueprintSlot {
  slot_id: string;
  section: string; // 'Section A', 'Section B', etc.
  type: QuestionType;
  marks: number;
  difficulty: QuestionDifficulty;
  topic_id: string;
}

export interface GeneratedPaper {
  id: string;
  title: string;
  subject: string;
  level: string;
  style: AssessmentStyle;
  durationMinutes: number;
  totalMarks: number;
  coverageSentence: string;
  instructions: string[];
  sections: {
    name: string; // e.g. "Section A — Multiple choice"
    description?: string;
    totalMarks: number;
    questions: Question[];
  }[];
  questions: Question[];
  rebalancedNotice?: string;
}

export type LLMProvider = 'ollama' | 'openai_compat' | 'gemini' | 'mock';

export interface LLMConfig {
  provider: LLMProvider;
  ollamaAddress: string;
  ollamaModel: string;
  openaiAddress: string;
  openaiModel: string;
  geminiApiKey: string;
  geminiModel: string;
  /** Maximum completion tokens for each model request. */
  maxOutputTokens: number;
  /** Maximum note context supplied to a question, in approximate tokens. */
  maxContextTokens: number;
}

export type PipelineStage =
  | 'idle'
  | 'reading'
  | 'mapping'
  | 'drafting'
  | 'checking'
  | 'setting'
  | 'done'
  | 'error';
