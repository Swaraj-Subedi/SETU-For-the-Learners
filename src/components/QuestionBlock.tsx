import React, { useState } from 'react';
import type { Question } from '@/types';
import { Button } from './Button';

export interface QuestionBlockProps {
  question: Question;
  index: number;
  attempt?: string;
  isRevealed?: boolean;
  isRegenerating?: boolean;
  onAttemptChange: (text: string) => void;
  onReveal: () => void;
  onRegenerate?: () => void;
}

export const QuestionBlock: React.FC<QuestionBlockProps> = ({
  question,
  index,
  attempt = '',
  isRevealed = false,
  isRegenerating = false,
  onAttemptChange,
  onReveal,
  onRegenerate,
}) => {
  const [confirmRegen, setConfirmRegen] = useState(false);

  const handleRegenerateClick = () => {
    if (attempt && !confirmRegen) {
      setConfirmRegen(true);
      return;
    }
    setConfirmRegen(false);
    onRegenerate?.();
  };

  const hasAttempt = attempt.trim().length > 0;

  return (
    <article className="question-item relative grid grid-cols-1 md:grid-cols-[64px_1fr] gap-2 md:gap-6 py-6 border-b border-sage/40">
      {/* Margin note on desktop: Question index and marks */}
      <div className="flex md:flex-col items-baseline md:items-start justify-between md:justify-start gap-1 select-none">
        <span className="font-serif font-bold text-base md:text-lg text-ink">
          Q{index + 1}
        </span>
        <span className="text-xs tabular-nums font-mono text-sage-ink">
          [{question.marks} {question.marks === 1 ? 'mark' : 'marks'}]
        </span>
        <span className="text-[10px] uppercase tracking-label text-ink-soft hidden md:block mt-1">
          {question.type.replace('_', ' ')}
        </span>
      </div>

      {/* Main Question Column */}
      <div className="space-y-4">
        {/* Case-based Passage if present */}
        {question.passage && (
          <div className="bg-paper p-4 rounded-sm border-l-2 border-sage-ink text-sm leading-relaxed text-ink/90 font-serif italic">
            {question.passage}
          </div>
        )}

        {/* Question Stem */}
        <p className="text-base text-ink leading-relaxed font-sans">
          {question.stem}
        </p>

        {/* Multi-part questions */}
        {question.parts && question.parts.length > 0 && (
          <div className="space-y-2.5 pl-4 border-l border-sage/40">
            {question.parts.map((part) => (
              <div key={part.label} className="text-sm">
                <span className="font-semibold mr-2 text-ink">
                  ({part.label})
                </span>
                <span className="text-ink leading-relaxed">{part.text}</span>
                <span className="ml-2 text-xs tabular-nums text-sage-ink font-mono">
                  [{part.marks}]
                </span>
              </div>
            ))}
          </div>
        )}

        {/* MCQ Options */}
        {question.type === 'mcq' && question.options && (
          <div className="space-y-2 pt-2">
            {question.options.map((opt) => {
              const isSelected = attempt === opt.key;
              return (
                <label
                  key={opt.key}
                  className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors text-sm ${
                    isSelected
                      ? 'bg-paper border-ink shadow-subtle'
                      : 'bg-paper/40 border-sage/40 hover:border-sage/80'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={opt.key}
                    checked={isSelected}
                    onChange={(e) => onAttemptChange(e.target.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-ink mr-2">
                      ({opt.key})
                    </span>
                    <span className="text-ink">{opt.text}</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Open Text Attempt Area for Non-MCQ */}
        {question.type !== 'mcq' && (
          <div className="pt-2">
            <label
              htmlFor={`attempt-${question.id}`}
              className="block text-xs uppercase tracking-label text-sage-ink font-medium mb-1.5 select-none"
            >
              Your attempt
            </label>
            <textarea
              id={`attempt-${question.id}`}
              rows={3}
              value={attempt}
              onChange={(e) => onAttemptChange(e.target.value)}
              placeholder="Type your notes or answer here before revealing the model rubric…"
              className="w-full bg-paper px-3 py-2 text-sm text-ink rounded-sm border-b-2 border-sage/60 focus:border-ink focus:outline-none transition-colors resize-y placeholder:text-ink-soft/40"
            />
          </div>
        )}

        {/* Interaction Bar: Reveal & Regenerate */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div>
            {!isRevealed ? (
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={onReveal}
                disabled={!hasAttempt}
                title={
                  !hasAttempt ? 'Write an attempt first to reveal the answer' : ''
                }
              >
                Reveal model answer
              </Button>
            ) : (
              <span className="text-sage-ink font-medium select-none">
                Model answer revealed
              </span>
            )}
            {!hasAttempt && !isRevealed && (
              <span className="text-[11px] text-ink-soft ml-2 select-none">
                (attempt question first)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {confirmRegen ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-coral">Discard attempt?</span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleRegenerateClick}
                >
                  Yes, regenerate
                </Button>
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  onClick={() => setConfirmRegen(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={handleRegenerateClick}
                disabled={isRegenerating}
              >
                {isRegenerating ? 'Regenerating…' : 'Regenerate this question'}
              </Button>
            )}
          </div>
        </div>

        {/* Revealed Rubric & Explanation */}
        {isRevealed && (
          <div className="mt-4 p-4 bg-paper/80 border-l-2 border-ink rounded-sm space-y-3 animate-page-rise text-xs text-ink leading-relaxed">
            <div>
              <span className="font-semibold text-ink uppercase tracking-label text-[11px] block mb-1">
                Model answer:
              </span>
              <p className="font-serif text-sm leading-relaxed whitespace-pre-line text-ink">
                {question.model_answer}
              </p>
            </div>

            {question.key_points && question.key_points.length > 0 && (
              <div>
                <span className="font-semibold text-ink uppercase tracking-label text-[10px] block mb-1">
                  Key points:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-ink-soft">
                  {question.key_points.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {question.marking_scheme && question.marking_scheme.length > 0 && (
              <div>
                <span className="font-semibold text-ink uppercase tracking-label text-[10px] block mb-1">
                  Marking scheme:
                </span>
                <div className="space-y-1">
                  {question.marking_scheme.map((ms, i) => (
                    <div key={i} className="flex justify-between text-ink-soft border-b border-sage/20 pb-0.5">
                      <span>{ms.point}</span>
                      <span className="tabular-nums font-mono text-sage-ink ml-2">
                        +{ms.marks}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.explanation && (
              <div>
                <span className="font-semibold text-ink uppercase tracking-label text-[10px] block mb-0.5">
                  Explanation:
                </span>
                <p className="text-ink-soft">{question.explanation}</p>
              </div>
            )}

            {question.evidence && question.evidence.length > 0 && (
              <div className="pt-1 text-[11px] text-sage-ink font-mono">
                <span className="font-bold">Based on: </span>
                {question.evidence.map((ev, i) => (
                  <span key={i} className="italic text-ink-soft">
                    &quot;{ev.quote.slice(0, 100)}...&quot;
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
