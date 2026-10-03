import React from 'react';

export interface SetuLogoProps {
  variant?: 'full' | 'mark' | 'mono';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  alt?: string;
}

export const SetuLogo: React.FC<SetuLogoProps> = ({
  size = 'md',
  className = '',
  alt = 'Setu — For the learners',
}) => {
  // Height classes maintaining 16:9 natural aspect ratio without stretching
  const heightClasses = {
    sm: 'h-7 w-auto',
    md: 'h-9 w-auto',
    lg: 'h-14 w-auto',
    hero: 'h-20 w-auto',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{ padding: '2px' }}
    >
      <img
        src="/brand/setu-logo.png"
        alt={alt}
        className={`${heightClasses} object-contain transition-opacity duration-300`}
        loading="eager"
      />
    </div>
  );
};
