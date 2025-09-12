-- Create notes table for teachers to upload class notes
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view notes" 
ON public.notes 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers can create notes" 
ON public.notes 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'teacher'
));

CREATE POLICY "Teachers can update their own notes" 
ON public.notes 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Teachers can delete their own notes" 
ON public.notes 
FOR DELETE 
USING (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for note images
INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', true);

-- Create storage policies for notes
CREATE POLICY "Note images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'notes');

CREATE POLICY "Teachers can upload note images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'notes' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'teacher'
));

CREATE POLICY "Teachers can update their own note images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'notes' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'teacher'
));

CREATE POLICY "Teachers can delete their own note images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'notes' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'teacher'
));