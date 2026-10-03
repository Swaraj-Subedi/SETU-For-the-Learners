import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '@/store/session';
import { SetuLogo } from '@/components/SetuLogo';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FileDrop } from '@/components/FileDrop';
import { FileRow } from '@/components/FileRow';
import { Segmented } from '@/components/Segmented';
import { MultiSelect } from '@/components/MultiSelect';
import { Notice } from '@/components/Notice';
import { ModelSheet } from '@/components/ModelSheet';
import { Processing } from '@/components/Processing';
import { PaperView } from '@/components/PaperView';
import { processFileIntake } from '@/lib/files/ingest';
import { runPipeline } from '@/lib/pipeline/run';
import type { AssessmentStyle, DifficultyLevel, QuestionType, IngestedFile, QuestionPlanItem } from '@/types';

const LEVEL_SUGGESTIONS = [
  'Grade 10',
  'Class 12',
  'Undergraduate year 2',
  'Entrance exam',
];

const STYLE_DEFAULTS: Record<
  AssessmentStyle,
  { duration: number; plan: QuestionPlanItem[] }
> = {
  class_test: { duration: 45, plan: [{ type: 'mcq', count: 3, marksPerQuestion: 1 }, { type: 'short', count: 4, marksPerQuestion: 3 }, { type: 'application', count: 3, marksPerQuestion: 5 }] },
  mid_term: { duration: 90, plan: [{ type: 'mcq', count: 4, marksPerQuestion: 1 }, { type: 'short', count: 4, marksPerQuestion: 2 }, { type: 'long', count: 4, marksPerQuestion: 5 }, { type: 'application', count: 3, marksPerQuestion: 6 }] },
  final_exam: { duration: 180, plan: [{ type: 'mcq', count: 4, marksPerQuestion: 1 }, { type: 'short', count: 4, marksPerQuestion: 3 }, { type: 'long', count: 3, marksPerQuestion: 8 }, { type: 'application', count: 3, marksPerQuestion: 6 }, { type: 'analytical', count: 3, marksPerQuestion: 6 }, { type: 'case_based', count: 3, marksPerQuestion: 8 }] },
  quick_revision: { duration: 20, plan: [{ type: 'mcq', count: 3, marksPerQuestion: 1 }, { type: 'short', count: 2, marksPerQuestion: 6 }] },
  entrance: { duration: 60, plan: [{ type: 'mcq', count: 30, marksPerQuestion: 2 }] },
  custom: { duration: 45, plan: [{ type: 'short', count: 5, marksPerQuestion: 3 }] },
};

const DEFAULT_MARKS: Record<QuestionType, number> = { mcq: 1, short: 3, long: 6, application: 5, analytical: 5, case_based: 8, exam_style: 5 };

