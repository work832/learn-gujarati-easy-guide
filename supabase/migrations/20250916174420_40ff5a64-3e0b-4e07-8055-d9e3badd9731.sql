-- Create app_usage_sessions table to track user time in app
CREATE TABLE public.app_usage_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE NULL,
  total_time_minutes INTEGER DEFAULT 0,
  page_visits JSONB DEFAULT '{}',
  activities_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_usage_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage sessions"
ON public.app_usage_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage sessions"
ON public.app_usage_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage sessions"
ON public.app_usage_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all usage sessions"
ON public.app_usage_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'teacher'
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_app_usage_sessions_updated_at
BEFORE UPDATE ON public.app_usage_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();