// Vertex AI integration without external auth library
// Using direct OAuth2 token exchange

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ADK Pattern: Configuration & Validation
const getVertexAIConfig = () => {
  const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
  const location = Deno.env.get("GOOGLE_CLOUD_LOCATION");
  const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

  if (!projectId || !location || !serviceAccountJson) {
    throw new Error("Vertex AI configuration missing");
  }

  return { projectId, location, serviceAccountJson };
};

// ADK Pattern: Prompt Template Management
const createQuizPrompt = (topic: string, mode: string, flashcards: any[]) => {
  const systemContext = mode === "stem"
    ? `You are an expert educator creating challenging STEM quiz questions. Focus on testing deep understanding, problem-solving abilities, and application of concepts. Include questions that require critical thinking and analysis.`
    : `You are an expert educator creating engaging quiz questions for general knowledge. Create questions that test understanding, recall, and application of concepts in interesting ways.`;

  const flashcardContext = flashcards?.length > 0
    ? `\n\nBased on these flashcard topics:\n${flashcards.map((fc: any) => `- ${fc.question}`).join('\n')}`
    : '';

  const userPrompt = `Create 5 multiple-choice quiz questions about "${topic}".${flashcardContext}

Each question should:
- Be clear and unambiguous
- Have 4 answer options (A, B, C, D)
- Have exactly ONE correct answer
- Include a brief explanation of why the answer is correct
- Cover different aspects and difficulty levels of the topic
${mode === "stem" ? "- Test conceptual understanding and problem-solving, not just memorization" : "- Be engaging and test practical knowledge"}

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Clear question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

The correctAnswer should be the index (0-3) of the correct option in the options array.
No additional text, just the JSON array.`;

  return { systemContext, userPrompt };
};

// Genkit-inspired: Model invocation with structured output
const callVertexAI = async (prompt: string, systemContext: string, config: any) => {
  try {
    const credentials = JSON.parse(config.serviceAccountJson);
    
    // Create JWT for Google OAuth2
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = { alg: "RS256", typ: "JWT" };
    const jwtClaimSet = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const jwtHeaderBase64 = btoa(JSON.stringify(jwtHeader)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwtClaimSetBase64 = btoa(JSON.stringify(jwtClaimSet)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const signatureInput = `${jwtHeaderBase64}.${jwtClaimSetBase64}`;

    // Import private key
    const privateKey = credentials.private_key.replace(/\\n/g, "\n");
    const keyData = privateKey.match(/-----BEGIN PRIVATE KEY-----\s*([\s\S]+?)\s*-----END PRIVATE KEY-----/);
    if (!keyData) throw new Error("Invalid private key format");
    
    const binaryKey = Uint8Array.from(atob(keyData[1].replace(/\s/g, "")), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Sign JWT
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwt = `${signatureInput}.${signatureBase64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const endpoint = `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/gemini-1.5-flash:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemContext },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vertex AI error:", response.status, errorText);
      throw new Error(`Vertex AI request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling Vertex AI:", error);
    throw error;
  }
};

// ADK Pattern: Response validation and parsing
const parseQuizQuestions = (content: string) => {
  let cleanContent = content.trim();
  
  if (cleanContent.startsWith("```json")) {
    cleanContent = cleanContent.slice(7);
  }
  if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith("```")) {
    cleanContent = cleanContent.slice(0, -3);
  }
  
  cleanContent = cleanContent.trim();
  const questions = JSON.parse(cleanContent);
  
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Invalid quiz format");
  }

  // Validate structure
  questions.forEach((q, index) => {
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
        typeof q.correctAnswer !== "number" || !q.explanation) {
      throw new Error(`Quiz question ${index} has invalid structure`);
    }
    if (q.correctAnswer < 0 || q.correctAnswer > 3) {
      throw new Error(`Quiz question ${index} has invalid correctAnswer index`);
    }
  });

  return questions;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, mode, flashcards } = await req.json();
    console.log("[Genkit Flow] Starting quiz generation for topic:", topic, "mode:", mode);

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ADK: Get configuration
    const config = getVertexAIConfig();
    console.log("[ADK] Configuration validated - Project:", config.projectId, "Location:", config.location);

    // ADK: Create prompt from template
    const { systemContext, userPrompt } = createQuizPrompt(topic, mode || "general", flashcards || []);
    console.log("[ADK] Prompt template created");

    // Genkit: Invoke model
    console.log("[Genkit] Invoking Vertex AI model...");
    const aiResponse = await callVertexAI(userPrompt, systemContext, config);
    console.log("[Genkit] Model response received");

    const content = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      console.error("[Genkit] No content in AI response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ADK: Parse and validate response
    console.log("[ADK] Parsing and validating quiz questions...");
    const questions = parseQuizQuestions(content);
    console.log(`[ADK] Successfully generated ${questions.length} quiz questions`);

    return new Response(
      JSON.stringify({ questions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Error]", error.message);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate quiz",
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
