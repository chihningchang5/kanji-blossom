
CREATE OR REPLACE FUNCTION public.set_learned_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
