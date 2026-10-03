import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: 'var(--ivory)',
        paper: 'var(--paper)',
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        sage: {
          DEFAULT: 'var(--sage)',
          ink: 'var(--sage-ink)',
        },
        coral: {
          DEFAULT: 'var(--coral)',
          deep: 'var(--coral-deep)',
        },
        violet: {
          DEFAULT: 'var(--violet)',
          deep: 'var(--violet-deep)',
        },
        sun: 'var(--sun)',
        sky: 'var(--sky)',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['monospace'],
        newsreader: ['Newsreader', 'Georgia', 'serif'],
      },
      letterSpacing: {
        label: '0.08em',
      },
      maxWidth: {
        prose: '68ch',
        container: '1180px',
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '14px',
        lg: '20px',
      },
      boxShadow: {
        subtle: '0 8px 24px rgba(31, 46, 84, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
