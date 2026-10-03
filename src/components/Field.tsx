import React from 'react';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  id: string;
  suggestions?: string[];
  onSelectSuggestion?: (val: string) => void;
}

export const Field: React.FC<FieldProps> = ({
  label,
  error,
  hint,
  id,
  suggestions,
  onSelectSuggestion,
  className = '',
  value,
  ...props
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={id}
          className="text-xs uppercase font-medium tracking-label text-sage-ink select-none"
        >
          {label}
        </label>
        {hint && !error && (
          <span className="text-xs text-ink-soft">{hint}</span>
        )}
      </div>

      <div className="relative">
        <input
          id={id}
          value={value}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`w-full bg-paper px-3 py-2.5 text-ink text-base rounded-sm border-b-2 border-sage/60 focus:border-ink focus:outline-none transition-colors duration-150 placeholder:text-ink-soft/50 ${
            error ? 'border-coral text-coral-deep' : ''
          } ${className}`}
          {...props}
        />
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-xs text-ink-soft py-0.5 mr-1 select-none">Suggestions:</span>
          {suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onSelectSuggestion?.(sug)}
              className="text-xs px-2 py-0.5 bg-paper hover:bg-sage/20 border border-sage/40 rounded-sm text-ink-soft hover:text-ink transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-coral font-medium flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
