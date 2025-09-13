-- Add RLS policy to allow teachers to view all profiles
CREATE POLICY "Teachers can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles teacher_profile 
    WHERE teacher_profile.user_id = auth.uid() 
    AND teacher_profile.role = 'teacher'
  )
);