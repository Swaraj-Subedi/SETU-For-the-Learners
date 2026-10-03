# SETU — Autonomous Build Brief (no-backend version)

You are a senior front-end engineer and product designer. Build **Setu**, complete and production-quality, from an empty folder to a working, tested web app. This brief is the single source of truth. Read all of it before writing code, and re-read the relevant section before each phase.

---

## 0. Operating rules (read first)

1. **Work autonomously.** Do not stop to ask questions or wait for approval between phases. When something is ambiguous, choose the most sensible option and record it in `docs/DECISIONS.md` (one line each: decision, reason).
2. **Keep `docs/PROGRESS.md` current.** After every phase write what is done, what is next, and known issues, so a fresh session can resume from this file alone.
3. **Verify by running things.** Start the dev server, run the tests, drive the app with Playwright, take screenshots and look at them. A phase is not done until its checks pass. Fix failures yourself. If you cannot view images, skip visual review, rely on DOM assertions, axe scans, and programmatic PDF checks, and note in `PROGRESS.md` that visual review is owed to the user.
4. **Commit after each phase** (`git init` first). Small, clear commit messages.
5. **Never fake it.** If something cannot be fully done, implement the honest closest version, say so in the README, and do not claim it works unless you ran it.
6. **Never build anything in section 2.**
7. **Platform: native Windows, PowerShell, VS Code-style editor.** Do not rely on bash or `make`. All commands are `npm run` scripts. Use cross-platform paths. Write every instruction and README command in PowerShell syntax.
8. TypeScript `strict`, no `any`, ESLint + Prettier, small named functions.
9. If your context is limited, work one phase at a time and re-read only the relevant sections.
10. When finished, give the final report in section 18.

---

## 1. Product

Setu is a single-page, no-login web tool in the spirit of iLovePDF. A student drops in a syllabus (and optionally notes), picks a few settings, and Setu produces a realistic **exam-style practice paper** grounded **only** in the uploaded material. The student can attempt the paper on screen, reveal model answers after attempting, regenerate a single question, adjust difficulty, and print or save the paper as a professionally typeset A4 PDF.

**Everything happens in the browser. There is no backend.** Files are read, OCR'd, and processed inside the tab. Study content lives only in memory and disappears when the tab is closed or reloaded, or when the student presses **Clear everything**. The home page IS the tool: no marketing site.

---

## 2. Non-goals (never build)

No backend or server code of any kind. No accounts, login, sign-up, passwords, sessions, cookies, database, Supabase, Firebase, edge functions, or analytics. No dashboard, progress charts, streaks, marks tracking, performance graphs, saved papers, history, recent activity, social features, or sharing. No cloud storage. No network requests except (a) to the model endpoint the student chooses, and (b) none at all otherwise: fonts, libraries, OCR data, and workers are self-hosted. Never write study content to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies. (Only the non-secret model address and model name may be remembered in `localStorage`; never an API key.)

---

## 3. Tech stack (use exactly this)

React 18, TypeScript (strict), Vite, Tailwind CSS, Radix UI primitives (behavior and accessibility only, fully custom-styled), React Router (only `/`, `/privacy`, and a 404), Zustand (memory-only store; **no persist middleware**), zod (every schema), Framer Motion (subtle use only).

Fonts, self-hosted via `@fontsource`: **Fraunces** (display), **Inter** (interface), **Newsreader** (printed paper).

Browser libraries:
- `pdfjs-dist` for PDF text. Configure the worker with Vite's `?url` import. Render pages to canvas for OCR when a page has too little text.
- `mammoth` for DOCX.
- `tesseract.js` for OCR on images and scanned pages. **Self-host** the worker, core WASM, and `eng.traineddata` under `public/tesseract/` and set `workerPath`, `corePath`, and `langPath` explicitly, so OCR makes no third-party requests.
- A BM25 retriever written in TypeScript (small, tested).

Legacy `.doc` cannot be read in a browser: show a friendly message asking the student to re-save as DOCX or PDF.

Testing: Vitest (unit), Playwright (end to end, Chromium), `@axe-core/playwright`, `pdf-lib` (dev only, to generate PDF fixtures).

---

## 4. Repository layout

