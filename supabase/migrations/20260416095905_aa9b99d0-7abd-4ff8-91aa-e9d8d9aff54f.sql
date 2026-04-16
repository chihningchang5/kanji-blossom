-- Per-user learning progress table
CREATE TABLE public.user_word_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vocabulary_id UUID NOT NULL REFERENCES public.vocabulary(id) ON DELETE CASCADE,
  is_learned BOOLEAN NOT NULL DEFAULT false,
  learned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, vocabulary_id)
);

-- Enable RLS
ALTER TABLE public.user_word_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users can view own progress"
ON public.user_word_progress FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
ON public.user_word_progress FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
ON public.user_word_progress FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own progress
CREATE POLICY "Users can delete own progress"
ON public.user_word_progress FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Trigger: auto-set learned_at when is_learned changes
CREATE OR REPLACE FUNCTION public.set_progress_learned_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_learned = true AND (OLD IS NULL OR OLD.is_learned = false) THEN
    NEW.learned_at = now();
  ELSIF NEW.is_learned = false THEN
    NEW.learned_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_progress_learned_at
BEFORE INSERT OR UPDATE ON public.user_word_progress
FOR EACH ROW
EXECUTE FUNCTION public.set_progress_learned_at();
