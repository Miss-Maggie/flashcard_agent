import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Target, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface QuizResult {
  id: string;
  topic: string;
  mode: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_taken_seconds: number | null;
  completed_at: string;
  questions_data: any;
}

const History = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    totalQuestions: 0,
  });

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
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

  const handleTryAgain = (topic: string, mode: string) => {
    navigate(`/?topic=${encodeURIComponent(topic)}&mode=${mode}`);
  };

  useEffect(() => {
    if (session) {
      fetchHistory();
    }
  }, [session]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setResults(data);
        calculateStats(data);
      }
    } catch (error: any) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load quiz history");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: QuizResult[]) => {
    if (data.length === 0) {
      setStats({ totalQuizzes: 0, averageScore: 0, bestScore: 0, totalQuestions: 0 });
      return;
    }

    const totalQuizzes = data.length;
    const totalQuestions = data.reduce((sum, r) => sum + r.total_questions, 0);
    const averageScore = data.reduce((sum, r) => sum + r.score_percentage, 0) / totalQuizzes;
    const bestScore = Math.max(...data.map(r => r.score_percentage));

    setStats({ totalQuizzes, averageScore, bestScore, totalQuestions });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600 dark:text-green-400";
    if (percentage >= 70) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return "default";
    if (percentage >= 70) return "secondary";
    return "outline";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-12 space-y-6 md:space-y-8">
        {/* Page Title */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Quiz History</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Track your learning progress and review past quiz results
          </p>
        </div>

        {/* Stats Overview */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="p-4 md:p-6 rounded-xl border-2 border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-primary/10 rounded-lg">
                  <Trophy className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Quizzes</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.totalQuizzes}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 rounded-xl border-2 border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {stats.averageScore.toFixed(0)}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 rounded-xl border-2 border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-green-500/10 rounded-lg">
                  <Target className="h-4 w-4 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Best Score</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {stats.bestScore.toFixed(0)}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 rounded-xl border-2 border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-purple-500/10 rounded-lg">
                  <Calendar className="h-4 w-4 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Questions</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.totalQuestions}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Quiz Results List */}
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Recent Quizzes</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <Card className="p-8 md:p-12 rounded-xl border-2 border-dashed border-border text-center">
              <Trophy className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-base md:text-lg font-medium text-muted-foreground mb-2">No quiz history yet</p>
              <p className="text-sm text-muted-foreground">
                Complete a quiz to see your results here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <Card key={result.id} className="p-4 md:p-6 rounded-xl border-2 border-border hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left side - Topic and details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base md:text-lg font-semibold text-foreground">
                          {result.topic}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {result.mode}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                          <span>{format(new Date(result.completed_at), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 md:h-4 md:w-4" />
                          <span>
                            {result.time_taken_seconds 
                              ? `${Math.floor(result.time_taken_seconds / 60)}m ${result.time_taken_seconds % 60}s`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 md:h-4 md:w-4" />
                          <span>{result.total_questions} questions</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Score and Actions */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                      <div className="text-right">
                        <p className={`text-2xl md:text-3xl font-bold ${getScoreColor(result.score_percentage)}`}>
                          {result.score_percentage.toFixed(0)}%
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {result.correct_answers}/{result.total_questions} correct
                        </p>
                      </div>
                      <Badge 
                        variant={getScoreBadgeVariant(result.score_percentage)}
                        className="h-fit px-3 py-1 text-xs md:text-sm"
                      >
                        {result.score_percentage >= 90 ? "🏆 Excellent" : 
                         result.score_percentage >= 70 ? "👍 Good" :
                         result.score_percentage >= 50 ? "📚 Keep Going" : "💪 Try Again"}
                      </Badge>
                      <Button
                        onClick={() => handleTryAgain(result.topic, result.mode)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>FlashCard Agent - AI-Powered Learning © 2024</p>
        </div>
      </footer>
    </div>
  );
};

export default History;
