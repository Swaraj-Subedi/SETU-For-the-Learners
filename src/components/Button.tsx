import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2';

    let variantStyles = '';
    let sizeStyles = '';

    if (variant === 'primary') {
      variantStyles =
        'text-white rounded-md shadow-subtle btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none';
      sizeStyles =
        size === 'sm'
          ? 'h-9 px-4 text-sm'
          : size === 'lg'
            ? 'h-14 px-8 text-base tracking-wide'
            : 'h-12 px-6 text-sm tracking-wide';
    } else if (variant === 'secondary') {
      variantStyles =
        'bg-white/90 text-ink border border-violet/20 hover:border-violet hover:bg-violet/5 rounded-md shadow-subtle disabled:opacity-40 disabled:cursor-not-allowed';
      sizeStyles =
        size === 'sm'
          ? 'h-8 px-3 text-xs'
          : size === 'lg'
            ? 'h-12 px-6 text-base'
            : 'h-10 px-4 text-sm';
    } else if (variant === 'quiet') {
      variantStyles =
        'text-ink-soft hover:text-ink underline underline-offset-4 decoration-sage/60 hover:decoration-ink bg-transparent p-0 disabled:opacity-40 disabled:cursor-not-allowed';
      sizeStyles = size === 'sm' ? 'text-xs' : 'text-sm';
    } else if (variant === 'danger') {
      variantStyles =
        'text-coral hover:text-coral-deep underline underline-offset-4 decoration-coral/40 hover:decoration-coral bg-transparent p-0 disabled:opacity-40 disabled:cursor-not-allowed';
      sizeStyles = size === 'sm' ? 'text-xs' : 'text-sm';
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
