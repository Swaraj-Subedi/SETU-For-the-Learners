import React, { useRef, useState } from 'react';
import { Button } from './Button';

export interface FileDropProps {
  id: string;
  accept: string;
  label?: string;
  headline?: string;
  subtext?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export const FileDrop: React.FC<FileDropProps> = ({
  id,
  accept,
  label = 'Upload file',
  headline = 'Drop your file here, or choose a file',
  subtext,
  multiple = false,
  onFilesSelected,
  disabled = false,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      // Reset input value so re-uploading the same file triggers change
      e.target.value = '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border border-dashed rounded-sm p-8 sm:p-12 text-center transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-ink ${
          isDragOver
            ? 'bg-sage/20 border-sage-ink'
            : 'bg-paper/50 hover:bg-paper border-sage/60 hover:border-ink/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <p className="text-base sm:text-lg font-serif text-ink mb-2">
          {headline}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={disabled}
          >
            Choose a file
          </Button>
          {subtext && (
            <span className="text-xs text-ink-soft select-none">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
