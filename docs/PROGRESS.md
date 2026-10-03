# Build Progress

## Current State
Phase 0, 1, and 2 completed and fully verified.
Phase 3 (Model Layer) and Phase 4 (Generation Pipeline) in progress.

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

## Next
- **Phase 3 — Model Layer**:
  - `LLMClient` interface with providers: Ollama, OpenAI-compatible (LM Studio/LocalAI), Gemini (memory-only key), and Deterministic Mock.
  - JSON Schema output structuring and robust repair/retry logic.
  - Connection testing and PowerShell setup guidance.
- **Phase 4 — Generation Pipeline**:
  - Syllabus mapping (units, topics, learning outcomes, weights).
  - Deterministic blueprint solver for exact total marks arithmetic.
  - In-browser BM25 vectorless retrieval.
  - Single-slot generation, schema validation, citation/evidence verification, and deduplication.
  - Critic evaluation and deterministic rebalancing.
  - Processing screen stage announcements and abort control.

## Known Issues
- None. All 23 unit tests and 10 Playwright e2e/axe tests pass.
