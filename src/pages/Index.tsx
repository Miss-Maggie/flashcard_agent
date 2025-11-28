import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Header from "@/components/common/Header";
import TopicInput from "@/components/common/TopicInput";
import FlashcardGrid, { Flashcard } from "@/components/features/FlashcardGrid";
import QuizPanel, { QuizQuestion } from "@/components/features/QuizPanel";

const STORAGE_KEY = "flashcard_session";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentMode, setCurrentMode] = useState<"stem" | "general">("general");

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Require an explicit verification flag per browser session to allow actions.
      const verified = sessionStorage.getItem("user_verified");

      if (!session) {
        navigate("/auth");
      } else if (!verified) {
        // If there's an existing session but the user hasn't verified in this browser session,
        // sign them out so they're prompted to log in again.
        supabase.auth.signOut().then(() => navigate("/auth"));
      } else {
        setSession(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load flashcards from database on mount
  // Clear flashcards on reload: do NOT auto-load previous flashcards from DB
  useEffect(() => {
    // Ensure UI starts with an empty flashcards array on first mount / reload
    setFlashcards([]);
    setQuizQuestions([]);
    setShowQuiz(false);
    // Intentionally do not load historical flashcards here so the session starts fresh.
  }, []);

  // Auto-generate from URL parameters (Try Again feature)
  useEffect(() => {
    const topic = searchParams.get("topic");
    const mode = searchParams.get("mode") as "stem" | "general" | null;
    
    if (topic && mode) {
      handleGenerate(topic, mode);
      // Clear URL parameters after triggering generation
      setSearchParams({});
    }
  }, [searchParams]);

  // Note: Removed localStorage persistence as flashcards are now stored in the database

  const handleGenerate = async (topic: string, mode: "stem" | "general") => {
    setIsLoading(true);
    setShowQuiz(false);
    setCurrentTopic(topic);
    setCurrentMode(mode);
    
    try {
      // Ensure we have a fresh session token
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        console.error("Session error:", sessionError);
        toast.error("Session expired. Please log in again.");
        navigate("/auth");
        return;
      }

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

  // User-visible action to (re-)generate quiz questions from the current flashcards
  const handleCreateQuiz = async () => {
    if (flashcards.length === 0) {
      toast.error("No flashcards to generate a quiz from. Create flashcards first.");
      return;
    }

    setIsLoading(true);
    try {
      const topic = currentTopic || flashcards[0]?.topic || "";
      const mode = currentMode || (flashcards[0]?.mode as "stem" | "general") || "general";

      const { data: quizData, error: quizError } = await supabase.functions.invoke("generate-quiz", {
        body: { topic, mode, flashcards },
      });

      if (quizError) {
        console.error("Error generating quiz:", quizError);
        toast.error("Quiz generation failed. Check logs and try again.");
        return;
      }

      if (quizData?.questions) {
        setQuizQuestions(quizData.questions);
        toast.success(`Quiz generated (${quizData.questions.length} questions)`);
      } else {
        toast.error("No quiz questions returned from the server.");
      }
    } catch (error: any) {
      console.error("handleCreateQuiz error:", error);
      toast.error("Failed to create quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 space-y-12">
        <TopicInput onGenerate={handleGenerate} isLoading={isLoading} />

        {flashcards.length > 0 && (
          <>
            <FlashcardGrid flashcards={flashcards} />
            
            <div className="flex justify-center">
              {quizQuestions.length === 0 ? (
                <button
                  onClick={handleCreateQuiz}
                  disabled={isLoading}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md disabled:opacity-60"
                >
                  Create Quiz
                </button>
              ) : (
                <button
                  onClick={() => setShowQuiz(!showQuiz)}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md"
                >
                  {showQuiz ? "Hide Quiz" : "Start Interactive Quiz"}
                </button>
              )}
            </div>

            {showQuiz && quizQuestions.length > 0 && (
              <QuizPanel 
                questions={quizQuestions}
                topic={currentTopic}
                mode={currentMode}
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