export const Home: React.FC = () => {
  const {
    syllabus,
    setSyllabus,
    removeSyllabus,
    studyMaterials,
    addStudyMaterials,
    updateStudyMaterial,
    removeStudyMaterial,
    settings,
    updateSettings,
    isModelConnected,
    llmConfig,
    pipelineStage,
    paper,
    clearEverything,
    setPipelineStage,
    setPaper,
    setAbortController,
    cancelPipeline,
  } = useSessionStore();

  const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);

  const handleCreatePaper = async () => {
    if (!canGenerate) return;

    const controller = new AbortController();
    setAbortController(controller);
    setPipelineStage('reading', 'Reading your syllabus');

    try {
      const syllabusChunks = syllabus?.chunks ?? [];
      const materialChunks = studyMaterials.flatMap((f) => f.chunks);

      setPipelineStage('mapping', 'Mapping the topics');

      const generated = await runPipeline({
        syllabusChunks,
        materialChunks,
        settings,
        llmConfig,
        signal: controller.signal,
        onStage: (stage, message) => {
          setPipelineStage(stage as Parameters<typeof setPipelineStage>[0], message);
        },
      });

      setPaper(generated);
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('cancelled') || err.message.includes('Pipeline cancelled'))) {
        cancelPipeline();
        return;
      }
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setPipelineStage('error', msg);
    }
  };

  // If paper is generated, show the Paper view
  if (paper) {
    return <PaperView />;
  }

  // If pipeline is running, show the Processing screen
  if (pipelineStage !== 'idle' && pipelineStage !== 'done') {
    return <Processing onRetry={handleCreatePaper} />;
  }

  // Handlers for file selection
  const handleSyllabusDrop = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setSyllabusError(null);

    // Set initial loading state
    const tempSyllabus: IngestedFile = {
      id: `syl-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: '.' + file.name.split('.').pop()?.toLowerCase(),
      status: 'reading',
      chunks: [],
    };
    setSyllabus(tempSyllabus);

    const processed = await processFileIntake(file, true, 0, 0);
    setSyllabus(processed);
    if (processed.status === 'error') {
      setSyllabusError(processed.error || 'Failed to read syllabus');
    }
  };

  const handleMaterialsDrop = async (files: File[]) => {
    if (files.length === 0) return;
    const currentTotalBytes = studyMaterials.reduce((acc, f) => acc + f.size, 0);

    for (const file of files) {
      const tempItem: IngestedFile = {
        id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: file.size,
        type: '.' + file.name.split('.').pop()?.toLowerCase(),
        status: 'reading',
        chunks: [],
      };
      addStudyMaterials([tempItem]);

      const processed = await processFileIntake(
        file,
        false,
        studyMaterials.length,
        currentTotalBytes
      );
      updateStudyMaterial(tempItem.id, processed);
    }
  };

  const handleStyleChange = (style: AssessmentStyle) => {
    if (style === 'custom') {
      updateSettings({ style });
      return;
    }
    const defaults = STYLE_DEFAULTS[style];
    updateSettings({
      style,
      durationMinutes: defaults.duration,
      questionPlan: defaults.plan,
    });
  };

  // Presets are a starting point. Once the blueprint is edited, label the
  // assessment honestly as Custom rather than leaving a misleading preset on.
  const updatePlan = (nextPlan: QuestionPlanItem[]) => updateSettings({ style: 'custom', questionPlan: nextPlan });

  const handleTypesChange = (types: QuestionType[]) => {
    const existing = new Map((settings.questionPlan ?? []).map((item) => [item.type, item]));
    updatePlan(types.map((type) => existing.get(type) ?? { type, count: 1, marksPerQuestion: DEFAULT_MARKS[type] }));
  };

  // Validation Checks
  const isSyllabusReady = syllabus?.status === 'ready';
  const hasSubject = settings.subject.trim().length > 0;
  const hasLevel = settings.level.trim().length > 0;
  const isSettingsValid =
    hasSubject &&
    hasLevel &&
    settings.questionCount > 0 &&
    settings.totalMarks >= settings.questionCount &&
    settings.durationMinutes > 0 &&
    (settings.questionPlan?.length ?? 0) > 0;

  // Mock mode check
  const isMockMode = import.meta.env.VITE_ENABLE_MOCK === 'true';
  const canGenerate = isSyllabusReady && isSettingsValid && (isModelConnected || isMockMode);

  // Compute disabled reason
  let disabledReason = '';
  if (!isSyllabusReady) {
    disabledReason = 'Add your syllabus above to enable generation';
  } else if (!hasSubject) {
    disabledReason = 'Enter the subject name (Step 03)';
  } else if (!hasLevel) {
    disabledReason = 'Enter or select the academic level (Step 03)';
  } else if (settings.questionTypes.length === 0) {
    disabledReason = 'Select at least one question type (Step 04)';
  } else if (!isModelConnected && !isMockMode) {
    disabledReason = 'Connect a model to generate questions';
  }

  const showDurationWarning = settings.durationMinutes < settings.questionCount * 1.5;

  const assessmentOptions: Array<{ value: AssessmentStyle; label: string; sublabel: string }> = [
    { value: 'class_test', label: 'Class test', sublabel: '10 Qs • 30 M' },
    { value: 'mid_term', label: 'Mid-term', sublabel: '15 Qs • 50 M' },
    { value: 'final_exam', label: 'Final exam', sublabel: '20 Qs • 100 M' },
    { value: 'quick_revision', label: 'Quick revision', sublabel: '5 Qs • 15 M' },
    { value: 'entrance', label: 'Entrance-style', sublabel: '30 Qs • 60 M' },
    { value: 'custom', label: 'Custom', sublabel: `${settings.questionCount} Qs • ${settings.totalMarks} M` },
  ];


  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col justify-between selection:bg-sage/40">
      {/* Skip to Content for WCAG accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-ink focus:text-ivory focus:rounded-sm focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Bar */}
      <header className="app-header border-b border-sage/60 py-3.5 px-4 sm:px-8">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <Link to="/" className="inline-flex items-center" aria-label="Setu home">
            <SetuLogo size="md" />
          </Link>

          <nav aria-label="Quick actions" className="flex items-center gap-4 sm:gap-6 text-xs">
            <button
              type="button"
              onClick={() => setIsModelSheetOpen(true)}
              className="text-ink-soft hover:text-ink transition-colors flex items-center gap-1.5 py-1"
            >
              <span>Model</span>
              {isModelConnected ? (
                <span className="w-1.5 h-1.5 rounded-full bg-sage-ink inline-block" title="Model connected" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-coral inline-block" title="Model not connected" />
              )}
            </button>

            <Link to="/privacy" className="text-ink-soft hover:text-ink transition-colors py-1">
              Privacy
            </Link>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all files and reset inputs?')) {
                  clearEverything();
                }
              }}
              className="text-ink-soft hover:text-coral transition-colors py-1"
            >
              Clear everything
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="app-main max-w-container mx-auto w-full px-4 sm:px-8 py-10 sm:py-16 flex-1 animate-page-rise">
        <div className="space-y-16">
          {/* STEP 01: Syllabus (Required Hero) */}
          <section
            id="step-syllabus"
            aria-labelledby="step-01-heading"
            className="setup-section grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-12"
          >
            <div className="md:sticky md:top-8 self-start">
              <span className="font-mono text-xs uppercase text-sage-ink font-semibold tracking-label block mb-1">
                01 Syllabus
              </span>
              <span className="text-xs text-ink-soft">Required</span>
            </div>

            <div className="space-y-4">
              <h1 id="step-01-heading" className="text-3xl sm:text-4xl md:text-5xl font-serif text-ink tracking-tight leading-[1.15]">
                Practice, built from your own pages.
              </h1>
              <p className="text-sm text-ink-soft leading-relaxed max-w-prose">
                Drop your syllabus below. Setu extracts units, topics, and stated mark weights directly in your browser.
              </p>

              {!syllabus ? (
                <FileDrop
                  id="syllabus-upload"
                  accept=".pdf,.docx,.txt"
                  label="Upload syllabus file"
                  headline="Drop your syllabus here, or choose a file"
                  subtext="Accepts PDF, DOCX, TXT (up to 20 MB)"
                  onFilesSelected={handleSyllabusDrop}
                />
              ) : (
                <div className="space-y-2">
                  <FileRow
                    file={syllabus}
                    onRemove={removeSyllabus}
                  />
                  {syllabus.status === 'ready' && (
                    <p className="text-xs text-sage-ink font-medium pl-1">
                      Syllabus loaded: {syllabus.chunks.length} chunks mapped in memory.
                    </p>
                  )}
                  {syllabusError && (
                    <Notice variant="error" className="mt-2">
                      {syllabusError}
                    </Notice>
                  )}
                </div>
              )}
            </div>
          </section>

          <hr className="rule-subtle" />

          {/* STEP 02: Study Material (Optional) */}
          <section
            id="step-material"
            aria-labelledby="step-02-heading"
            className="setup-section setup-section--materials grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-12"
          >
            <div className="md:sticky md:top-8 self-start">
              <span className="font-mono text-xs uppercase text-sage-ink font-semibold tracking-label block mb-1">
                02 Study Material
              </span>
              <span className="text-xs text-ink-soft">Optional</span>
            </div>

            <div className="space-y-4">
              <div>
                <h2 id="step-02-heading" className="text-xl sm:text-2xl font-serif text-ink tracking-tight mb-1">
                  Notes, references, and scanned pages
                </h2>
                <p className="text-xs sm:text-sm text-ink-soft max-w-prose">
                  Setu grounds all question stems, passages, and marking rubrics only in the text you provide.
                </p>
              </div>

              <FileDrop
                id="materials-upload"
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                multiple
                label="Upload study material files"
                headline="Drop notes and reference files, or choose files"
                subtext="PDF, DOCX, TXT, JPG, PNG, WEBP (up to 10 files, 60 MB total)"
                onFilesSelected={handleMaterialsDrop}
              />

              {studyMaterials.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {studyMaterials.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      onRemove={removeStudyMaterial}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <hr className="rule-subtle" />

          {/* STEP 03: Subject and Level */}
          <section
            id="step-subject"
            aria-labelledby="step-03-heading"
            className="setup-section setup-section--subject grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-12"
          >
            <div className="md:sticky md:top-8 self-start">
              <span className="font-mono text-xs uppercase text-sage-ink font-semibold tracking-label block mb-1">
                03 Subject &amp; Level
              </span>
              <span className="text-xs text-ink-soft">Required</span>
            </div>

            <div className="space-y-6 max-w-xl">
              <Field
                id="field-subject"
                label="Subject name"
                placeholder="e.g. Organic Chemistry, Macroeconomics, Indian Polity"
                value={settings.subject}
                onChange={(e) => updateSettings({ subject: e.target.value })}
                required
              />

              <Field
                id="field-level"
                label="Academic level"
                placeholder="e.g. Class 12, Grade 10, Undergraduate"
                value={settings.level}
                onChange={(e) => updateSettings({ level: e.target.value })}
                suggestions={LEVEL_SUGGESTIONS}
                onSelectSuggestion={(sug) => updateSettings({ level: sug })}
                required
              />
            </div>
          </section>

          <hr className="rule-subtle" />

          {/* STEP 04: Paper Structure & Blueprint */}
          <section
            id="step-paper"
            aria-labelledby="step-04-heading"
            className="setup-section setup-section--paper grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-12"
          >
            <div className="md:sticky md:top-8 self-start">
              <span className="font-mono text-xs uppercase text-sage-ink font-semibold tracking-label block mb-1">
                04 Paper Settings
              </span>
              <span className="text-xs text-ink-soft">Customizable</span>
            </div>

            <div className="space-y-8">
              {/* Assessment Style */}
              <Segmented<AssessmentStyle>
                name="assessment-style"
                label="Assessment style"
                value={settings.style}
                onChange={handleStyleChange}
                options={assessmentOptions}
              />

              <div className="rounded-md border border-violet/15 bg-white/60 p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Make this assessment your own</h3>
                  <p className="text-xs text-ink-soft mt-1">Presets are only starting points. Edit the blueprint below, or describe a format the AI should follow.</p>
                </div>
                {settings.style === 'custom' && (
                  <>
                    <div aria-live="polite" className="inline-flex items-center rounded-full bg-violet/10 px-3 py-1 text-xs font-medium text-violet-deep">
                      Custom format · {settings.questionCount} questions · {settings.totalMarks} marks · {settings.durationMinutes} min
                    </div>
                    <Field
                      id="custom-style-name"
                      label="Assessment name"
                      value={settings.customStyleName ?? ''}
                      onChange={(e) => updateSettings({ customStyleName: e.target.value })}
                      placeholder="e.g. Weekly concept check"
                    />
                  </>
                )}
                <div>
                  <label htmlFor="assessment-instructions" className="block text-xs uppercase font-medium tracking-label text-sage-ink mb-1.5">Style brief for the AI</label>
                  <textarea
                    id="assessment-instructions"
                    rows={3}
                    value={settings.assessmentInstructions ?? ''}
                    onChange={(e) => updateSettings({ assessmentInstructions: e.target.value })}
                    placeholder="e.g. Use a formal board-exam format. Include numerical problems, but no derivations."
                    className="w-full bg-white px-3 py-2.5 text-sm text-ink border border-violet/20 focus:border-violet focus:outline-none placeholder:text-ink-soft/50 resize-y"
                  />
                  <p className="text-[11px] text-ink-soft mt-1">This instruction is included in every question-generation request.</p>
                </div>
              </div>

              {/* Difficulty */}
              <Segmented<DifficultyLevel>
                name="difficulty"
                label="Target difficulty"
                value={settings.difficulty}
                onChange={(diff) => updateSettings({ difficulty: diff })}
                options={[
                  { value: 'easy', label: 'Easy', sublabel: 'Foundational' },
                  { value: 'balanced', label: 'Balanced', sublabel: '30 / 50 / 20' },
                  { value: 'hard', label: 'Hard', sublabel: 'Rigorous' },
                  { value: 'mixed', label: 'Mixed', sublabel: 'Broad span' },
                ]}
              />

              {/* Exact question blueprint */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs uppercase font-medium tracking-label text-sage-ink mb-1.5 select-none">
                    Total questions
                  </label>
                  <div className="w-full bg-paper px-3 py-2 text-ink text-base rounded-sm border-b-2 border-sage/60 tabular-nums">{settings.questionCount}</div>
                </div>

                <div>
                  <label htmlFor="input-duration" className="block text-xs uppercase font-medium tracking-label text-sage-ink mb-1.5 select-none">
                    Duration (Minutes)
                  </label>
                  <input
                    id="input-duration"
                    type="number"
                    min={5}
                    max={360}
                    step={5}
                    value={settings.durationMinutes}
                    onChange={(e) => updateSettings({ style: 'custom', durationMinutes: parseInt(e.target.value) || 10 })}
                    className="w-full bg-paper px-3 py-2 text-ink text-base rounded-sm border-b-2 border-sage/60 focus:border-ink focus:outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-medium tracking-label text-sage-ink mb-1.5 select-none">
                    Total marks
                  </label>
                  <div className="w-full bg-paper px-3 py-2 text-ink text-base rounded-sm border-b-2 border-sage/60 tabular-nums">{settings.totalMarks}</div>
                </div>
              </div>

              {/* Question Types */}
              <MultiSelect
                label="Question types"
                selected={settings.questionTypes}
                onChange={handleTypesChange}
              />

              <div className="border border-sage/40 rounded-sm overflow-hidden">
                <div className="grid grid-cols-[1fr_84px_96px_76px] gap-2 bg-paper px-3 py-2 text-[10px] uppercase tracking-label text-sage-ink font-medium">
                  <span>Question type</span><span>How many</span><span>Marks each</span><span>Total</span>
                </div>
                {(settings.questionPlan ?? []).map((item, index) => (
                  <div key={item.type} className="grid grid-cols-[1fr_84px_96px_76px] gap-2 items-center px-3 py-2 border-t border-sage/30 text-xs">
                    <span className="capitalize text-ink">{item.type.replace('_', ' ')}</span>
                    <input aria-label={`${item.type} question count`} type="number" min={1} max={50} value={item.count} onChange={(e) => updatePlan((settings.questionPlan ?? []).map((entry, entryIndex) => entryIndex === index ? { ...entry, count: Math.max(1, parseInt(e.target.value, 10) || 1) } : entry))} className="w-full bg-paper px-2 py-1 border-b border-sage/60 focus:outline-none focus:border-ink tabular-nums" />
                    <input aria-label={`${item.type} marks per question`} type="number" min={1} max={100} value={item.marksPerQuestion} onChange={(e) => updatePlan((settings.questionPlan ?? []).map((entry, entryIndex) => entryIndex === index ? { ...entry, marksPerQuestion: Math.max(1, parseInt(e.target.value, 10) || 1) } : entry))} className="w-full bg-paper px-2 py-1 border-b border-sage/60 focus:outline-none focus:border-ink tabular-nums" />
                    <span className="tabular-nums text-sage-ink">{item.count * item.marksPerQuestion}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-soft">This blueprint is sent directly to the model: it will create exactly these counts, marks, and question types.</p>

              {showDurationWarning && (
                <Notice variant="info">
                  {settings.durationMinutes} minutes may be tight for {settings.questionCount} questions. Consider allowing 2–3 minutes per question for written formats.
                </Notice>
              )}
            </div>
          </section>

          {/* Action Row */}
          <div className="launch-panel flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="text-xs text-ink-soft leading-relaxed max-w-md">
              Your files are read inside your browser. Nothing is uploaded to Setu or saved anywhere. Close the tab and it is all gone.
            </p>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={!canGenerate}
                onClick={handleCreatePaper}
              >
                Create practice paper
              </Button>
              {disabledReason && (
                <span className="text-xs text-ink-soft select-none">
                  {disabledReason}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Model Configuration Modal */}
      <ModelSheet
        open={isModelSheetOpen}
        onOpenChange={setIsModelSheetOpen}
      />

      {/* Footer */}
      <footer className="app-footer border-t border-sage/60 py-6 px-4 sm:px-8 text-xs text-ink-soft flex flex-wrap items-center justify-between gap-4">
        <span>Setu &bull; Single-page in-browser practice paper generator</span>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-ink">
            Privacy policy
          </Link>
          <span>&bull;</span>
          <span>No accounts &bull; Memory only</span>
        </div>
      </footer>
    </div>
  );
};
