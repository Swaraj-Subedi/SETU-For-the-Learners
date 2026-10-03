import React, { useEffect } from 'react';
import { SetuLogo } from './SetuLogo';
import { Button } from './Button';
import { Notice } from './Notice';
import { useSessionStore } from '@/store/session';

// Keep this private to the component. Exporting a non-component from this
// module makes Vite invalidate Fast Refresh during development.
const STAGE_LABELS: Record<string, string> = {
  reading: 'Reading your syllabus',
  mapping: 'Mapping the topics',
  drafting: 'Drafting questions',
  checking: 'Checking coverage and marks',
  setting: 'Setting the paper',
};

export interface ProcessingProps {
  onRetry?: () => void;
}

export const Processing: React.FC<ProcessingProps> = ({ onRetry }) => {
  const { pipelineStage, stageMessage, cancelPipeline } = useSessionStore();

  const isError = pipelineStage === 'error';
  const currentLabel = isError
    ? 'Paper generation stopped'
    : stageMessage || STAGE_LABELS[pipelineStage] || 'Preparing your practice paper';

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

      <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-6">
        <div className={isError ? '' : 'animate-logo-breathe'}>
          <SetuLogo size="hero" alt="Setu processing" />
        </div>

        <div className="space-y-3 w-full">
          {/* aria-live region announces progress to screen readers */}
          <div
            aria-live="polite"
            role="status"
            className="text-lg sm:text-xl font-serif text-ink tracking-tight transition-all duration-300"
          >
            {currentLabel}
          </div>

          {!isError ? (
            <p className="text-xs text-ink-soft">
              Processing entirely inside your browser. Local models may take several minutes; generation will continue until it finishes or you cancel it.
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              <Notice variant="error" className="text-left">
                {stageMessage || 'The model was unable to complete paper generation. Check your model connection or try adding more study material.'}
              </Notice>

              <div className="flex items-center justify-center gap-3 pt-2">
                {onRetry && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={onRetry}
                  >
                    Retry generation
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={cancelPipeline}
                >
                  Return to form
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pb-4">
        {!isError && (
          <Button
            type="button"
            variant="quiet"
            size="sm"
            onClick={cancelPipeline}
            className="text-ink-soft hover:text-ink text-xs"
          >
            Cancel and return to form
          </Button>
        )}
      </div>
    </main>
  );
};
