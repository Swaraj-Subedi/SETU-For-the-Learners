import React from 'react';
import type { QuestionType } from '@/types';

export interface QuestionTypeOption {
  type: QuestionType;
  label: string;
  defaultMarks: string;
  description: string;
}

export const QUESTION_TYPES: QuestionTypeOption[] = [
  {
    type: 'mcq',
    label: 'Multiple choice',
    defaultMarks: '1 mark',
    description: '4 options, single best answer, misconception distractors',
  },
  {
    type: 'short',
    label: 'Short answer',
    defaultMarks: '2–3 marks',
    description: 'Concise define, state, list, or outline questions',
  },
  {
    type: 'long',
    label: 'Long answer',
    defaultMarks: '5–8 marks',
    description: 'Structured, clearly scoped explanatory answers',
  },
  {
    type: 'application',
    label: 'Application',
    defaultMarks: '4–6 marks',
    description: 'Real scenarios grounded in your study material',
  },
  {
    type: 'analytical',
    label: 'Analytical',
    defaultMarks: '5–6 marks',
    description: 'Compare, evaluate, derive, justify concepts',
  },
  {
    type: 'case_based',
    label: 'Case-based',
    defaultMarks: '6–10 marks',
    description: 'Passage followed by multi-part questions',
  },
  {
    type: 'exam_style',
    label: 'Exam-style',
    defaultMarks: 'Varies',
    description: 'Formal exam board conventions tailored to your level',
  },
];

export interface MultiSelectProps {
  label: string;
  selected: QuestionType[];
  onChange: (selected: QuestionType[]) => void;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  selected,
  onChange,
  className = '',
}) => {
  const toggle = (type: QuestionType) => {
    if (selected.includes(type)) {
      if (selected.length > 1) {
        onChange(selected.filter((t) => t !== type));
      }
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase font-medium tracking-label text-sage-ink select-none">
          {label}
        </span>
        <span className="text-xs text-ink-soft select-none">
          {selected.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {QUESTION_TYPES.map((item) => {
          const isChecked = selected.includes(item.type);
          return (
            <label
              key={item.type}
              className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all select-none ${
                isChecked
                  ? 'bg-gradient-to-br from-violet/10 to-sky/10 border-violet/60 shadow-subtle'
                  : 'bg-white/50 border-sage/35 hover:border-sky/70 hover:bg-sky/5'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(item.type)}
                className="mt-1 h-4 w-4 rounded-sm border-sage text-ink focus:ring-ink"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    {item.label}
                  </span>
                  <span className="text-[10px] tabular-nums text-sage-ink font-medium">
                    {item.defaultMarks}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-0.5 leading-snug">
                  {item.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
