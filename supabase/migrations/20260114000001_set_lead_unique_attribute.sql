-- Function to toggle unique constraint on email or phone for custom leads tables
CREATE OR REPLACE FUNCTION public.toggle_lead_unique_constraint(
  input_company_id uuid,
  attribute_name text,
  is_unique boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_slug text;
  v_table_name text;
  v_constraint_name text;
  v_current_user_id uuid;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();

  -- Verify User is Company Admin of the input company
  IF NOT EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = input_company_id 
    AND admin_id = v_current_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Only Company Admin can manage constraints');
  END IF;

  -- Validate Attribute Name
  IF attribute_name NOT IN ('email', 'phone') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid attribute: Must be email or phone');
  END IF;

  -- Get Custom Table Name
  SELECT custom_leads_table INTO v_table_name
  FROM public.companies
  WHERE id = input_company_id;

  IF v_table_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Feature not unlocked: No custom table found');
  END IF;

  v_constraint_name := 'leads_unique_' || attribute_name;

  IF is_unique THEN
    -- ADD Constraint
    -- Check if data violates unique constraint first? 
    -- Postgres will error if duplicates exist. We wrap in exception block.
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (%I)', v_table_name, v_constraint_name, attribute_name);
      RETURN jsonb_build_object('success', true, 'message', 'Unique constraint added');
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
       RETURN jsonb_build_object('success', true, 'message', 'Constraint already exists');
    WHEN unique_violation THEN
       RETURN jsonb_build_object('success', false, 'message', 'Cannot enable unique constraint: Duplicate values exist in the table.');
    WHEN OTHERS THEN
       RETURN jsonb_build_object('success', false, 'message', SQLERRM);
    END;
  ELSE
    -- DROP Constraint
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', v_table_name, v_constraint_name);
    RETURN jsonb_build_object('success', true, 'message', 'Unique constraint removed');
  END IF;

END;
$$;

-- Function to get current unique constraints
CREATE OR REPLACE FUNCTION public.get_lead_unique_constraints(
  input_company_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table_name text;
  v_constraints jsonb;
BEGIN
  -- Verify User
  IF NOT EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = input_company_id 
    AND admin_id = auth.uid()
  ) THEN
     RETURN '[]'::jsonb;
  END IF;

  SELECT custom_leads_table INTO v_table_name
  FROM public.companies
  WHERE id = input_company_id;

  IF v_table_name IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(column_name)
  INTO v_constraints
  FROM information_schema.table_constraints tc 
  JOIN information_schema.constraint_column_usage ccu 
  USING (constraint_schema, constraint_name) 
  WHERE constraint_type = 'UNIQUE' 
  AND tc.table_schema = 'public'
  AND tc.table_name = v_table_name;

  RETURN COALESCE(v_constraints, '[]'::jsonb);
END;
$$;
