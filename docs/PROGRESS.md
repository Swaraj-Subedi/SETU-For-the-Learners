# Build Progress

## Current State
Phases 0–4 are completed and verified.

## Completed
- **Phase 0 — Scaffold**:
  - Vite 5 + React 18 + strict TypeScript + Tailwind CSS configured with exact Setu color tokens.
  - Vitest + Playwright + axe-core configured and running in Windows PowerShell.
  - Self-hosted fonts via `@fontsource` (Fraunces, Inter, Newsreader) — zero external CDN requests.
  - Self-hosted brand asset syncing (`scripts/sync-brand.mjs`) and Tesseract OCR worker/core/data assets (`scripts/copy-assets.mjs`).
  - Strict zero-backend architecture.

- **Phase 1 — Design System & Static Page**:
  - Full design system implemented: ivory `#F6F2E9`, paper `#FBF8F1`, ink `#14201A`, ink-soft `#4A554E`, sage `#A9B8A3`, sage-ink `#445942`, coral `#B84A35`.
  - Accessible focus states, 8px grid, subtle 1px rules, no emojis or loud gradients.
  - Authentic `<SetuLogo />` component respecting clearspace without resizing/recoloring.
  - Four quiet numbered steps on `/` with desktop sticky rail and mobile-first column layout.
  - Underlined accessible form fields, segmented toggles, multi-select question types, status notices.
  - `/privacy` policy page with transparent no-backend and memory-only commitments.
  - 404 page and skip navigation link.
  - 100% clean WCAG 2.2 AA contrast and zero axe-core violations at both 390px and 1440px viewports.

- **Phase 2 — File Intake & Cleaning**:
  - `src/lib/files/validate.ts`: Enforces 20MB file limit, 60MB total limit, 10 files max, magic bytes detection, and friendly rejection of legacy `.doc` files with actionable prompt to re-save as DOCX/PDF.
  - `src/lib/files/pdf.ts`: Client-side PDF extraction with `pdfjs-dist` (up to 300 pages) and automatic OCR fallback for scanned pages.
  - `src/lib/files/docx.ts`: Client-side DOCX extraction with `mammoth`.
  - `src/lib/files/ocr.ts`: Local OCR with `tesseract.js` using self-hosted worker, core WASM, and `eng.traineddata.gz` (zero external network requests).
  - `src/lib/files/clean.ts`: De-hyphenation, header/footer stripping, and whitespace normalization.
  - `src/lib/files/chunk.ts`: 600–800 token chunking with ~100 token overlap and metadata preservation.
  - Full memory-only Zustand store (`src/store/session.ts`) with instantaneous `clearEverything()`.

## Completed model and generation workflow
- Ollama is the default private provider at `http://localhost:11434` with `qwen3:4b`; OpenAI-compatible, Gemini, and deterministic mock providers are also available.
- The pipeline maps the syllabus, builds an exact-marks blueprint, retrieves local source text, generates and validates questions, evaluates quality, and rebalances only when a model cannot fill a slot.
- Generation has cancellation, processing-stage feedback, answer-reveal gating, printable output, and a deterministic mock path for repeatable browser tests.
- Provider resilience was hardened: temporary capacity failures retry automatically, malformed JSON receives fresh completions, and errors no longer expose raw model output. Request budgets are adaptive (rather than applying a 3,072/1,800 ceiling to every request), and regeneration retrieves source material from the current question wording rather than an opaque topic identifier.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run e2e`, and `npm run build` are the supported verification commands.

## Known Issues
- The application’s production dependency audit is clean (`npm audit --omit=dev` reports zero vulnerabilities).
- The full development-tooling audit still reports advisories in the current Vite 5, Vitest 2, and Tailwind 3 toolchain. Their available fixes are coordinated major-version upgrades, so they should be handled as a dedicated build-tool migration rather than through a forced audit fix.