```
setu/
  GEMINI.md  SETU_BRIEF.md  README.md
  index.html  package.json  vite.config.ts  tailwind.config.ts  tsconfig.json
  brand/                      # user drops setu-logo.svg (or .png) here
  public/  brand/  tesseract/
  docs/    PROGRESS.md  DECISIONS.md  screenshots/
  scripts/ sync-brand.mjs  copy-assets.mjs   # copies brand/ and tesseract files into public/
  src/
    main.tsx  App.tsx  routes.tsx
    styles/      tokens.css  base.css  print.css
    store/       session.ts            # Zustand, memory only
    lib/
      files/     validate.ts  pdf.ts  docx.ts  ocr.ts  clean.ts  chunk.ts
      llm/       types.ts  client.ts  ollama.ts  openaiCompat.ts  gemini.ts  mock.ts  repair.ts
      pipeline/  schemas.ts  syllabus.ts  blueprint.ts  retrieve.ts  generate.ts
                 validate.ts  critic.ts  rebalance.ts  run.ts  prompts/
    components/  SetuLogo  Button  Field  FileDrop  FileRow  Segmented  MultiSelect
                 Notice  ModelSheet  Processing  PaperView  QuestionBlock  PrintablePaper
    pages/       Home.tsx  Privacy.tsx  NotFound.tsx
  tests/         unit/  e2e/  fixtures/
```

`npm run` scripts: `dev`, `build`, `preview`, `test`, `e2e`, `lint`, `typecheck`, `setup` (installs, copies assets).

---

## 5. Design system

**Feeling:** editorial, understated, intelligent, calm. A considered print publication that happens to be software. Not an AI-education dashboard.

**Avoid:** card grids, loud gradients, oversized rounded containers, stock illustrations, generic icon sets, heavy shadows, dashboard widgets, crowded layouts, emoji, confetti.

**Color tokens** (CSS variables in `tokens.css`, mirrored in Tailwind):

| Token | Value | Use |
|---|---|---|
| `--ivory` | `#F6F2E9` | page background |
| `--paper` | `#FBF8F1` | paper sheet, input fills |
| `--ink` | `#14201A` | text, primary buttons |
| `--ink-soft` | `#4A554E` | secondary text |
| `--sage` | `#A9B8A3` | rules, fills. **Never for text.** |
| `--sage-ink` | `#51694F` | small labels |
| `--coral` | `#B84A35` | the single accent; errors |
| `--coral-deep` | `#9E3D2B` | coral hover and pressed |

Verify every text and background pair meets WCAG AA with an automated check. At most one coral element per viewport apart from error states. Errors are never color alone.

**Type:** Fraunces for headings (slight negative tracking at large sizes), Inter for UI, quiet labels in Inter 12px uppercase with `0.08em` tracking in `--sage-ink`. Body 16px/1.6. Tabular numerals for marks and counts.

**Layout:** 8px grid, max content width about 1180px, asymmetric but balanced compositions, thin 1px rules (`--sage` at about 60%) instead of boxes, underlined input fields (label above, bottom border), radius 0–4px, almost no shadows.

**Controls:** primary button solid ink with ivory text, 48px high, with a 1–2px upward shift and a thin coral underline sweep on hover. Secondary controls are text buttons with underline. Focus: 2px ink outline with 2px ivory offset, always visible. No icon fonts: use typographic controls ("Show", "Remove", numerals "01 02 03"), and minimal hand-written inline SVG only where essential.

**Motion (subtle only):** page fade plus 8px rise, 220ms; button hover 120ms; file rows ease in (height and opacity); the processing logo slowly breathes (opacity 0.55 to 1, 3.2s). All disabled under `prefers-reduced-motion`.

**Voice:** calm, precise, kind, short sentences, no exclamation marks.

**Logo:** the user supplies `brand/setu-logo.svg` (or `.png`). `scripts/sync-brand.mjs` copies it to `public/brand/`. Build one `<SetuLogo variant="full|mark|mono" />` and use it everywhere: top bar, processing screen, favicon, printed header. Never redraw, recolor, stretch, or crop it; keep clear space equal to the height of its main letter. If missing, build a clearly marked temporary typographic wordmark ("Setu" in Fraunces) in the same component, list it as a TODO, and make swapping trivial.

