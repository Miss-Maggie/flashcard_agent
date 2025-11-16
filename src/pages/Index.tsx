import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import TopicInput from "@/components/TopicInput";
import FlashcardGrid, { Flashcard } from "@/components/FlashcardGrid";
import QuizPanel, { QuizQuestion } from "@/components/QuizPanel";

const Index = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleGenerate = async (topic: string, mode: "stem" | "general") => {
    setIsLoading(true);
    setShowQuiz(false);
    
    try {
      // Mock data for demonstration - will be replaced with Lovable AI
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockFlashcards: Flashcard[] = [
        {
          id: "1",
          question: `What is the main concept of ${topic}?`,
          answer: `The main concept involves understanding the fundamental principles and applications in the context of ${mode === "stem" ? "scientific and mathematical" : "general knowledge"} domains.`,
          category: mode.toUpperCase()
        },
        {
          id: "2",
          question: `How does ${topic} apply in real-world scenarios?`,
          answer: `${topic} has practical applications in various fields including technology, research, and everyday problem-solving.`,
          category: mode.toUpperCase()
        },
        {
          id: "3",
          question: `What are the key components of ${topic}?`,
          answer: `The key components include theoretical foundations, practical methodologies, and real-world implementations.`,
          category: mode.toUpperCase()
        },
        {
          id: "4",
          question: `Why is ${topic} important to study?`,
          answer: `Studying ${topic} helps develop critical thinking skills and provides essential knowledge for academic and professional growth.`,
          category: mode.toUpperCase()
        }
      ];

      const mockQuestions: QuizQuestion[] = [
        {
          id: "q1",
          question: `Which statement best describes ${topic}?`,
          options: [
            "A fundamental principle in the field",
            "An outdated concept",
            "A simple memorization task",
            "An irrelevant topic"
          ],
          correctAnswer: 0,
          explanation: `${topic} is indeed a fundamental principle that forms the basis for more advanced understanding.`
        },
        {
          id: "q2",
          question: `What is the primary application of ${topic}?`,
          options: [
            "Entertainment only",
            "Practical problem-solving and innovation",
            "Historical documentation",
            "No real applications"
          ],
          correctAnswer: 1,
          explanation: `${topic} has significant practical applications in problem-solving and driving innovation across various domains.`
        },
        {
          id: "q3",
          question: `In ${mode === "stem" ? "STEM fields" : "general knowledge"}, ${topic} is considered:`,
          options: [
            "Optional learning material",
            "Core foundational knowledge",
            "Advanced specialization only",
            "Rarely discussed"
          ],
          correctAnswer: 1,
          explanation: `${topic} represents core foundational knowledge essential for understanding more complex concepts.`
        }
      ];

      setFlashcards(mockFlashcards);
      setQuizQuestions(mockQuestions);
      toast.success(`Generated ${mockFlashcards.length} flashcards for "${topic}"!`);
    } catch (error) {
      toast.error("Failed to generate flashcards. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (score: number, weakAreas: string[]) => {
    const percentage = (score / quizQuestions.length) * 100;
    toast.success(
      `Quiz completed! You scored ${score}/${quizQuestions.length} (${percentage.toFixed(0)}%)`,
      { duration: 5000 }
    );
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
              <button
                onClick={() => setShowQuiz(!showQuiz)}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                {showQuiz ? "Hide Quiz" : "Start Interactive Quiz"}
              </button>
            </div>

            {showQuiz && (
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
