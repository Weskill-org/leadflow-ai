-- Create programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL, -- Price in INR
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (Read)
-- All authenticated users can view programs
CREATE POLICY "Authenticated users can view programs"
ON public.programs
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy for INSERT/UPDATE/DELETE (Write)
-- Only admins can manage programs (using company role for now)
CREATE POLICY "Admins can manage programs"
ON public.programs
FOR ALL
USING (
  has_role(auth.uid(), 'company'::app_role)
);

-- Seed data
INSERT INTO public.programs (name, price) VALUES
  ('WeTrain', 3999),
  ('WeXposure', 7999),
  ('We X IIT', 69000),
  ('WePlaceYou', 120000)
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price;
