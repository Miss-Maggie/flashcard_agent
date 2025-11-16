const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, mode } = await req.json();
    console.log("Generating flashcards for topic:", topic, "mode:", mode);

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
      ? `You are an expert educator specializing in STEM subjects (Science, Technology, Engineering, Mathematics). Create comprehensive, accurate flashcards that test deep understanding of concepts, formulas, and problem-solving approaches. Include technical details and precise definitions.`
      : `You are an expert educator creating engaging flashcards for general knowledge topics. Focus on interesting facts, key concepts, and practical applications. Make the content accessible and memorable.`;

    const userPrompt = `Create 6 high-quality flashcards about "${topic}". 
    
Each flashcard should:
- Have a clear, specific question
- Provide a detailed, informative answer
- Cover different aspects of the topic (definitions, applications, examples, comparisons, etc.)
${mode === "stem" ? "- Include formulas, processes, or technical details where relevant" : "- Include interesting facts and real-world connections"}

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Clear question here",
    "answer": "Detailed answer here",
    "category": "${mode.toUpperCase()}"
  }
]

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
        JSON.stringify({ error: "Failed to generate flashcards" }),
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
        JSON.stringify({ error: "Invalid flashcard format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const flashcards = JSON.parse(jsonMatch[0]);
    
    // Add IDs to flashcards
    const flashcardsWithIds = flashcards.map((card: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      ...card,
    }));

    console.log(`Generated ${flashcardsWithIds.length} flashcards`);
    return new Response(
      JSON.stringify({ flashcards: flashcardsWithIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-flashcards:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
