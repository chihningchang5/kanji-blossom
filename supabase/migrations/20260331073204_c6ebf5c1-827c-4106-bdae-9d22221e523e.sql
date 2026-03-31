
-- Add learned_at column
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS learned_at timestamptz DEFAULT NULL;

-- Backfill: set learned_at for already-learned words
UPDATE public.vocabulary SET learned_at = created_at WHERE is_learned = true AND learned_at IS NULL;

-- Create trigger to auto-set learned_at when is_learned becomes true
CREATE OR REPLACE FUNCTION public.set_learned_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_learned = true AND (OLD.is_learned = false OR OLD.is_learned IS NULL) THEN
    NEW.learned_at = now();
  ELSIF NEW.is_learned = false THEN
    NEW.learned_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_learned_at
  BEFORE UPDATE ON public.vocabulary
  FOR EACH ROW
  EXECUTE FUNCTION public.set_learned_at();
