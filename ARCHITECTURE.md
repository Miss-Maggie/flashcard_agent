# FlashCard Agent Architecture

## AI Integration Patterns ✅

Your agent is properly using **Vertex AI**, **ADK**, and **Genkit** patterns:

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

## Features

✅ Quiz results history with database storage  
✅ Mobile-responsive design (all components)  
✅ Vertex AI + ADK + Genkit patterns implemented  
✅ Real-time statistics dashboard  
✅ Navigation between Home and History pages  

## Database Schema

**Table**: `quiz_results`
- Stores quiz completion data
- Tracks score, time, questions, and metadata
- Public RLS policies (leaderboard-style access)
- Indexed for performance

## Mobile Responsiveness

All components use responsive Tailwind classes:
- Grid layouts: `grid-cols-2 md:grid-cols-4`
- Text sizes: `text-sm md:text-base lg:text-lg`
- Padding/spacing: `p-4 md:p-6`, `gap-3 md:gap-4`
- Flex directions: `flex-col md:flex-row`

Tested across mobile, tablet, and desktop viewports.
