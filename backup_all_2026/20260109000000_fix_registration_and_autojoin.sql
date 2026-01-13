-- Migration to fix registration role and implement domain-based auto-join

-- Drop existing trigger to safely replace function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the handler function with new logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manager_id uuid;
  v_company_id uuid;
  v_role app_role;
  v_email_domain text;
  v_explicit_role text;
BEGIN
  -- 1. Check for explicit role in metadata (e.g. 'company' from register-company)
  v_explicit_role := (NEW.raw_user_meta_data ->> 'role');
  
  IF v_explicit_role IS NOT NULL THEN
    -- Try to cast to app_role, default to 'bde' if invalid
    BEGIN
      v_role := v_explicit_role::app_role;
    EXCEPTION WHEN OTHERS THEN
      v_role := 'bde';
    END;
  ELSE
    v_role := 'bde'; -- Default role
  END IF;

  -- 2. Determine Manager and Company
  -- Priority 1: Manager ID from metadata (Invite link)
  v_manager_id := (NEW.raw_user_meta_data ->> 'manager_id')::uuid;

  IF v_manager_id IS NOT NULL THEN
     -- Propagate company from manager
     SELECT company_id INTO v_company_id
     FROM public.profiles
     WHERE id = v_manager_id;
  
  -- Priority 2: Auto-join by Email Domain (Only if no explicit manager AND role is 'bde')
  ELSIF v_role = 'bde' THEN
    -- Extract domain from email
    v_email_domain := split_part(NEW.email, '@', 2);
    
    -- Look for company with matching custom domain
    SELECT id, admin_id INTO v_company_id, v_manager_id
    FROM public.companies
    WHERE custom_domain = v_email_domain
      AND is_active = true
      AND domain_status = 'active'
    LIMIT 1;
    
    -- If found, v_company_id and v_manager_id are set.
    -- If not found, they remain NULL.
  END IF;

  -- 3. Create Profile
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

  -- 4. Assign Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO UPDATE SET 
    role = EXCLUDED.role; 

  -- 5. Create Wallet (250 credits default)
  INSERT INTO public.wallets (user_id, credits)
  VALUES (NEW.id, 250)
  ON CONFLICT DO NOTHING;

  -- 6. Create User Stats
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Re-enable the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
