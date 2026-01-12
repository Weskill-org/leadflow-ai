DROP POLICY IF EXISTS "Public can read company by slug for subdomain resolution" ON public.companies;

CREATE POLICY "Public can read company by slug for subdomain resolution"
ON public.companies
FOR SELECT
USING (true);