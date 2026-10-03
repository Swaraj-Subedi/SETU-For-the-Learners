import React from 'react';
import { Link } from 'react-router-dom';
import { SetuLogo } from '@/components/SetuLogo';
import { Button } from '@/components/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col justify-between selection:bg-sage/40">
      <header className="border-b border-sage/60 py-4 px-4 sm:px-8">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <Link to="/">
            <SetuLogo size="md" />
          </Link>
        </div>
      </header>

      <main id="main-content" className="max-w-prose mx-auto px-4 py-16 text-center animate-page-rise">
        <span className="text-xs uppercase font-medium tracking-label text-sage-ink block mb-2">
          404 &bull; Not Found
        </span>
        <h1 className="text-3xl font-serif text-ink tracking-tight mb-4">
          Page not found
        </h1>
        <p className="text-sm text-ink-soft mb-8">
          The page you are looking for does not exist. Setu is a single-page tool designed to keep all work in memory.
        </p>
        <Link to="/">
          <Button variant="primary" size="md">
            Go to Setu Home
          </Button>
        </Link>
      </main>

      <footer className="border-t border-sage/60 py-6 px-4 text-center text-xs text-ink-soft">
        Setu &bull; Open, private, in-browser exam preparation
      </footer>
    </div>
  );
};