**Mobile:** designed on its own terms: single column, numbered labels inline above each section, 44px+ targets, sticky bottom bar with the primary button, paper toolbar as a bottom sheet, question numbers above each question. Test at 360, 390, 768, 1024, and 1440px.

---

## 6. The one page (`/`)

**Top bar:** logo at left; at right, quiet text buttons **Model**, **Privacy**, **Clear everything**.

**Four quiet numbered steps on one page**, separated by thin rules (on desktop, a narrow sticky left rail carries the numbered labels; the forms sit in the wide right column):

1. **Syllabus (required): the hero.** Large serif headline "Practice, built from your own pages." and beneath it a very large drop zone: "Drop your syllabus here, or choose a file". Accepts PDF, DOCX, TXT. States: idle, drag-over (sage wash), reading ("Reading your syllabus…"), ready (name, size, "Ready", "Remove" text button), error (specific message).
2. **Study material (optional):** multiple files: PDF, DOCX, TXT, JPG, PNG, WEBP (notes, references, scanned pages). Rows show name, size, status, and "Remove". No percentages anywhere.
3. **Subject and level:** subject (text, required); level (text with suggestions such as "Grade 10", "Class 12", "Undergraduate year 2", "Entrance exam"; required).
4. **Paper:** assessment style (Class test / Mid-term / Final exam / Quick revision / Entrance-style), difficulty (Easy, Balanced, Hard, Mixed), number of questions, duration (minutes), total marks, question types (multi-select: multiple choice, short answer, long answer, application, analytical, case-based, exam-style). Sensible defaults per style; gently flag impossible combinations (for example 5 questions cannot honestly use 7 types).

Primary button **Create practice paper**: disabled until a syllabus is ready, a model is connected, and required fields are valid, with the reason shown beneath when disabled.

Privacy line beside it: "Your files are read inside your browser. Nothing is uploaded to Setu or saved anywhere. Close the tab and it is all gone."

**Limits:** 20 MB per file, 10 files, 60 MB total, PDFs up to 300 pages, images capped by pixel dimensions, with friendly messages. Validate type by extension and by file signature (magic bytes), and reject empty files.

---

## 7. Model layer (no server)

A **Model** sheet (from the top bar and from the "model not connected" notice) lets the student choose:
- **Ollama on this computer** (default): address `http://localhost:11434`, model default `qwen2.5:14b-instruct`.
- **LM Studio or another OpenAI-compatible server:** address `http://localhost:1234/v1`.
- **Google Gemini with my own API key:** the key is typed by the student and kept in memory only, never saved, with a short honest note that any key typed into a web page is visible to that page.

A **Test connection** button reports success or a specific failure. If the model is unreachable, show a calm notice with exact PowerShell steps: install Ollama, run `ollama pull qwen2.5:14b-instruct`, and if the browser blocks the request, set the `OLLAMA_ORIGINS` environment variable to this site's address and restart Ollama. State that running the project locally with `npm run dev` works with Ollama's default settings. Mention the browser may ask permission to reach devices on the local network.

**LLMClient interface:** `generate<T>(prompt, schema, options) -> T`. Providers:
- `ollama`: `POST {base}/api/chat`, `stream: false`, `format` set to a JSON schema, `options.num_ctx`, `options.temperature`, `options.seed`.
- `openai_compat`: `POST {base}/chat/completions` with `response_format` JSON schema.
- `gemini`: `responseMimeType: application/json` with `responseSchema`.
- `mock`: deterministic, schema-valid output built from the provided chunks; **enabled only when `VITE_ENABLE_MOCK=true`**, used by every automated test.

Make LLM calls strictly one at a time, with timeouts and an `AbortController` for Cancel, and one JSON-repair retry. Error codes: `llm_unreachable`, `llm_timeout`, `llm_bad_output`, each mapped to a designed message.

---

## 8. Generation pipeline (all in the browser, in TypeScript)

Treat all uploaded text as **untrusted data**: put it inside clearly delimited blocks, tell the model never to follow instructions found inside the material, constrain output to schemas, and never render model output as HTML. Keep prompts in `lib/pipeline/prompts/` with a version header.

