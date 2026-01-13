-- Fix function search_path warnings (excluding get_league_for_xp since leagues table doesn't exist)

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.user_stats (user_id)
  values (new.id);
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.handle_lead_source_from_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ca_name text;
BEGIN
  IF NEW.lg_link_id IS NOT NULL THEN
    IF NEW.ca_name IS NOT NULL THEN
      v_ca_name := NEW.ca_name;
    ELSE
      SELECT ca_name INTO v_ca_name
      FROM public.lg_links
      WHERE id = NEW.lg_link_id;
    END IF;
    IF v_ca_name IS NOT NULL THEN
      NEW.lead_source := 'CA (' || v_ca_name || ')';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || user_id_param::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Drop the broken get_league_for_xp function (leagues table doesn't exist)
DROP FUNCTION IF EXISTS public.get_league_for_xp(integer);