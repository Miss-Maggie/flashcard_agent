-- Create quiz_results table to store quiz history
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  mode TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  time_taken_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  questions_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all quiz results (public leaderboard style)
CREATE POLICY "Quiz results are viewable by everyone" 
ON public.quiz_results 
FOR SELECT 
USING (true);

-- Policy: Anyone can insert their own quiz results
CREATE POLICY "Anyone can insert quiz results" 
ON public.quiz_results 
FOR INSERT 
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_quiz_results_completed_at ON public.quiz_results(completed_at DESC);
CREATE INDEX idx_quiz_results_topic ON public.quiz_results(topic);
CREATE INDEX idx_quiz_results_score ON public.quiz_results(score_percentage DESC);