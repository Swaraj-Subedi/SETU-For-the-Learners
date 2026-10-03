# Setu

A single-page, no-login, no-backend web tool: a student drops in a syllabus and notes, and Setu generates an exam-style practice paper in the browser using a model the student chooses (local Ollama by default). React + TypeScript + Vite + Tailwind.

## Source of truth
The full spec is `SETU_BRIEF.md` in the project root. Read it fully at the start of every session and re-read the relevant section before each phase.

## Standing rules
- Work autonomously through all phases. Do not pause for approval between phases. Record choices in `docs/DECISIONS.md`.
- Keep `docs/PROGRESS.md` updated after every phase so a new session can resume from it.
- Verify by running: unit tests, Playwright, axe, screenshots, PDF checks. Fix failures before moving on.
- Commit after each phase.
- Never fake a capability. If something cannot be fully done, build the honest closest version and say so.

## Environment
Native Windows, PowerShell. No bash, no make, no Docker. Every command is an `npm run` script. No backend of any kind.

## Never build
Backend or server code, accounts or login, databases (including Supabase), analytics or telemetry, dashboards, progress charts, streaks, saved papers or history, social features, third-party network requests (only the student's chosen model endpoint may be contacted).

## Privacy musts
- Study content lives in memory only. Never write it to localStorage, sessionStorage, IndexedDB, or cookies. Never store an API key.
- "Clear everything" and closing the tab must leave nothing behind.
- Never log document text, filenames, prompts, or answers.

## Code standards
- TypeScript `strict`; no `any`; no `dangerouslySetInnerHTML`; ESLint + Prettier.
- Blueprint (marks, counts, difficulty) is deterministic code, never the model. Total marks must always be exact.
- Use the `SetuLogo` component for every logo placement; never redraw or recolor the supplied logo (`brand/`).

## Commands
`npm run setup`, `npm run dev`, `npm run test`, `npm run e2e`, `npm run lint`, `npm run build`
