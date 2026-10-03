import React from 'react';
import type { GeneratedPaper } from '@/types';
import { SetuLogo } from './SetuLogo';

export interface PrintablePaperProps {
  paper: GeneratedPaper;
  includeAnswerKey?: boolean;
}

export const PrintablePaper: React.FC<PrintablePaperProps> = ({
  paper,
  includeAnswerKey = false,
}) => {
  let runningIndex = 0;

  return (
    <div className="printable-paper-root font-newsreader text-[#14201a]">
      {/* Front Page Exam Header */}
      <header className="border-b-2 border-[#14201a] pb-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <SetuLogo size="md" alt="Setu Examination Paper" />
          <div className="text-right text-xs uppercase tracking-wider font-sans font-medium text-gray-700">
            Official Practice Assessment
          </div>
        </div>

        <div className="text-2xl font-serif font-bold text-center uppercase tracking-wider mb-2">
          {paper.subject || 'Examination Paper'}
        </div>
        <div className="text-center text-sm font-serif italic mb-6">
          Level: {paper.level || 'Standard'} &bull; Duration: {paper.durationMinutes} minutes &bull; Maximum Marks: {paper.totalMarks}
        </div>

        {/* Candidate Info Box */}
        <div className="grid grid-cols-2 gap-4 border border-[#14201a] p-3 text-xs font-sans mb-6">
          <div className="flex items-end">
            <span className="font-bold mr-2 uppercase">Candidate Name:</span>
            <span className="border-b border-[#14201a] flex-1 inline-block h-4"></span>
          </div>
          <div className="flex items-end">
            <span className="font-bold mr-2 uppercase">Date:</span>
            <span className="border-b border-[#14201a] flex-1 inline-block h-4"></span>
          </div>
        </div>

        {/* Instructions to Candidates */}
        <div className="text-xs leading-relaxed space-y-1 bg-gray-50/50 p-3 border-l-2 border-[#14201a]">
          <div className="font-bold uppercase tracking-wider font-sans text-[11px] mb-1">
            Instructions to Candidates:
          </div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Answer all questions in the spaces provided on this question paper.</li>
            <li>For multiple choice questions, indicate your choice clearly.</li>
            <li>Calculators and reference sheets are permitted where applicable.</li>
            <li>Marks for each question are indicated in brackets at the end of each question.</li>
          </ol>
        </div>
      </header>

      {/* Sections and Questions */}
      {paper.sections.map((section, sIdx) => (
        <section key={sIdx} className="mb-8">
          <h2 className="section-heading text-base font-serif font-bold uppercase tracking-wider flex justify-between items-baseline mb-4">
            <span>{section.name}</span>
            <span className="font-sans text-xs font-normal">
              [{section.totalMarks} marks]
            </span>
          </h2>

          <div className="space-y-6">
            {section.questions.map((q) => {
              const qNum = ++runningIndex;
              return (
                <div key={q.id} className="question-item">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-serif font-bold text-sm">
                      Question {qNum}
                    </span>
                    <span className="font-sans text-xs font-bold tabular-nums">
                      [{q.marks}]
                    </span>
                  </div>

                  {q.passage && (
                    <div className="italic text-xs bg-gray-50 border-l border-gray-400 p-2 my-2">
                      {q.passage}
                    </div>
                  )}

                  <p className="text-sm leading-relaxed mb-2">{q.stem}</p>

                  {q.parts && q.parts.length > 0 && (
                    <div className="pl-4 space-y-2 mb-2">
                      {q.parts.map((p) => (
                        <div key={p.label} className="text-xs">
                          <span className="font-bold mr-1">({p.label})</span>
                          <span>{p.text}</span>
                          <span className="font-sans font-bold ml-2">[{p.marks}]</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'mcq' && q.options && (
                    <div className="grid grid-cols-2 gap-2 my-2 pl-4 text-xs font-sans">
                      {q.options.map((opt) => (
                        <div key={opt.key} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-gray-500 inline-flex items-center justify-center text-[10px]">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ruled lines for answering written questions */}
                  {q.type !== 'mcq' && (
                    <div
                      className="answer-lines w-full my-3 border border-gray-300"
                      style={{ height: `${Math.min(q.marks * 28, 140)}px` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Answer Key on a New Page if enabled */}
      {includeAnswerKey && (
        <div className="page-break-before pt-8 border-t-2 border-[#14201a]">
          <h2 className="text-lg font-serif font-bold uppercase tracking-wider text-center mb-6">
            Marking Scheme &amp; Model Answers
          </h2>
          <div className="space-y-6">
            {paper.questions.map((q, idx) => (
              <div key={q.id} className="question-item text-xs border-b border-gray-200 pb-4">
                <div className="flex justify-between font-bold mb-1">
                  <span>Question {idx + 1} ({q.type})</span>
                  <span>[{q.marks} marks]</span>
                </div>
                {q.type === 'mcq' && (
                  <div className="font-semibold text-gray-800">
                    Correct Option: ({q.correct_option})
                  </div>
                )}
                <div className="mt-1 font-serif">
                  <span className="font-sans font-bold">Answer: </span>
                  {q.model_answer}
                </div>
                {q.explanation && (
                  <div className="mt-1 text-gray-600 italic">
                    <span className="font-sans font-bold">Note: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
