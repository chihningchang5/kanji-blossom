
ALTER TABLE public.vocabulary 
ADD COLUMN is_learned boolean NOT NULL DEFAULT false,
ADD COLUMN examples jsonb DEFAULT '[]'::jsonb;
