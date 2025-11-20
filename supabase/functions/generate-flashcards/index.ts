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
const createFlashcardPrompt = (topic: string, mode: string) => {
  const systemContext = mode === "stem"
    ? `You are an expert educator specializing in STEM subjects (Science, Technology, Engineering, Mathematics). Create comprehensive, accurate flashcards that test deep understanding of concepts, formulas, and problem-solving approaches. Include technical details and precise definitions.`
    : `You are an expert educator creating engaging flashcards for general knowledge topics. Focus on interesting facts, key concepts, and practical applications. Make the content accessible and memorable.`;

  const userPrompt = `Create 6 high-quality flashcards about "${topic}". 
    
Each flashcard should:
- Have a clear, specific question
- Provide a detailed, informative answer
- Cover different aspects of the topic (definitions, applications, examples, comparisons, etc.)
${mode === "stem" ? "- Include formulas, processes, or technical details where relevant" : "- Include interesting facts and real-world connections"}

CRITICAL: Return ONLY valid JSON. All text must be properly escaped:
- Use \\" for quotes within strings
- Use \\n for line breaks within strings
- Escape all special characters properly

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Clear question here",
    "answer": "Detailed answer here",
    "category": "${mode.toUpperCase()}"
  }
]

No markdown code blocks, no additional text, just the raw JSON array.`;

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

    const endpoint = `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/gemini-2.5-flash:generateContent`;

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
const parseFlashcards = (content: string) => {
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
  
  try {
    const flashcards = JSON.parse(cleanContent);
    
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("Invalid flashcard format");
    }

    // Validate structure
    flashcards.forEach((card, index) => {
      if (!card.question || !card.answer || !card.category) {
        throw new Error(`Flashcard ${index} missing required fields`);
      }
    });

    return flashcards;
  } catch (parseError) {
    console.error("[Parse Error] Failed to parse AI response:", parseError);
    console.error("[Parse Error] Content that failed:", cleanContent.substring(0, 500));
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`JSON parsing failed: ${errorMessage}`);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, mode } = await req.json();
    console.log("[Genkit Flow] Starting flashcard generation for topic:", topic, "mode:", mode);

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
    const { systemContext, userPrompt } = createFlashcardPrompt(topic, mode || "general");
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
    console.log("[ADK] Parsing and validating flashcards...");
    const flashcards = parseFlashcards(content);
    console.log(`[ADK] Successfully generated ${flashcards.length} flashcards`);

    return new Response(
      JSON.stringify({ flashcards }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Error]", error.message);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate flashcards",
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
