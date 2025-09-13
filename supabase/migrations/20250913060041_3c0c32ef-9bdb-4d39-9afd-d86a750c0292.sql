-- Drop the problematic policy first
DROP POLICY IF EXISTS "Teachers can view all profiles" ON public.profiles;

-- Create a security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create the corrected policy using the security definer function
CREATE POLICY "Teachers can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'teacher');