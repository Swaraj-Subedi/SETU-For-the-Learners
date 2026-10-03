import React from 'react';

export interface NoticeProps {
  variant?: 'info' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const Notice: React.FC<NoticeProps> = ({
  variant = 'info',
  title,
  children,
  action,
  className = '',
}) => {
  const borderStyles = {
    info: 'border-sage/80 bg-paper/60 text-ink',
    warning: 'border-sage-ink bg-paper text-ink',
    error: 'border-coral bg-paper text-coral-deep',
  }[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`border-l-2 p-3.5 rounded-sm text-xs leading-relaxed ${borderStyles} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {title && (
            <div className="font-semibold mb-1 tracking-wide uppercase text-[11px] text-ink">
              {title}
            </div>
          )}
          <div className="text-ink-soft">{children}</div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
};