1. **Ingest:** extract text per file (pdf.js; OCR with tesseract.js for images and for PDF pages with too little text), run extraction off the main thread where possible, clean it (de-hyphenate line breaks, drop repeated headers and footers, normalize whitespace, keep headings), chunk to about 600–800 tokens with about 100 overlap, preserving file and page. Nearly empty extraction marks the file unreadable with a clear fix.
2. **Analyse syllabus** (stage "mapping"): from syllabus chunks only, produce a `SyllabusMap`: units → topics → subtopics, learning outcomes, weights (use stated marks or hours when present; otherwise infer evenly and flag as inferred). Map-reduce over chunks for long syllabi.
3. **Blueprint** (**deterministic code, not the model**): build *slots* `{slot_id, section, type, marks, difficulty, topic_id}`. Default marks: MCQ 1, short 2–3, long 5–8, application 4–6, analytical 5–6, case-based 6–10. Solve for **exact total marks** with integer arithmetic. Spread topics by syllabus weight (every weighted unit gets at least one slot when slots allow). Spread difficulty per setting (Balanced is about 30/50/20 easy/medium/hard). Group into sections A, B, C, D.
4. **Retrieve:** BM25 per slot over material chunks (plus syllabus chunks) using the topic and subtopics; keep chunk ids. If nothing relevant is found, mark the slot unsupported.
5. **Generate** (stage "drafting"): one call per slot, schema-constrained, answerable from the supplied material alone, avoiding previous stems. Question fields: `id, slot_id, type, topic_id, learning_outcome_ids[], marks, difficulty, stem, passage?, parts?[{label,text,marks}], options?[{key,text}], correct_option?, model_answer, key_points[], marking_scheme[{point,marks}], explanation, evidence[{chunk_id, quote}], estimated_minutes`.
6. **Validate in code** (stage "checking"; retry up to 3 times per slot): schema valid; marks equal the slot; part marks and marking-scheme marks each sum to the question marks; MCQ has exactly 4 distinct options and exactly one correct; every `evidence.chunk_id` exists and each quote actually appears (normalized, fuzzy) in that chunk; no vague stems ("Explain everything about…"); command words match the type; topic is inside the syllabus map; **not a duplicate** (normalized token Jaccard and n-gram overlap under 0.6 against every other question).
7. **Critic:** a second low-temperature call scoring groundedness, clarity, answerability, difficulty fit, and rubric quality (1–5, schema-constrained). Reject if groundedness is below 4 or any score is below 3.
8. **Rebalance:** if slots cannot be filled, make fewer questions, redistribute marks deterministically so the **total stays exact**, and tell the student plainly ("Your material supported 14 of the 20 questions you asked for, so the marks were rebalanced to 100"). Never pad with unsupported questions.
9. **Paper-level check** (stage "setting the paper"): total marks exact, type counts, difficulty within one question of target, unit coverage, estimated time within about 20% of the duration, no cross-paper duplicates. Surface only one calm sentence, such as "Covers all 6 units of your syllabus."
10. **Reveal gating:** model answers, marking schemes, and explanations stay out of the rendered question until the student has entered an attempt and pressed reveal. (There is no server, so this is an interface rule, not a security boundary.)
11. **Regenerate one question:** same slot, exclude the old stem and all other stems, same validators and critic, clear the attempt.
12. **Adjust difficulty:** recompute target difficulties and regenerate only questions whose target changed.

**Question types:** *Multiple choice* (one best answer, distractors from common misconceptions in the material); *Short answer* (2–4 lines; define/state/list/outline); *Long answer* (structured, clearly scoped); *Application* (apply a concept to a new material-grounded scenario, with parts if natural); *Analytical* (compare, evaluate, derive, justify); *Case-based* (short passage built from the material, then 2–4 parts of rising demand); *Exam-style* (mirrors the conventions of the stated level and style).

---

## 9. Processing screen

Replaces the form full-viewport on ivory. The logo breathes slowly. One line at a time crossfades through the real stages: "Reading your syllabus", "Mapping the topics", "Drafting questions", "Checking coverage and marks", "Setting the paper". No bars, percentages, or spinners. A **Cancel** text button aborts and returns to the form with inputs kept. Announce stage changes in an `aria-live="polite"` region and update the document title.

---

## 10. Paper view

