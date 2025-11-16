const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, mode, flashcards } = await req.json();
    console.log("Generating quiz for topic:", topic, "mode:", mode);

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = mode === "stem"
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

    console.log("Calling Lovable AI...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate quiz" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON array from the content
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not find JSON array in response:", content);
      return new Response(
        JSON.stringify({ error: "Invalid quiz format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const questions = JSON.parse(jsonMatch[0]);
    
    // Add IDs to questions
    const questionsWithIds = questions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      ...q,
    }));

    console.log(`Generated ${questionsWithIds.length} quiz questions`);
    return new Response(
      JSON.stringify({ questions: questionsWithIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-quiz:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
