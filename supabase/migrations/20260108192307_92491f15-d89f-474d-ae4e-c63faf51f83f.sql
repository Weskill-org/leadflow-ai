-- Drop the problematic trigger first (correct name)
DROP TRIGGER IF EXISTS on_email_verified ON auth.users;

-- Now drop the function
DROP FUNCTION IF EXISTS public.handle_email_verification();

-- Drop the referral_codes table since it's not needed
DROP TABLE IF EXISTS public.referral_codes;

-- Drop the unused generate_referral_code function
DROP FUNCTION IF EXISTS public.generate_referral_code(uuid);

-- Create a proper handle_new_user function that sets up profile with company and hierarchy
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manager_id uuid;
  v_company_id uuid;
BEGIN
  -- Get manager_id from user metadata (set during invite)
  v_manager_id := (NEW.raw_user_meta_data ->> 'manager_id')::uuid;
  
  -- Get company_id from manager's profile
  IF v_manager_id IS NOT NULL THEN
    SELECT company_id INTO v_company_id
    FROM public.profiles
    WHERE id = v_manager_id;
  END IF;

  -- Insert profile with full_name, email, manager_id, and company_id
  INSERT INTO public.profiles (id, full_name, email, manager_id, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    v_manager_id,
    v_company_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    manager_id = COALESCE(EXCLUDED.manager_id, profiles.manager_id),
    company_id = COALESCE(EXCLUDED.company_id, profiles.company_id);

  -- Insert default role (bde)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'bde')
  ON CONFLICT DO NOTHING;

  -- Create wallet for new user
  INSERT INTO public.wallets (user_id, credits)
  VALUES (NEW.id, 250)
  ON CONFLICT DO NOTHING;

  -- Create user stats
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();