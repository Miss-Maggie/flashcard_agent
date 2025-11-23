-- Create flashcards table
CREATE TABLE public.flashcards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  topic text NOT NULL,
  mode text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own flashcards"
ON public.flashcards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards"
ON public.flashcards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
ON public.flashcards
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
ON public.flashcards
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_flashcards_user_topic ON public.flashcards(user_id, topic, created_at DESC);