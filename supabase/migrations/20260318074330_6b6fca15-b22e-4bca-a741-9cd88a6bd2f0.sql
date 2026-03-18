
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Create user_roles table (roles in separate table per security guidelines)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile and assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id and is_public to vocabulary
ALTER TABLE public.vocabulary
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true;

-- Update RLS on vocabulary: drop old permissive policies, create new ones
DROP POLICY IF EXISTS "Anyone can read vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Anyone can insert vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Anyone can update vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Anyone can delete vocabulary" ON public.vocabulary;

-- Read: public words OR own words
CREATE POLICY "Users can read public or own vocabulary" ON public.vocabulary
  FOR SELECT TO authenticated
  USING (is_public = true OR user_id = auth.uid());

-- Insert: admins can insert public, users insert own
CREATE POLICY "Users can insert own vocabulary" ON public.vocabulary
  FOR INSERT TO authenticated
  WITH CHECK (
    (is_public = false AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Update: admins can update public, users can update own
CREATE POLICY "Users can update own or admin public" ON public.vocabulary
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Delete: only admins can delete public, users delete own
CREATE POLICY "Users can delete own or admin public" ON public.vocabulary
  FOR DELETE TO authenticated
  USING (
    (user_id = auth.uid() AND is_public = false)
    OR public.has_role(auth.uid(), 'admin')
  );
