-- Create domain_verification table to persist Vercel TXT records
CREATE TABLE IF NOT EXISTS public.domain_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  txt_record_name TEXT NOT NULL,
  txt_record_value TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, domain)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_domain_verification_company ON public.domain_verification(company_id);
CREATE INDEX IF NOT EXISTS idx_domain_verification_domain ON public.domain_verification(domain);

-- Enable RLS
ALTER TABLE public.domain_verification ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view verification records for their own company
DROP POLICY IF EXISTS "Users can view their company's domain verification" ON public.domain_verification;
CREATE POLICY "Users can view their company's domain verification"
  ON public.domain_verification
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Only company admins can insert/update verification records
DROP POLICY IF EXISTS "Company admins can manage domain verification" ON public.domain_verification;
CREATE POLICY "Company admins can manage domain verification"
  ON public.domain_verification
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE admin_id = auth.uid()
    )
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_domain_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS domain_verification_updated_at ON public.domain_verification;
CREATE TRIGGER domain_verification_updated_at
  BEFORE UPDATE ON public.domain_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_domain_verification_updated_at();
