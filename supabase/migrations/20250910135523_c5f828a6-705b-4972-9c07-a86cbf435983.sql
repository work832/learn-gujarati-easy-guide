-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('student', 'teacher');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  display_name TEXT,
  email TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table for organizing vocabulary
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vocabulary table for storing words and phrases
CREATE TABLE public.vocabulary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  english_word TEXT NOT NULL,
  gujarati_word TEXT NOT NULL,
  gujarati_transliteration TEXT, -- English letters representation
  audio_url TEXT,
  image_url TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  category_id UUID REFERENCES public.categories(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table for student progress
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES public.vocabulary(id) ON DELETE CASCADE,
  is_learned BOOLEAN DEFAULT FALSE,
  times_reviewed INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, vocabulary_id)
);

-- Create dialogues table for conversation practice
CREATE TABLE public.dialogues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scenario TEXT NOT NULL, -- context like "ordering food", "introducing yourself"
  dialogue_data JSONB NOT NULL, -- array of conversation turns
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create practice sessions table for tracking conversation practice
CREATE TABLE public.practice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dialogue_id UUID NOT NULL REFERENCES public.dialogues(id) ON DELETE CASCADE,
  score INTEGER,
  feedback JSONB, -- detailed feedback for each response
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table for gamification
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_required INTEGER DEFAULT 0,
  badge_type TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create quizzes table for games and assessments
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT NOT NULL, -- matching, fill-blanks, speed-challenge
  questions JSONB NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  time_limit INTEGER, -- in seconds
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  time_taken INTEGER, -- in seconds
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create culture content table for culture corner
CREATE TABLE public.culture_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- proverb, festival, food, tradition
  content TEXT NOT NULL,
  gujarati_text TEXT,
  english_translation TEXT,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.culture_content ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for vocabulary (readable by all, editable by teachers)
CREATE POLICY "Everyone can view vocabulary" ON public.vocabulary
  FOR SELECT USING (true);

CREATE POLICY "Teachers can create vocabulary" ON public.vocabulary
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update vocabulary" ON public.vocabulary
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );

-- Create policies for flashcards (users can only see/modify their own)
CREATE POLICY "Users can view their own flashcards" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards" ON public.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for categories
CREATE POLICY "Everyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Teachers can create categories" ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );

-- Create policies for dialogues
CREATE POLICY "Everyone can view dialogues" ON public.dialogues
  FOR SELECT USING (true);

CREATE POLICY "Teachers can create dialogues" ON public.dialogues
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );

-- Create policies for practice sessions
CREATE POLICY "Users can view their own practice sessions" ON public.practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own practice sessions" ON public.practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for achievements and user achievements
CREATE POLICY "Everyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for quizzes
CREATE POLICY "Everyone can view quizzes" ON public.quizzes
  FOR SELECT USING (true);

CREATE POLICY "Teachers can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );

-- Create policies for quiz attempts
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for culture content
CREATE POLICY "Everyone can view culture content" ON public.culture_content
  FOR SELECT USING (true);

CREATE POLICY "Teachers can create culture content" ON public.culture_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vocabulary_updated_at
  BEFORE UPDATE ON public.vocabulary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some default categories
INSERT INTO public.categories (name, description) VALUES 
  ('Basic Greetings', 'Common greetings and polite expressions'),
  ('Family', 'Family members and relationships'),
  ('Food & Drinks', 'Common foods, drinks, and dining terms'),
  ('Numbers', 'Numbers from 1-100'),
  ('Colors', 'Basic color names'),
  ('Body Parts', 'Parts of the human body'),
  ('Daily Activities', 'Common daily activities and verbs'),
  ('Weather', 'Weather conditions and seasons'),
  ('Transportation', 'Modes of transport and travel'),
  ('Shopping', 'Shopping and marketplace terms');

-- Insert some default achievements
INSERT INTO public.achievements (name, description, icon, points_required, badge_type) VALUES
  ('First Steps', 'Complete your first flashcard session', '🌟', 0, 'bronze'),
  ('Word Explorer', 'Learn 10 new vocabulary words', '📚', 100, 'bronze'),
  ('Conversation Starter', 'Complete your first dialogue practice', '💬', 50, 'bronze'),
  ('Quiz Master', 'Score 100% on any quiz', '🏆', 200, 'silver'),
  ('Dedicated Student', 'Practice for 7 consecutive days', '📅', 500, 'gold'),
  ('Vocabulary Champion', 'Learn 100 vocabulary words', '👑', 1000, 'gold'),
  ('Culture Explorer', 'Read 10 culture corner articles', '🎭', 300, 'silver'),
  ('Speed Demon', 'Complete a speed challenge under 30 seconds', '⚡', 150, 'silver');