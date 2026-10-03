# Setu

Setu is a browser-based practice-paper generator. Upload your syllabus and study material, choose the AI you want to use, describe the paper you need, and Setu creates grounded exam-style questions from your own content.

You can use Gemini with your own API key, an OpenAI-compatible endpoint (including a Claude-compatible gateway when it exposes that API format), or a local model through Ollama. Setu uses the selected model to map your material, build the requested paper structure, and generate questions that match your chosen subject, level, style, difficulty, marks, and question types.

It is a browser-only React application: no accounts, database, or Setu backend.

## Highlights

- Reads PDF, DOCX, TXT, and image-based notes in the browser, including local OCR for scanned pages.
- Builds an exact-mark blueprint before generating questions.
- Supports Gemini with a user-supplied key, OpenAI-compatible endpoints (including Claude-compatible gateways), and local Ollama models.
- Validates evidence, marks, structure, duplicates, and question-type rules before showing a paper.
- Generates print-friendly A4 papers and keeps uploaded files and answers in memory only.

## Run locally

Prerequisites: Node.js 20+ and, for the default local model, [Ollama](https://ollama.com).

```powershell
ollama pull qwen3:4b
npm install
npm run setup
npm run dev
```

Open the local address displayed by Vite. In **Model**, test the selected model before creating a paper.

## Choose an AI provider

Ollama with `qwen3:4b` is the default private option. You may alternatively connect Gemini using your own API key, or enter an OpenAI-compatible endpoint for a local server or a Claude-compatible API gateway. A selected external provider receives the prompts and source excerpts required to generate the paper; Setu itself does not upload or store them.

Generation automatically uses compact, adaptive request budgets: small questions use fewer tokens, while longer and case-based questions receive more room. Temporary provider-capacity errors retry automatically.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

The browser suite uses the built-in deterministic mock provider and does not require an installed model.

## Project structure

```text
src/components/     Accessible UI and printable paper views
src/lib/files/      In-browser file intake, extraction, OCR, and chunking
src/lib/llm/        Provider clients and resilient JSON handling
src/lib/pipeline/   Syllabus mapping, blueprinting, retrieval, generation, validation
tests/              Unit and Playwright end-to-end coverage
```

## Privacy

Study files, extracted text, answers, and Gemini keys remain in tab memory. Clearing the app or closing the tab removes them. The only network calls are to the model endpoint you explicitly select.
