import React from 'react';
import { Link } from 'react-router-dom';
import { SetuLogo } from '@/components/SetuLogo';
import { Button } from '@/components/Button';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col justify-between selection:bg-sage/40">
      {/* Top Bar */}
      <header className="border-b border-sage/60 py-4 px-4 sm:px-8">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <Link to="/" className="inline-flex items-center">
            <SetuLogo size="md" />
          </Link>
          <Link to="/">
            <Button variant="quiet" size="sm">
              &larr; Back to tool
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main id="main-content" className="max-w-prose mx-auto px-4 sm:px-6 py-12 flex-1 animate-page-rise">
        <span className="text-xs uppercase font-medium tracking-label text-sage-ink block mb-2">
          Transparency &bull; No Backend
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight mb-8">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-sm text-ink-soft leading-relaxed font-sans">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-ink font-serif">
              1. In-browser operation only
            </h2>
            <p>
              Setu has no server, no cloud database, no accounts, and no backend. Every document you drop in (PDF, DOCX, TXT, or scanned images) is parsed, processed, and OCR&apos;d completely inside your local web browser tab.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-ink font-serif">
              2. Memory-only lifecycle
            </h2>
            <p>
              Your files and extracted study content live solely in volatile JavaScript memory. They are never written to <code className="font-mono text-xs bg-paper px-1 py-0.5 rounded">localStorage</code>, <code className="font-mono text-xs bg-paper px-1 py-0.5 rounded">sessionStorage</code>, <code className="font-mono text-xs bg-paper px-1 py-0.5 rounded">IndexedDB</code>, or cookies. When you close the browser tab, refresh the page, or click <em>Clear everything</em>, all study text is instantly erased.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-ink font-serif">
              3. Model connectivity and data transit
            </h2>
            <p>
              Setu connects only to the AI model endpoint you explicitly configure:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Ollama (Default):</strong> Runs on your local machine (<code className="font-mono text-xs">localhost:11434</code>). Nothing ever leaves your computer or passes over the internet.
              </li>
              <li>
                <strong>LM Studio / OpenAI-compatible:</strong> Runs on your local network or chosen server.
              </li>
              <li>
                <strong>Google Gemini:</strong> If you provide your own Gemini API key, prompt excerpts are transmitted directly from your browser to Google&apos;s API under your credentials. Your key is kept in memory only and is never stored anywhere.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-ink font-serif">
              4. Zero analytics and zero tracking
            </h2>
            <p>
              There are no analytics scripts, tracking cookies, telemetry beacons, or third-party advertising SDKs. Fonts, OCR neural models, and workers are completely self-hosted.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-sage/60">
          <Link to="/">
            <Button variant="secondary" size="md">
              Return to Setu
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sage/60 py-6 px-4 sm:px-8 text-center text-xs text-ink-soft">
        Setu &bull; Open, private, in-browser exam preparation
      </footer>
    </div>
  );
};
