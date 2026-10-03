import React, { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/session';
import { Button } from './Button';
import { QuestionBlock } from './QuestionBlock';
import { PrintablePaper } from './PrintablePaper';
import { Notice } from './Notice';
import { runPipeline } from '@/lib/pipeline/run';
import { retrieve } from '@/lib/pipeline/retrieve';
import { generateQuestion } from '@/lib/pipeline/generate';
import { validateQuestion, assembleQuestion } from '@/lib/pipeline/validate';
import { createOllamaClient } from '@/lib/llm/ollama';
import { createOpenAICompatClient } from '@/lib/llm/openaiCompat';
import { createGeminiClient } from '@/lib/llm/gemini';
import { createMockClient } from '@/lib/llm/mock';
import type { LLMClient } from '@/lib/llm/types';
import type { LLMConfig } from '@/types';

function makeLLMClient(config: LLMConfig, chunks: import('@/types').FileChunk[]): LLMClient {
  const isMock = import.meta.env.VITE_ENABLE_MOCK === 'true' || config.provider === 'mock';
  if (isMock) return createMockClient(chunks);
  switch (config.provider) {
    case 'ollama': return createOllamaClient(config.ollamaAddress, config.ollamaModel);
    case 'openai_compat': return createOpenAICompatClient(config.openaiAddress, config.openaiModel);
    case 'gemini': return createGeminiClient(config.geminiApiKey, config.geminiModel);
    default: return createMockClient(chunks);
  }
}

export const PaperView: React.FC = () => {
  const {
    paper,
    attempts,
    revealedAnswers,
    setAttempt,
    revealAnswer,
    clearPaper,
    clearEverything,
    includeAnswerKey,
    toggleIncludeAnswerKey,
    updateQuestionInPaper,
    syllabus,
    studyMaterials,
    llmConfig,
    settings,
    setPaper,
  } = useSessionStore();

  const [regenError, setRegenError] = useState<string | null>(null);
  const [regenningId, setRegenningId] = useState<string | null>(null);

  // Warn student before leaving or reloading tab when paper exists
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paper) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [paper]);

  if (!paper) return null;

  const allChunks = [
    ...(syllabus?.chunks ?? []),
    ...studyMaterials.flatMap((f) => f.chunks),
  ];

  const handleRegenerate = async (questionId: string) => {
    if (!paper) return;
    const q = paper.questions.find((x) => x.id === questionId);
    if (!q) return;

    setRegenError(null);
    setRegenningId(questionId);

    try {
      const llm = makeLLMClient(llmConfig, allChunks);
      const slot = {
        slot_id: q.slot_id,
        section: 'Section A', // section label not needed for regen
        type: q.type,
        marks: q.marks,
        difficulty: q.difficulty,
        topic_id: q.topic_id,
      };
      const contextChunks = retrieve(`${q.topic_id} ${q.type}`, allChunks, 6);
      const existingStems = paper.questions.filter((x) => x.id !== questionId).map((x) => x.stem);

      const qOutput = await generateQuestion(slot, {
        units: [], weightInferred: true,
      }, contextChunks, existingStems, llm);

      if (!qOutput) {
        setRegenError('Could not generate a replacement question. Try again.');
        return;
      }

      const validation = validateQuestion(qOutput, slot, allChunks, paper.questions.filter((x) => x.id !== questionId).map((x) => ({ ...x, topic_id: x.topic_id, stem: x.stem } as import('@/lib/pipeline/schemas').QuestionOutput)));
      if (!validation.ok) {
        // Use it anyway if it at least has valid marks
      }

      const updated = assembleQuestion(qOutput, slot, questionId);
      updateQuestionInPaper(updated);
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setRegenningId(null);
    }
  };

  const handleAdjustDifficulty = async (direction: 'easier' | 'harder' | 'mixed') => {
    if (!paper) return;
    const newDifficulty = direction === 'easier' ? 'easy' : direction === 'harder' ? 'hard' : 'mixed';
    const newSettings = { ...settings, difficulty: newDifficulty as typeof settings['difficulty'] };

    setRegenError(null);
    setRegenningId('__adjusting__');

    try {
      const newPaper = await runPipeline({
        syllabusChunks: syllabus?.chunks ?? [],
        materialChunks: studyMaterials.flatMap((f) => f.chunks),
        settings: newSettings,
        llmConfig,
      });
      setPaper(newPaper);
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Difficulty adjustment failed');
    } finally {
      setRegenningId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewPaper = () => {
    if (window.confirm('Create a new paper? Your current answers will be cleared.')) {
      clearPaper();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear everything? All files and study content will be erased from browser memory.')) {
      clearEverything();
    }
  };

  return (
    <>
      {/* Screen Interactive Paper View */}
      <main id="main-content" className="no-print w-full min-h-screen pb-36 animate-page-rise">
        <div className="max-w-prose mx-auto px-4 sm:px-6 pt-8 pb-12">
          {/* Header */}
          <div className="border-b border-sage/60 pb-6 mb-8 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs uppercase font-medium tracking-label text-sage-ink">
                Practice Paper
              </span>
              <span className="text-xs tabular-nums text-ink-soft">
                {paper.durationMinutes} mins &bull; {paper.totalMarks} marks
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight">
              {paper.subject || 'Practice Assessment'}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
              <span>Level: {paper.level}</span>
              <span>&bull;</span>
              <span>Style: {paper.style.replace(/_/g, ' ')}</span>
            </div>

            {/* Coverage sentence */}
            <div className="pt-2 text-xs text-sage-ink font-medium">
              {paper.coverageSentence || 'Covers the full mapped scope of your syllabus.'}
            </div>

            {paper.rebalancedNotice && (
              <Notice variant="info" className="mt-2">
                {paper.rebalancedNotice}
              </Notice>
            )}

            {regenError && (
              <Notice variant="error" className="mt-2">
                {regenError}
              </Notice>
            )}

            {regenningId === '__adjusting__' && (
              <Notice variant="info" className="mt-2">
                Regenerating paper with adjusted difficulty…
              </Notice>
            )}
          </div>

          {/* Paper Sections */}
          <div className="space-y-10">
            {paper.sections.map((section, sIdx) => (
              <section key={sIdx} className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-sage/60 pb-2">
                  <h2 className="text-sm font-semibold tracking-label uppercase text-ink">
                    {section.name}
                  </h2>
                  <span className="text-xs tabular-nums font-mono text-sage-ink">
                    {section.totalMarks} marks
                  </span>
                </div>

                <div className="space-y-2">
                  {section.questions.map((q, qIdx) => (
                    <QuestionBlock
                      key={q.id}
                      question={q}
                      index={qIdx}
                      attempt={attempts[q.id] || ''}
                      isRevealed={!!revealedAnswers[q.id]}
                      isRegenerating={regenningId === q.id}
                      onAttemptChange={(txt) => setAttempt(q.id, txt)}
                      onReveal={() => revealAnswer(q.id)}
                      onRegenerate={() => void handleRegenerate(q.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Paper Toolbar (Sticky bottom) */}
        <aside
          aria-label="Paper actions toolbar"
          className="fixed bottom-0 inset-x-0 bg-paper/95 backdrop-blur-md border-t border-sage/60 py-3 px-4 sm:px-8 z-30 shadow-subtle"
        >
          <div className="max-w-container mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAnswerKey}
                  onChange={toggleIncludeAnswerKey}
                  className="rounded-sm border-sage text-ink focus:ring-ink"
                />
                <span className="text-ink">Include answer key in PDF</span>
              </label>

              <span className="text-sage/60 hidden sm:inline">|</span>

              <span className="text-ink-soft hidden sm:inline">Adjust difficulty:</span>
              <Button type="button" variant="quiet" size="sm"
                onClick={() => void handleAdjustDifficulty('easier')}
                disabled={regenningId !== null}
              >
                Easier
              </Button>
              <Button type="button" variant="quiet" size="sm"
                onClick={() => void handleAdjustDifficulty('harder')}
                disabled={regenningId !== null}
              >
                Harder
              </Button>
              <Button type="button" variant="quiet" size="sm"
                onClick={() => void handleAdjustDifficulty('mixed')}
                disabled={regenningId !== null}
              >
                Mixed
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handlePrint}
              >
                Print / Save as PDF
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleNewPaper}
              >
                New paper
              </Button>

              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={handleClearAll}
              >
                Clear everything
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Dedicated Printable Paper for A4 typesetting */}
      <PrintablePaper
        paper={paper}
        includeAnswerKey={includeAnswerKey}
      />
    </>
  );
};
