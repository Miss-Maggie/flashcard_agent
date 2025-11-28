# FlashCard Agent

FlashCard Agent is an AI-powered learning app built with React + TypeScript (Vite) that lets users generate flashcards and interactive quizzes from user-provided topics using Supabasebackend and Google Vertex AI integration.

## Live Demo

🚀 **[View Live Demo](https://your-deployed-app-url.com)**


Contents
---------
- Project overview
- Requirements
- Local setup (Windows / PowerShell)
- Environment variables
- Development workflow
- Testing (parser harness)
- Supabase Edge Functions (deploy & env)
- Troubleshooting & common issues
- Contributing

Project overview
----------------

Purpose:
- Educational tool for creating AI-generated flashcards and multiple-choice quizzes

Key features
- Generate flashcards from a topic using an AI function
- Generate multiple-choice quizzes from flashcards (Edge Function calls Vertex AI)
- Save quiz results to Supabase and view them in a history page
- Interactive quiz UI with scoring and result saving

Architecture(Technology Stack)
- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui
- Backend: Supabase (database + auth) and Supabase Edge Functions (Deno) to call Vertex AI
- AI: Vertex AI (Gemini family) invoked from the Edge Function via service-account JWT exchange

Requirements
- Node.js (recommended >= 18). The project was tested with Node 25 on Windows.
- npm or pnpm (package manager). Example commands below use npm; pnpm works too.
- Supabase project (for database, auth and Edge Functions)
- Google Cloud service account JSON with access to Vertex AI (if you want to run the `generate-quiz` function)


Code Structure
-------------------------

```python
src/
├── components/
│   ├── common/          # Shared components (Header, TopicInput, etc.)
│   ├── features/        # Feature-specific components (FlashcardGrid, QuizPanel)
│   └── ui/              # shadcn/ui components (buttons, dialogs, etc.)
├── pages/               # Route components (Index, History, Auth, NotFound)
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (cn function for class merging)
├── types/               # TypeScript type definitions
└── integrations/        # External service integrations (Supabase client)
```

---

## Benefits of This Structure

1. **Scalability** - Easy to add new component categories
2. **Maintainability** - Clear separation of concerns
3. **Discoverability** - New developers know where to find components
4. **Reusability** - Barrel exports make imports cleaner
5. **Organization** - Scripts grouped by purpose

---

## AI Integration Patterns

### 1. **Vertex AI Integration** 
- Direct API calls to Google Cloud Vertex AI
- Using `gemini-2.5-flash` model
- OAuth2 JWT token authentication
- Endpoint: `https://{location}-aiplatform.googleapis.com/v1/projects/{projectId}/locations/{location}/publishers/google/models/gemini-2.5-flash:generateContent`

### 2. **ADK (AI Development Kit) Patterns**
- **Configuration & Validation**: `getVertexAIConfig()` validates environment variables
- **Prompt Template Management**: `createFlashcardPrompt()` and `createQuizPrompt()` manage prompts
- **Response Validation**: `parseFlashcards()` and `parseQuizQuestions()` validate AI responses

### 3. **Genkit-Inspired Patterns**
- **Model Invocation**: `callVertexAI()` handles structured AI model communication
- **Flow Management**: Logging and error handling throughout the generation flow
- **Structured Output**: JSON-based responses with schema validation

## Edge Functions

### `generate-flashcards`
- **Location**: `supabase/functions/generate-flashcards/index.ts`
- **Purpose**: Generates 6 AI-powered flashcards using Vertex AI
- **Patterns**: ADK config, prompt templates, Genkit model invocation

### `generate-quiz`
- **Location**: `supabase/functions/generate-quiz/index.ts`
- **Purpose**: Generates 5 multiple-choice quiz questions
- **Patterns**: Same ADK/Genkit architecture as flashcards

Local setup (PowerShell)
-------------------------
Open PowerShell and run:

```powershell
# 1. Install dependencies
npm install

# 2. Start the dev server (Vite)
npm run dev
```

Open http://localhost:8080 (Vite prints the exact URL when it starts).

Environment variables
---------------------
Create a `.env.local` (or set environment variables in your environment). Example `.env.local`:

```env
# Vite / client-side (must start with VITE_ to be exposed to the browser)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key

# For Supabase Edge Functions (server-side): set these in the Supabase dashboard or in your function runtime
# GOOGLE_* variables are used by the generate-quiz function to call Vertex AI
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_JSON="{...json...}"
```

Key Components
----------------

- Index Page (src/pages/Index.tsx): Main app interface with topic input, flashcard display, and quiz functionality
- FlashcardGrid (src/components/features/FlashcardGrid.tsx): Displays generated flashcards in a responsive grid
- QuizPanel (src/components/features/QuizPanel.tsx): Interactive quiz interface with scoring
- Supabase Functions: Serverless functions for AI generation (generate-flashcards, generate-quiz)
  
Development notes
-----------------
- The Supabase client singleton lives in `src/integrations/supabase/client.ts` — it logs minimal debug information in dev to help diagnose auth issues.
- Flashcards are intentionally cleared on full page reload by default (the app keeps a per-tab verification flag so users must re-login on a fresh tab/session).
- The Create Quiz button appears when flashcards exist but quiz questions have not been generated yet; this lets you retry quiz generation without regenerating flashcards.

Testing the parser locally
--------------------------
We include a small test harness that runs the question parser/repair logic against several sample AI outputs. Run it with Node (from repo root):

```powershell
node .\supabase\functions\generate-quiz\parse_test.js
```

The harness prints debug logs showing parsing and repair attempts (truncated JSON, fenced code blocks, noisy outputs).

Supabase Edge Functions (generate-quiz)
-------------------------------------
Location: `supabase/functions/generate-quiz/index.ts`

This function:
- Receives topic, mode and flashcards
- Composes a prompt and uses a service-account JWT exchange to call Vertex AI's `gemini-2.5-flash:generateContent` endpoint
- Parses the model output into a strict JSON array of quiz questions and uses repair heuristics when the model returns malformed JSON

Deploying functions (brief)
- Install the Supabase CLI and log in: https://supabase.com/docs/guides/cli
- Build & deploy functions with the Supabase CLI:

```powershell
# from repo root
supabase login
supabase functions deploy generate-quiz --project-ref your-project-ref
supabase functions deploy generate-flashcards --project-ref your-project-ref
```

Make sure the function environment variables (`GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_SERVICE_ACCOUNT_JSON`) are set in the Supabase dashboard (Project Settings -> Environment Variables) or via the CLI.

Security & auth notes
---------------------
- The frontend requires users to sign in via Supabase Auth before generating flashcards or quizzes. The app currently enforces a per-tab re-login on reload — this is implemented using a `sessionStorage` flag set after successful login and a sign-out on fresh loads.
- If you see `422` signup errors, it's usually because an email redirect URL was provided during signup that isn't whitelisted in Supabase Auth settings. For local dev, signup in the UI avoids sending redirect URLs.
- If you see a browser warning about "Multiple GoTrueClient instances", that's handled in `src/integrations/supabase/client.ts` via a dev singleton stored on `globalThis`.

Troubleshooting
---------------
- Parser errors in `generate-quiz`:
	- The Edge Function includes robust repair strategies but if you still get parse failures, check function logs (Supabase dashboard) to see the raw model output snippet. You can also run the local parser harness to reproduce and iterate.
- Supabase auth issues:
	- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set correctly.
	- Whitelist local redirect URLs in the Supabase Auth settings if you plan to use email links.

Developer tips
--------------
- Use `npm run dev` for local frontend development; changes hot-reload via Vite.
- Use `node` to run the lightweight parser harness when iterating on the Edge Function's parsing logic.
- Keep the Google service account JSON only on the server (Supabase functions environment) — never expose it in the client.

Contributing
------------
Contributions are welcome. Please open an issue or PR with a clear description of the change and any testing steps.

License & attribution
---------------------
This project includes third-party libraries (React, Vite, Supabase, Tailwind, shadcn/ui). Check `package.json` for the full list of dependencies and their licenses.

Developed by 
-------
[Magdaline Muthui](https://github.com/Miss-Maggie/flashcard_agent.git ) 
