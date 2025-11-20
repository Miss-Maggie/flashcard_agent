import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizPanelProps {
  questions: QuizQuestion[];
  topic?: string;
  mode?: string;
  onComplete: (score: number, weakAreas: string[]) => void;
}

const QuizPanel = ({ questions, topic = "Unknown", mode = "general", onComplete }: QuizPanelProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [isSaving, setIsSaving] = useState(false);

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setIsAnswered(true);
    setAnswers([...answers, isCorrect]);
    
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const saveQuizResult = async (finalScore: number) => {
    setIsSaving(true);
    try {
      const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      const scorePercentage = (finalScore / questions.length) * 100;

      const { error } = await supabase
        .from("quiz_results")
        .insert([{
          topic,
          mode,
          total_questions: questions.length,
          correct_answers: finalScore,
          score_percentage: scorePercentage,
          time_taken_seconds: timeElapsed,
          questions_data: questions as any,
        }]);

      if (error) {
        console.error("Error saving quiz result:", error);
        toast.error("Quiz completed but failed to save results");
      }
    } catch (error) {
      console.error("Error saving quiz result:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      const finalScore = selectedAnswer === currentQuestion.correctAnswer ? score + 1 : score;
      await saveQuizResult(finalScore);
      onComplete(finalScore, []);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setAnswers([]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Interactive Quiz</h2>
        <Badge variant="outline" className="text-base px-4 py-1">
          {currentIndex + 1} / {questions.length}
        </Badge>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="p-6 md:p-8 rounded-2xl shadow-md border-2 border-border space-y-6">
        <div className="space-y-4">
          <p className="text-lg md:text-xl font-medium text-foreground">
            {currentQuestion.question}
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showResult = isAnswered;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full p-4 text-left rounded-xl border-2 transition-all duration-200",
                    "hover:shadow-md disabled:cursor-not-allowed",
                    !showResult && !isSelected && "border-border bg-card hover:border-primary/50",
                    !showResult && isSelected && "border-primary bg-primary/5",
                    showResult && isCorrect && "border-success bg-success/10",
                    showResult && !isCorrect && isSelected && "border-destructive bg-destructive/10",
                    showResult && !isCorrect && !isSelected && "border-border bg-muted opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1 font-medium">{option}</span>
                    {showResult && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 ml-2" />
                    )}
                    {showResult && !isCorrect && isSelected && (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {isAnswered && currentQuestion.explanation && (
            <div className="p-4 bg-muted rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {!isAnswered ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="flex-1 h-12 rounded-xl font-medium"
              size="lg"
            >
              Submit Answer
            </Button>
          ) : (
            <>
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl font-medium"
                size="lg"
              >
                {isSaving ? (
                  "Saving..."
                ) : isLastQuestion ? (
                  <>
                    <Trophy className="mr-2 h-5 w-5" />
                    View Results
                  </>
                ) : (
                  "Next Question"
                )}
              </Button>
              {isLastQuestion && (
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="h-12 rounded-xl font-medium"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Restart
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Current Score</span>
          <Badge variant="secondary" className="text-base px-4 py-1">
            {score} / {answers.length}
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default QuizPanel;
