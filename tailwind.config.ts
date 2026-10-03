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
        DEFAULT: '2px',
        sm: '1px',
        md: '2px',
        lg: '4px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(20, 32, 26, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
