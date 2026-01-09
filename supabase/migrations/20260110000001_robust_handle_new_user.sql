-- Make handle_new_user robust against auxiliary table failures
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
  -- 1. Check for explicit role in metadata
  v_explicit_role := (NEW.raw_user_meta_data ->> 'role');
  
  IF v_explicit_role IS NOT NULL THEN
    BEGIN
      v_role := v_explicit_role::app_role;
    EXCEPTION WHEN OTHERS THEN
      v_role := 'bde';
    END;
  ELSE
    v_role := 'bde'; 
  END IF;

  -- 2. Determine Manager and Company
  v_manager_id := (NEW.raw_user_meta_data ->> 'manager_id')::uuid;

  IF v_manager_id IS NOT NULL THEN
     SELECT company_id INTO v_company_id
     FROM public.profiles
     WHERE id = v_manager_id;
  
  ELSIF v_role = 'bde' THEN
    v_email_domain := split_part(NEW.email, '@', 2);
    
    SELECT id, admin_id INTO v_company_id, v_manager_id
    FROM public.companies
    WHERE custom_domain = v_email_domain
      AND is_active = true
      AND domain_status = 'active'
    LIMIT 1;
  END IF;

  -- 3. Create Profile (Critical - must succeed)
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

  -- 4. Assign Role (Critical - must succeed)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO UPDATE SET 
    role = EXCLUDED.role; 

  -- 5. Create Wallet (Auxiliary - should not block user creation)
  BEGIN
    INSERT INTO public.wallets (user_id, credits)
    VALUES (NEW.id, 250)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create wallet for user %: %', NEW.id, SQLERRM;
  END;

  -- 6. Create User Stats (Auxiliary - should not block user creation)
  BEGIN
    INSERT INTO public.user_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user stats for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