A quiet reading column (max about 68ch) with question numbers and marks in a left margin on desktop. Header: subject, level, duration, total marks, and the coverage sentence. Sections separated by thin rules. Per question:
- the question (with passage and parts when present),
- an answer area: radio options for MCQ, an auto-growing textarea otherwise,
- **Reveal model answer** (text button), enabled only after an attempt exists; shows the model answer, key points, marking scheme, explanation, and "Based on:" with the evidence line,
- **Regenerate this question** (text button), with a gentle confirmation if an answer was typed.

Paper toolbar (sticky on desktop, bottom sheet on mobile): **Adjust difficulty** (Easier / Harder / Mixed), **Print / Save as PDF**, **Include answer key** (toggle), **New paper**, **Clear everything**. Warn with a `beforeunload` prompt while a paper exists, because leaving erases it.

---

## 11. Print and PDF

A dedicated `PrintablePaper` component, hidden on screen and shown for print, so **Print / Save as PDF** (`window.print()`) produces a **professionally typeset academic paper, not an app screenshot**:
- `@page { size: A4; margin: 20mm 18mm 22mm }`; body in Newsreader at 11pt / 1.45; small caps for section labels.
- **First page:** the Setu logo, subject, level, duration, total marks, Name and Date lines, and a short numbered "Instructions to candidates" block generated from the settings.
- Later pages: a running header (subject left, Setu right); footer page numbers using `@page` margin boxes where the browser supports them, never relied on.
- Sections titled like "Section A — Multiple choice (10 marks)" with thin rules; marks right-aligned in brackets `[4]` with tabular numerals; MCQ options (A)–(D) neatly aligned; case-based passages in an indented block with a thin left rule; ruled answer lines sized by marks.
- **Correct page breaks:** `break-inside: avoid` on each question (long-answer questions may split only between parts), `break-after: avoid` on headings, `orphans: 3; widows: 3`, no stranded headings.
- All app UI hidden in print. Optional answer key starting on a new page.
- Verify with Playwright `page.pdf()`: page count, expected text, and page-break positions.

---

## 12. Privacy and safety

