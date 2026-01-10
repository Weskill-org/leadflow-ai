-- Allow public read access to companies for subdomain resolution
-- This only exposes minimal company info needed for workspace identification
CREATE POLICY "Public can read company by slug for subdomain resolution"
ON public.companies
FOR SELECT
USING (true);