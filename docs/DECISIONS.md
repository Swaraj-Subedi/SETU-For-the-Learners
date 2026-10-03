# Architectural Decisions

This document records decisions made during the autonomous build of Setu, with rationale.

| Decision | Rationale |
|---|---|
| Use Vite with React 18 + TypeScript + Tailwind CSS | Fast HMR, standard modern frontend build pipeline, strict typing and zero-backend compatibility |
| Self-host fonts (@fontsource) | Ensures strict zero-network privacy requirement; no Google Fonts or CDN requests |
| Memory-only Zustand store | Guarantees all student materials, extracted chunks, and answers vanish on page reload or "Clear everything" |
| Pure client-side PDF, DOCX, and OCR processing | Fulfills no-backend, browser-only requirement (pdfjs-dist, mammoth, tesseract.js) |
| Standardized SetuLogo component using supplied brand asset | Respects strict brand guideline to never redraw, recolor or stretch the supplied logo |
| Pre-packaged tesseract assets in public/tesseract | Guarantees OCR worker, core WASM, and language traineddata run 100% locally with zero external network requests |
| Retry transient model failures and malformed JSON up to three times | Hosted models can briefly be saturated and local models can emit incomplete structured output; permanent configuration failures still stop immediately |
| Use adaptive request budgets and serial syllabus batches | Configuration values are ceilings; simple requests use compact context/output budgets while only complex cases need larger completions, reducing load on selected model endpoints |
