import React, { useEffect } from 'react';
import { SetuLogo } from './SetuLogo';
import { Button } from './Button';
import { useSessionStore } from '@/store/session';

export const STAGE_LABELS: Record<string, string> = {
  reading: 'Reading your syllabus',
  mapping: 'Mapping the topics',
  drafting: 'Drafting questions',
  checking: 'Checking coverage and marks',
  setting: 'Setting the paper',
};

export const Processing: React.FC = () => {
  const { pipelineStage, stageMessage, cancelPipeline } = useSessionStore();

  const currentLabel =
    stageMessage || STAGE_LABELS[pipelineStage] || 'Preparing your practice paper';

  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${currentLabel} — Setu`;
    return () => {
      document.title = originalTitle;
    };
  }, [currentLabel]);

  return (
    <main
      id="main-content"
      className="fixed inset-0 z-50 bg-ivory flex flex-col items-center justify-between p-8 sm:p-16 select-none animate-page-rise"
    >
      <div className="w-full flex justify-end">
        {/* Top spacer */}
      </div>

      <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-8">
        <div className="animate-logo-breathe">
          <SetuLogo size="hero" alt="Setu processing" />
        </div>

        <div className="space-y-2">
          {/* aria-live region announces progress to screen readers */}
          <div
            aria-live="polite"
            role="status"
            className="text-lg sm:text-xl font-serif text-ink tracking-tight transition-all duration-300"
          >
            {currentLabel}
          </div>
          <p className="text-xs text-ink-soft">
            Processing entirely inside your browser. No files are uploaded.
          </p>
        </div>
      </div>

      <div className="pb-4">
        <Button
          type="button"
          variant="quiet"
          size="sm"
          onClick={cancelPipeline}
          className="text-ink-soft hover:text-ink text-xs"
        >
          Cancel and return to form
        </Button>
      </div>
    </main>
  );
};
