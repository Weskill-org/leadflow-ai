-- Migration to keep companies.used_licenses in sync with profiles count

-- 0. Drop the constraint that prevents accurate counting if over-limit
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS used_not_exceed_total;


-- 1. Create the sync function
CREATE OR REPLACE FUNCTION public.sync_company_licenses_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
BEGIN
  -- Handle INSERT or UPDATE where company_id is NEW
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.company_id IS NOT NULL THEN
    _company_id := NEW.company_id;
    
    -- Update the count for the new company
    UPDATE public.companies
    SET used_licenses = (
      SELECT count(*)
      FROM public.profiles
      WHERE company_id = _company_id
    ),
    updated_at = now()
    WHERE id = _company_id;
  END IF;

  -- Handle DELETE or UPDATE where company_id was OLD
  -- Check if it's an UPDATE and company_id actually changed, or if it's a DELETE
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.company_id IS DISTINCT FROM NEW.company_id)) AND OLD.company_id IS NOT NULL THEN
    _company_id := OLD.company_id;
    
    -- Update the count for the old company
    UPDATE public.companies
    SET used_licenses = (
      SELECT count(*)
      FROM public.profiles
      WHERE company_id = _company_id
    ),
    updated_at = now()
    WHERE id = _company_id;
  END IF;

  RETURN NULL;
END;
$$;

-- 2. Create the trigger on profiles
DROP TRIGGER IF EXISTS on_profile_company_change ON public.profiles;

CREATE TRIGGER on_profile_company_change
  AFTER INSERT OR UPDATE OF company_id OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_company_licenses_count();

-- 3. Run a one-time sync for all existing companies to fix incorrect data
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.companies LOOP
    UPDATE public.companies
    SET used_licenses = (
      SELECT count(*)
      FROM public.profiles
      WHERE company_id = r.id
    )
    WHERE id = r.id;
  END LOOP;
END;
$$;
