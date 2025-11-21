const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const callLovableAI = async (prompt: string, systemContext: string) => {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable AI error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits depleted. Please add credits to continue.");
    }
    
    throw new Error(`AI request failed: ${response.status}`);
  }

  return await response.json();
};

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

    flashcards.forEach((card, index) => {
      if (!card.question || !card.answer || !card.category) {
        throw new Error(`Flashcard ${index} missing required fields`);
      }
    });

    return flashcards;
  } catch (parseError) {
    console.error("Failed to parse AI response:", parseError);
    console.error("Content that failed:", cleanContent.substring(0, 500));

    try {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);

      if (errorMessage.includes("Unterminated string") ||
          errorMessage.includes("Unexpected end of JSON input") ||
          errorMessage.includes("Unexpected token")) {
        let repaired = cleanContent;

        if (!repaired.trim().endsWith("]")) {
          const lastBraceIndex = repaired.lastIndexOf("}");
          if (lastBraceIndex !== -1) {
            repaired = repaired.slice(0, lastBraceIndex + 1) + "\n]";
          }
        }

        if (!repaired.trim().startsWith("[")) {
          const firstBracket = repaired.indexOf("[");
          if (firstBracket !== -1) {
            repaired = repaired.slice(firstBracket);
          } else {
            throw new Error("Repair failed: no opening '[' found");
          }
        }

        console.warn("Attempting to repair JSON and re-parse");
        const repairedFlashcards = JSON.parse(repaired);

        if (!Array.isArray(repairedFlashcards) || repairedFlashcards.length === 0) {
          throw new Error("Invalid flashcard format after repair");
        }

        repairedFlashcards.forEach((card: any, index: number) => {
          if (!card.question || !card.answer || !card.category) {
            throw new Error(`Flashcard ${index} missing required fields after repair`);
          }
        });

        return repairedFlashcards;
      }
    } catch (repairError) {
      console.error("Failed to repair AI JSON:", repairError);
    }

    const finalErrorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`JSON parsing failed: ${finalErrorMessage}`);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, mode } = await req.json();
    console.log("Starting flashcard generation for topic:", topic, "mode:", mode);

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { systemContext, userPrompt } = createFlashcardPrompt(topic, mode || "general");
    console.log("Prompt template created");

    console.log("Calling Lovable AI...");
    const aiResponse = await callLovableAI(userPrompt, systemContext);
    console.log("AI response received");

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response - no content generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsing and validating flashcards...");
    const flashcards = parseFlashcards(content);
    console.log(`Successfully generated ${flashcards.length} flashcards`);

    return new Response(
      JSON.stringify({ flashcards }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate flashcards",
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
