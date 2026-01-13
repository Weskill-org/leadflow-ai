-- 1. Update is_in_hierarchy to enforce company isolation
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
  manager_company_id UUID;
  user_company_id UUID;
BEGIN
  -- Get Company IDs for both users
  SELECT company_id INTO manager_company_id FROM public.profiles WHERE id = _manager_id;
  SELECT company_id INTO user_company_id FROM public.profiles WHERE id = _user_id;

  -- If companies don't match (and neither is NULL/Global), they can't be in hierarchy
  -- Assuming NULL company might mean system level or error, but explicit matching is safest for multi-tenant
  IF manager_company_id IS DISTINCT FROM user_company_id THEN
    RETURN FALSE;
  END IF;

  -- Company and Company SubAdmin can see everyone IN THEIR COMPANY
  SELECT role INTO manager_role FROM public.user_roles WHERE user_id = _manager_id LIMIT 1;
  IF manager_role IN ('company', 'company_subadmin') THEN
    RETURN TRUE;
  END IF;

  IF _manager_id = _user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Standard Hierarchy Check
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

-- 2. Update Leads RLS to strictly enforce company isolation
-- We need to ensure we use the correct company column. Based on types, it is 'company'

DROP POLICY IF EXISTS "Users can view their own leads and subordinates' leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads and subordinates' leads" ON leads;

-- Read Policy
CREATE POLICY "Users can view their own leads and subordinates' leads"
ON leads
FOR SELECT
USING (
  -- MUST belong to same company
  company = (SELECT company_id FROM public.profiles WHERE id = auth.uid())::text
  AND
  (
    -- Is Sales Owner
    auth.uid() = sales_owner_id 
    OR 
    -- Is in hierarchy (Manager/Admin)
    -- Note: Since we fixed is_in_hierarchy to check company, implies safety, 
    -- but we added the explicit company check above as double enforcement.
    -- For admins, is_in_hierarchy returns true for anyone in company.
    -- BUT if sales_owner_id is NULL (unassigned lead), straight hierarchy check might fail if we pass NULL.
    -- So we handle unassigned leads for Admins explicitly if needed, 
    -- OR we rely on is_in_hierarchy handling NULL? No, it takes UUID.
    
    -- Case: Lead is unassigned (sales_owner_id IS NULL)
    (
        sales_owner_id IS NULL 
        AND 
        (
            has_role(auth.uid(), 'company') 
            OR 
            has_role(auth.uid(), 'company_subadmin')
        )
    )
    OR
    -- Case: Lead is assigned
    (
        sales_owner_id IS NOT NULL
        AND
        is_in_hierarchy(auth.uid(), sales_owner_id)
    )
  )
);

-- Update Policy
CREATE POLICY "Users can update their own leads and subordinates' leads"
ON leads
FOR UPDATE
USING (
  company = (SELECT company_id FROM public.profiles WHERE id = auth.uid())::text
  AND
  (
    (
        sales_owner_id IS NULL 
        AND 
        (
            has_role(auth.uid(), 'company') 
            OR 
            has_role(auth.uid(), 'company_subadmin')
        )
    )
    OR
    (
        sales_owner_id IS NOT NULL
        AND
        is_in_hierarchy(auth.uid(), sales_owner_id)
    )
  )
);