- **Memory only.** Study content lives in the Zustand store (no persistence). **Clear everything** resets the store, revokes object URLs, terminates OCR workers, aborts any running request, and returns to the empty page. Also clear on `pagehide`.
- **No telemetry.** No analytics, no error-reporting services, no third-party requests (verify with a Playwright test that records all requests and asserts that only the page's own origin and the configured model endpoint are contacted).
- **Never log** document text, filenames, prompts, or answers.
- Sanitize and escape all rendered model output; never use `dangerouslySetInnerHTML`.
- For production builds, add a Content Security Policy that still permits pdf.js, tesseract.js (workers and WASM), and the model endpoints (`connect-src` for `localhost` and the Gemini host). Test that it does not break OCR or PDF reading.
- **Privacy page (`/privacy`):** plain, honest language: files are read in the browser; nothing is uploaded to Setu or stored; if a local model is used nothing leaves the computer; if Gemini is used, the text sent for generation goes to Google under the student's own key; closing the tab erases everything.

---

## 13. Accessibility (WCAG 2.2 AA)

Semantic landmarks, one `h1` per page, a skip link, labels tied to every control, error text linked via `aria-describedby`, `aria-invalid` on bad fields, `aria-live` regions for file and processing status, focus moved to the new heading after each phase change, full keyboard operation (the drop zone always has a "choose a file" button), visible focus everywhere, 44×44px touch targets, text resizable to 200%, `prefers-reduced-motion` honored, color never the only signal, a document title per screen. Run axe on every screen and state and fix every violation.

---

## 14. Setup and configuration

`README.md` (PowerShell commands): what Setu is, how to run (`npm run setup`, then `npm run dev`), how to install Ollama and pull the model, model size versus hardware guidance, how the Model sheet works, the `OLLAMA_ORIGINS` note, how privacy works and its honest limits (a model on this computer keeps data on this computer; a Gemini key sends text to Google; the key is visible to the page), and troubleshooting. A `.env.example` with `VITE_ENABLE_MOCK=false`. No secrets in the repo.

---

## 15. Testing and verification

**Unit (Vitest):** chunker; BM25 retriever; blueprint arithmetic (**total marks exact across hundreds of random settings**); every validator (marks sums, MCQ rules, evidence-in-chunk, duplicates, vague stems); `rebalance`; JSON repair; file validation (wrong signature, empty, oversize); store reset on Clear everything.

**End to end (Playwright, mock provider, generated PDF/DOCX/TXT/PNG fixtures):** drop a syllabus and material → fill settings → create → (assert no model answers are in the DOM before reveal) → attempt → reveal gating → regenerate → adjust difficulty → print to PDF via `page.pdf()` and assert pages and text → Clear everything → assert the page is empty and no study text remains in the DOM, storage, or memory-visible state; assert no unexpected network requests; keyboard-only run of the whole flow; axe on every screen at 390px and 1440px.

**Visual review:** screenshots of every screen and state at 390px and 1440px in `docs/screenshots/`; look at them and iterate on spacing, hierarchy, and alignment until they feel premium and calm. Rasterize the printed PDF and check it the same way.

**With a real local model** (if Ollama and the model are available): run one end-to-end generation with a small sample syllabus and report honestly on quality and time. If no model is available, say so; do not claim it was tested.

---

## 16. Build phases (do all of them, in order, without pausing)

**Phase 0 — Scaffold.** Vite + React + TS + Tailwind, lint, Vitest, Playwright, fonts, brand and asset scripts, `docs/` files. *Done when:* `npm run setup`, `dev`, `test`, and `build` work.

**Phase 1 — Design system and static page.** Tokens, base styles, `SetuLogo`, primitives, top bar, the one page with all four steps and every state (static), Privacy page, 404, mobile layouts. *Done when:* screenshots look right at 390px and 1440px and axe is clean.

**Phase 2 — File intake.** Validation, PDF/DOCX/TXT extraction, OCR (self-hosted), cleaning, chunking, all upload states, Clear everything. *Done when:* fixtures of every type ingest and every upload-error state is reachable and designed.

**Phase 3 — Model layer.** `LLMClient`, providers, mock, Model sheet, connection test, unreachable notice. *Done when:* the mock passes tests, and connection tests report correctly against a real Ollama if present.

**Phase 4 — Pipeline.** Syllabus map, blueprint, retrieval, generation, validators, critic, rebalance, processing screen, cancel. *Done when:* the mock pipeline produces valid, validated papers across many settings and all validator tests pass.

**Phase 5 — Paper experience.** Paper view, attempt, reveal gating, regenerate, adjust difficulty, beforeunload warning. *Done when:* the Playwright journey passes and screenshots feel intentional on mobile and desktop.

**Phase 6 — Print and finish.** `PrintablePaper`, print CSS, answer-key option, accessibility pass, CSP, no-network test, README, final test run, real-model run if possible. *Done when:* section 17 is satisfied.

---

## 17. Definition of done

- [ ] Nothing in section 2 exists anywhere in the UI or code.
- [ ] After Clear everything, closing, or reloading: no study content remains in the DOM, storage, or app state (tested).
- [ ] Only the chosen model endpoint is ever contacted (tested); OCR, PDF reading, and fonts make no third-party requests.
- [ ] Every generated paper has exact total marks, no duplicates, evidence for each question, and validated coverage.
- [ ] Model answers are not in the DOM before reveal.
- [ ] The printed PDF looks professionally typeset, with the Setu logo and correct page breaks.
- [ ] axe reports no violations; the keyboard-only journey works; all contrast pairs pass AA.
- [ ] Mobile layouts are purpose-designed and screenshot-reviewed.
- [ ] All tests pass; `npm run setup`, `dev`, `build`, `test`, and `e2e` work from a clean checkout.
- [ ] README, `.env.example`, `docs/DECISIONS.md`, and `docs/PROGRESS.md` are complete and honest.

---

## 18. Final report (print this when finished)

1. How to run the app (exact PowerShell commands) and what to install first.
2. What was built, phase by phase, in a few lines each.
3. What was **verified by actually running it**, and what was not (for example real-model quality, if no model was available).
4. Known limitations and honest caveats (browser OCR speed, local-model quality depends on model size and hardware, no server means reveal gating is an interface rule only).
5. Decisions the user may want to revisit (from `docs/DECISIONS.md`).
6. Placeholders still to replace (for example the logo, if it was not supplied).
