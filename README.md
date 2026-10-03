# Setu

**Setu** is a browser-based AI practice-paper generator that turns your own syllabus and study materials into structured, exam-style question papers.

Upload your syllabus, notes, textbooks, past papers, or other study materials, choose an AI provider, describe the paper you want, and Setu generates questions grounded in the content you provide.

Setu supports **local AI models through Ollama**, **cloud AI services**, and **OpenAI-compatible endpoints**, allowing you to choose between local processing and cloud-based models.

The goal is simple: **give Setu the material you actually study from, and let it build a practice paper around it.**

---

## ✨ Features

- 📄 **Multiple file formats** — Supports PDF, DOCX, TXT, and image-based study material.
- 🔍 **Local OCR** — Extracts text from scanned or image-based pages directly in the browser.
- 🧠 **Content-grounded generation** — Generates questions from the syllabus and study material you provide rather than relying only on a generic topic description.
- 📋 **Exact-mark blueprints** — Builds the paper structure before generating questions so the requested marks and question distribution are maintained.
- 🎯 **Custom paper generation** — Choose the subject, academic level, difficulty, question types, marks, style, and other requirements.
- 🤖 **Flexible AI providers** — Use local models, cloud AI services, or compatible API endpoints.
- 🔌 **Provider flexibility** — Switch between supported AI providers without changing the core Setu workflow.
- ✅ **Quality validation** — Checks generated papers for evidence, marks, structure, duplicates, and question-type constraints.
- 🖨️ **Print-ready papers** — Generates clean A4-friendly question papers for printing or saving as PDF.
- 🔒 **No account required** — No Setu account, database, or dedicated Setu backend is required.
- 💾 **In-memory processing** — Uploaded files and generated answers remain in browser memory during the session.

---

## 🧩 How Setu Works

Setu uses a multi-step generation pipeline rather than simply sending your files to an AI model and asking it to create a question paper.

```text
Study Material
      ↓
File Extraction / OCR
      ↓
Content Chunking
      ↓
Syllabus & Material Mapping
      ↓
Question-Paper Blueprint
      ↓
Relevant Content Retrieval
      ↓
Question Generation
      ↓
Validation & Quality Checks
      ↓
Final Practice Paper
```

This approach helps Setu maintain the requested paper structure while keeping generated questions connected to the supplied material.

---

## 🤖 AI Providers

Setu is designed to be **model- and provider-agnostic**.

You are not locked into a single AI model or service. Depending on your setup, you can use a local model, connect to a cloud AI service, or use a compatible API endpoint.

### 🖥️ Local Models

Setu can use models running locally through **Ollama**.

For example:

```powershell
ollama pull qwen3:4b
```

Local inference provides greater control over your data and does not require sending your study material to a cloud AI provider.

However, local models come with a trade-off: **generation speed and quality depend heavily on your hardware and the model you choose.**

Smaller models may struggle with complex questions, while larger models can require substantially more RAM, VRAM, and processing power.

### ☁️ Cloud AI Services

Setu can connect to supported cloud AI services using credentials supplied by the user.

Cloud models can provide access to larger and more capable models without requiring powerful hardware on your computer.

The trade-offs are that they generally require:

- An internet connection
- API credentials
- Available usage quota
- Potential usage costs

The prompts and relevant source material required for generation are sent to the selected service.

### 🔌 Compatible API Endpoints

Setu can also connect to endpoints that expose an **OpenAI-compatible API interface**.

This provides flexibility to use a wider range of hosted or locally running models without requiring a dedicated integration for every individual model.

Compatible endpoints may include:

- Hosted AI services
- Local model servers
- Self-hosted inference systems
- API gateways
- Other services exposing a compatible API interface

Compatibility depends on the implementation of the endpoint.

---

## 🔐 Privacy

Setu is designed as a **browser-only application**.

There is no Setu backend, account system, or database.

During a session:

- Uploaded files are kept in browser memory.
- Extracted text is kept in browser memory.
- Generated answers are kept in browser memory.
- API credentials are used for the provider selected by the user.
- Setu does not maintain a server-side copy of your study materials.

When using a local model, your material can remain entirely on your computer.

When using a cloud AI service, the relevant prompts and source excerpts need to be sent to that service for generation. Data handling is therefore subject to the selected provider's policies.

Closing the tab or clearing the application removes the in-memory session data.

---

## ⚠️ Limitations & Trade-offs

Setu is designed to make generating practice papers easier, but it is not a replacement for reviewing the generated paper yourself.

### Local models can be slow

When using a local model, generation happens on your own hardware.

