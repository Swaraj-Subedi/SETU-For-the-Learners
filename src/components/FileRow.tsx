import React from 'react';
import type { IngestedFile } from '@/types';
import { Button } from './Button';

export interface FileRowProps {
  file: IngestedFile;
  onRemove: (id: string) => void;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const FileRow: React.FC<FileRowProps> = ({
  file,
  onRemove,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 px-3 bg-paper border border-sage/40 rounded-sm text-xs gap-2 transition-opacity duration-200 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="font-mono text-[10px] text-sage-ink uppercase tracking-wider shrink-0 bg-ivory px-1.5 py-0.5 rounded-sm">
          {file.name.split('.').pop() || 'FILE'}
        </span>
        <span className="truncate font-medium text-ink max-w-[200px] sm:max-w-md">
          {file.name}
        </span>
        <span className="tabular-nums text-ink-soft shrink-0">
          {formatBytes(file.size)}
        </span>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-sage/20">
        {file.status === 'reading' && (
          <span className="text-sage-ink animate-pulse" aria-live="polite">
            {file.isScanned
              ? 'Reading scanned pages…'
              : 'Reading file…'}
          </span>
        )}

        {file.status === 'ready' && (
          <span className="text-sage-ink font-medium">Ready</span>
        )}

        {file.status === 'error' && (
          <span className="text-coral font-medium text-[11px] truncate max-w-[200px]" role="alert" title={file.error}>
            {file.error || 'Failed to read'}
          </span>
        )}

        <Button
          type="button"
          variant="quiet"
          size="sm"
          className="min-h-[44px] min-w-[44px] px-2"
          onClick={() => onRemove(file.id)}
          aria-label={`Remove ${file.name}`}
        >
          Remove
        </Button>
      </div>
    </div>
  );
};
