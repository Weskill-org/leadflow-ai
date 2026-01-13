-- Create the default Weskill company with admin@weskill.org as admin
DO $$
DECLARE
  v_admin_id uuid;
  v_company_id uuid;
BEGIN
  -- Get the user ID for admin@weskill.org
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@weskill.org'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'User admin@weskill.org not found';
  END IF;

  -- Create the Weskill company
  INSERT INTO public.companies (name, slug, admin_id, total_licenses, used_licenses, is_active)
  VALUES ('Weskill', 'weskill', v_admin_id, 1000, 1, true)
  RETURNING id INTO v_company_id;

  -- Update all existing profiles to belong to Weskill company
  UPDATE public.profiles
  SET company_id = v_company_id
  WHERE company_id IS NULL;

  -- Update used_licenses count based on actual profiles
  UPDATE public.companies
  SET used_licenses = (
    SELECT COUNT(*) FROM public.profiles WHERE company_id = v_company_id
  )
  WHERE id = v_company_id;

END $$;