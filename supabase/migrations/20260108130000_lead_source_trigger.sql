-- Function to handle lead source setting based on lg_link_id
CREATE OR REPLACE FUNCTION public.handle_lead_source_from_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ca_name text;
BEGIN
  -- Only proceed if lg_link_id is present
  IF NEW.lg_link_id IS NOT NULL THEN
    -- Try to get CA name from the lead record if already set
    IF NEW.ca_name IS NOT NULL THEN
      v_ca_name := NEW.ca_name;
    ELSE
      -- Fetch from lg_links table if not in the new record
      SELECT ca_name INTO v_ca_name
      FROM public.lg_links
      WHERE id = NEW.lg_link_id;
    END IF;

    -- If we found a CA name, set the lead_source
    IF v_ca_name IS NOT NULL THEN
      NEW.lead_source := 'CA (' || v_ca_name || ')';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists to allow idempotent re-runs
DROP TRIGGER IF EXISTS set_lead_source_from_link ON public.leads;

-- Create trigger
CREATE TRIGGER set_lead_source_from_link
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lead_source_from_link();
