/*
  # Gujarati Setu Platform Structure Update

  1. New Tables
    - `word_bank` - For synonyms, antonyms, and idioms
    - `basic_learning` - For alphabets, numbers, and basic words
    - `interactive_games` - For match-the-following and fill-in-the-blanks games
    - `game_attempts` - Track student attempts on interactive games
    - `learning_progress` - Track words learned by students

  2. Security
    - Enable RLS on all new tables
    - Add policies for teachers to create content and students to access
    - Add policies for tracking student progress

  3. Changes
    - Enhanced word tracking system
    - Support for different content types (synonyms, antonyms, idioms)
    - Interactive game framework
    - Progress tracking for words learned
*/

-- Create word_bank table for synonyms, antonyms, and idioms
CREATE TABLE IF NOT EXISTS public.word_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_type TEXT NOT NULL CHECK (word_type IN ('synonym', 'antonym', 'idiom')),
  gujarati_word TEXT NOT NULL,
  english_word TEXT NOT NULL,
  gujarati_meaning TEXT,
  english_meaning TEXT,
  example_sentence_gujarati TEXT,
  example_sentence_english TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create basic_learning table for alphabets, numbers, and basic words
CREATE TABLE IF NOT EXISTS public.basic_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('alphabet', 'number', 'basic_word')),
  english_content TEXT NOT NULL,
  gujarati_content TEXT NOT NULL,
  transliteration TEXT,
  audio_url TEXT,
  image_url TEXT,
  order_sequence INTEGER,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create interactive_games table for match-the-following and fill-in-the-blanks
CREATE TABLE IF NOT EXISTS public.interactive_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  game_type TEXT NOT NULL CHECK (game_type IN ('match_following', 'fill_blanks', 'word_puzzle')),
  game_data JSONB NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  time_limit INTEGER DEFAULT 300, -- 5 minutes default
  max_score INTEGER DEFAULT 100,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create game_attempts table to track student performance
CREATE TABLE IF NOT EXISTS public.game_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.interactive_games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL,
  time_taken INTEGER, -- in seconds
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create learning_progress table to track words learned
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('vocabulary', 'word_bank', 'basic_learning')),
  content_id UUID NOT NULL,
  is_learned BOOLEAN DEFAULT false,
  times_reviewed INTEGER DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  learned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.word_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basic_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactive_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

-- Policies for word_bank
CREATE POLICY "Everyone can view word bank"
ON public.word_bank
FOR SELECT
USING (true);

CREATE POLICY "Teachers can create word bank entries"
ON public.word_bank
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can update word bank entries"
ON public.word_bank
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can delete word bank entries"
ON public.word_bank
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Policies for basic_learning
CREATE POLICY "Everyone can view basic learning content"
ON public.basic_learning
FOR SELECT
USING (true);

CREATE POLICY "Teachers can create basic learning content"
ON public.basic_learning
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can update basic learning content"
ON public.basic_learning
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can delete basic learning content"
ON public.basic_learning
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Policies for interactive_games
CREATE POLICY "Everyone can view interactive games"
ON public.interactive_games
FOR SELECT
USING (true);

CREATE POLICY "Teachers can create interactive games"
ON public.interactive_games
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can update interactive games"
ON public.interactive_games
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can delete interactive games"
ON public.interactive_games
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Policies for game_attempts
CREATE POLICY "Users can view their own game attempts"
ON public.game_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game attempts"
ON public.game_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can view all game attempts"
ON public.game_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Policies for learning_progress
CREATE POLICY "Users can view their own learning progress"
ON public.learning_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learning progress"
ON public.learning_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning progress"
ON public.learning_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all learning progress"
ON public.learning_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_word_bank_updated_at
  BEFORE UPDATE ON public.word_bank
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_basic_learning_updated_at
  BEFORE UPDATE ON public.basic_learning
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interactive_games_updated_at
  BEFORE UPDATE ON public.interactive_games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at
  BEFORE UPDATE ON public.learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update words learned count
CREATE OR REPLACE FUNCTION public.update_words_learned_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile points when a word is learned
  IF NEW.is_learned = true AND (OLD.is_learned IS NULL OR OLD.is_learned = false) THEN
    UPDATE public.profiles 
    SET points = COALESCE(points, 0) + 5
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for learning progress updates
CREATE TRIGGER on_word_learned
  AFTER UPDATE ON public.learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_words_learned_count();