Depending on your CPU, GPU, available RAM, and model size, generating a complete paper can take significantly longer than using a cloud model.

Larger models may also require substantially more system resources.

### Model quality varies

The quality of the generated paper depends heavily on the selected model.

Smaller models may struggle with:

- Complex multi-step questions
- Long case-based questions
- Strict formatting requirements
- Subtle distinctions between similar concepts
- Higher-level reasoning

More capable models may perform better, but they can require more resources or external API access.

### AI-generated questions still require review

Setu performs structural and evidence-based validation, but automated validation cannot guarantee that every generated question is pedagogically perfect.

A generated paper may occasionally contain:

- An ambiguous question
- An overly easy or difficult question
- An imperfect answer
- A question that interprets the source material differently than intended
- Minor wording or formatting issues

Generated papers should therefore be reviewed before being used for important examinations.

### OCR is not perfect

Scanned documents and images depend on OCR to extract their content.

Poor-quality scans, handwriting, unusual fonts, diagrams, mathematical notation, or complex page layouts may result in incomplete or incorrect text extraction.

### Context limitations

Very large collections of study material cannot always be provided to a model in their entirety.

Setu therefore processes, chunks, and retrieves relevant portions of the material. The final paper can only be as grounded as the information successfully extracted and retrieved from the supplied sources.

### Cloud services require network access

Cloud AI services require an internet connection and may have:

- API quotas
- Rate limits
- Usage costs
- Temporary service outages
- Provider-specific restrictions

Setu retries some temporary provider-capacity errors automatically, but persistent provider errors cannot be resolved by the application.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+**
- **Ollama** — only required if you want to use a local model

Install the default local model:

```powershell
ollama pull qwen3:4b
```

Install dependencies:

```powershell
npm install
```

Run the project setup:

```powershell
npm run setup
```

Start the development server:

```powershell
npm run dev
```

Open the local address displayed by Vite.

Once Setu is running, open **Model**, select your preferred provider and model, and test the connection before generating a paper.

---

## 🧪 Testing & Validation

Setu includes automated testing and validation for the application and generation pipeline.

Run the development checks with:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

The end-to-end browser suite uses a deterministic mock provider, so it does **not** require an installed AI model or an external API key.

---

## 📁 Project Structure

```text
src/
├── components/     Accessible UI and printable paper views
├── lib/
│   ├── files/      File intake, extraction, OCR, and chunking
│   ├── llm/        AI provider clients and resilient JSON handling
│   └── pipeline/   Mapping, blueprinting, retrieval,
│                   generation, and validation

tests/              Unit and Playwright end-to-end tests
```

---

## 🏗️ Architecture

Setu intentionally keeps the application client-side.

```text
                 ┌───────────────────┐
                 │   Browser / React │
                 └─────────┬─────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       Local Processing          AI Provider
       ────────────────          ──────────
       File extraction           Local models
       OCR                       Cloud AI services
       Chunking                  Compatible APIs
       Retrieval
       Validation
              │                         │
              └────────────┬────────────┘
                           │
                    Generated Paper
```

There is no dedicated Setu server responsible for storing user documents or generated papers.

---

## 🔄 Data Flow

The data flow depends on the selected AI provider.

### With a Local Model

```text
Your Files
    ↓
Browser
    ↓
Local Processing
    ↓
Local Model
    ↓
Generated Paper
```

### With a Cloud AI Service

```text
Your Files
    ↓
Browser
    ↓
Local Processing
    ↓
Selected Cloud Service
    ↓
Generated Paper
```

### With a Compatible API Endpoint

```text
Your Files
    ↓
Browser
    ↓
Local Processing
    ↓
Selected API Endpoint
    ↓
Generated Paper
```

Only the provider or endpoint explicitly selected by the user is used for AI generation.

---

## 🎯 Intended Use

Setu is primarily intended for creating **practice and revision materials** from existing educational content.

For example, you can provide:

- A school syllabus
- Class notes
- Textbook chapters
- Past examination papers
- Teacher-provided materials
- Revision notes

Then specify something such as:

> Create a 50-mark Class 10 science practice paper with multiple-choice, short-answer, and long-answer questions. Focus on the supplied syllabus and maintain a balanced difficulty level.

Setu will build the paper structure and generate questions based on the available source material.

---

## 📌 Current Scope

Setu is intentionally a **browser-only tool** rather than a full educational platform.

It currently does not require:

- User accounts
- A centralized database
- A Setu backend
- Cloud file storage
- A subscription system

The application is designed to keep the core workflow lightweight and local-first while allowing users to choose cloud models when additional model capability or faster generation is needed.
