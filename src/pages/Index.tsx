import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import TopicInput from "@/components/TopicInput";
import FlashcardGrid, { Flashcard } from "@/components/FlashcardGrid";
import QuizPanel, { QuizQuestion } from "@/components/QuizPanel";

const Index = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentMode, setCurrentMode] = useState<"stem" | "general">("general");

  const handleGenerate = async (topic: string, mode: "stem" | "general") => {
    setIsLoading(true);
    setShowQuiz(false);
    setCurrentTopic(topic);
    setCurrentMode(mode);
    
    try {
      console.log("Generating flashcards for:", topic, mode);
      
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: { topic, mode },
      });

      if (error) {
        console.error("Error generating flashcards:", error);
        throw error;
      }

      if (!data?.flashcards || data.flashcards.length === 0) {
        throw new Error("No flashcards generated");
      }

      setFlashcards(data.flashcards);
      toast.success(`Generated ${data.flashcards.length} flashcards for "${topic}"!`);
      
      // Generate quiz questions
      console.log("Generating quiz questions...");
      const { data: quizData, error: quizError } = await supabase.functions.invoke("generate-quiz", {
        body: { topic, mode, flashcards: data.flashcards },
      });

      if (quizError) {
        console.error("Error generating quiz:", quizError);
        toast.error("Flashcards created, but quiz generation failed");
      } else if (quizData?.questions) {
        setQuizQuestions(quizData.questions);
        console.log("Quiz questions generated:", quizData.questions.length);
      }
      
    } catch (error: any) {
      console.error("Generation error:", error);
      
      if (error.message?.includes("429") || error.message?.includes("Rate limit")) {
        toast.error("Rate limit reached. Please try again in a moment.");
      } else if (error.message?.includes("402") || error.message?.includes("credits")) {
        toast.error("AI credits depleted. Please add credits to continue.");
      } else {
        toast.error("Failed to generate flashcards. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (score: number, weakAreas: string[]) => {
    const percentage = (score / quizQuestions.length) * 100;
    
    let message = `Quiz completed! You scored ${score}/${quizQuestions.length} (${percentage.toFixed(0)}%)`;
    
    if (percentage === 100) {
      message += " - Perfect score! 🎉";
    } else if (percentage >= 80) {
      message += " - Great job! 👏";
    } else if (percentage >= 60) {
      message += " - Good effort! Keep practicing 📚";
    } else {
      message += " - Keep studying and try again! 💪";
    }
    
    toast.success(message, { duration: 5000 });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 space-y-12">
        <TopicInput onGenerate={handleGenerate} isLoading={isLoading} />

        {flashcards.length > 0 && (
          <>
            <FlashcardGrid flashcards={flashcards} />
            
            {quizQuestions.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowQuiz(!showQuiz)}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md"
                >
                  {showQuiz ? "Hide Quiz" : "Start Interactive Quiz"}
                </button>
              </div>
            )}

            {showQuiz && quizQuestions.length > 0 && (
              <QuizPanel 
                questions={quizQuestions} 
                onComplete={handleQuizComplete}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>FlashCard Agent - AI-Powered Learning © 2024</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
