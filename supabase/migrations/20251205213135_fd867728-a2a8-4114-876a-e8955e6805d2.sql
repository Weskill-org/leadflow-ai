-- 1. Update is_in_hierarchy function to bypass for company/company_subadmin roles
CREATE OR REPLACE FUNCTION public.is_in_hierarchy(_manager_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_id UUID := _user_id;
  max_depth INTEGER := 15;
  depth INTEGER := 0;
  manager_role app_role;
BEGIN
  -- Company and Company SubAdmin can see everyone
  SELECT role INTO manager_role FROM public.user_roles WHERE user_id = _manager_id LIMIT 1;
  IF manager_role IN ('company', 'company_subadmin') THEN
    RETURN TRUE;
  END IF;

  IF _manager_id = _user_id THEN
    RETURN TRUE;
  END IF;
  
  WHILE current_id IS NOT NULL AND depth < max_depth LOOP
    SELECT manager_id INTO current_id
    FROM public.profiles
    WHERE id = current_id;
    
    IF current_id = _manager_id THEN
      RETURN TRUE;
    END IF;
    
    depth := depth + 1;
  END LOOP;
  
  RETURN FALSE;
END;
$$;

-- 2. Fix existing users without managers - assign them to the company admin
-- First find the company admin, then assign orphaned users to them
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the company admin user id
  SELECT ur.user_id INTO admin_id
  FROM public.user_roles ur
  WHERE ur.role = 'company'
  LIMIT 1;
  
  -- If we found an admin, update profiles without managers (except the admin themselves)
  IF admin_id IS NOT NULL THEN
    UPDATE public.profiles
    SET manager_id = admin_id
    WHERE manager_id IS NULL
      AND id != admin_id;
  END IF;
END $$;