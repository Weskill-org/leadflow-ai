-- Add granular error reporting to handle_new_user
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
  -- 1. Check for explicit role
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

  -- 3. Create Profile (Debug wrapped)
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create profile for %: %', NEW.email, SQLERRM;
  END;

  -- 4. Assign Role (Debug wrapped)
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id) DO UPDATE SET 
      role = EXCLUDED.role; 
  EXCEPTION WHEN OTHERS THEN
     RAISE EXCEPTION 'Failed to assign role % to %: %', v_role, NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
