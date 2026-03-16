
CREATE TABLE public.vocabulary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  reading TEXT NOT NULL,
  translation TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('N1', 'N2', 'N3', 'N4', 'N5')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vocabulary" ON public.vocabulary FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vocabulary" ON public.vocabulary FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vocabulary" ON public.vocabulary FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete vocabulary" ON public.vocabulary FOR DELETE USING (true);
