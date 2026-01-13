-- Helper to get common columns between JSONB keys and Table Columns
-- (Actually, easiest way is to just get Table Columns and select those from the JSON)

-- Fixed Deduplicate Function (Dynamic Columns)
CREATE OR REPLACE FUNCTION public.deduplicate_leads(
  input_table_name text,
  attribute_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dup_record RECORD;
  v_merged_json jsonb;
  v_newest_id uuid;
  v_columns text[];
  v_update_sql text;
  v_col_list text;
  v_val_list text;
BEGIN
  -- Get list of columns for the table, excluding ID and computed columns if any
  SELECT array_agg(column_name::text)
  INTO v_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' 
  AND table_name = input_table_name
  AND column_name != 'id';

  -- Loop duplicates
  FOR v_dup_record IN EXECUTE format('
    SELECT %I as value, array_agg(id ORDER BY created_at DESC, id DESC) as ids
    FROM %I
    WHERE %I IS NOT NULL
    GROUP BY %I
    HAVING count(*) > 1
  ', attribute_name, input_table_name, attribute_name, attribute_name)
  LOOP
    v_newest_id := v_dup_record.ids[1];
    v_merged_json := '{}'::jsonb;
    
    -- Merge loop
    DECLARE
       v_row_json jsonb;
       v_id uuid;
    BEGIN
       FOR i IN REVERSE array_length(v_dup_record.ids, 1)..1 LOOP
          v_id := v_dup_record.ids[i];
          EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE id = %L', input_table_name, v_id) INTO v_row_json;
          v_merged_json := v_merged_json || jsonb_strip_nulls(v_row_json);
       END LOOP;
    END;

    v_merged_json := v_merged_json - 'id';
    
    -- Construct Dynamic UPDATE
    -- We use jsonb_populate_record with a cast to the table type, but to avoid "extra column" issues if json has more,
    -- or "missing column" if strict, we can construct the SET clause explicitly.
    -- Actually, jsonb_populate_record(null::table_type, json) works well even if json has extras (they are ignored)
    -- BUT it fails if the table type doesn't match the table (e.g. if we altered the table recently?) - No, usually it tracks.
    -- The previous error 'notes' does not exist happened because I listed 'notes' explicitly in the static SQL list.
    -- If we use jsonb_populate_record(null::input_table_name, ...), we need dynamic casting.
    
    -- Approach: "UPDATE tbl SET (c1, c2) = (select c1, c2 from jsonb_populate_record(null::tbl, val))" matches all cols.
    -- To be safe and truly dynamic:
    -- We will build "col1 = (v_merged_json->>'col1')::type, col2 = ..."
    -- But types are annoying.
    
    -- Better: "UPDATE tbl SET (col1, col2...) = (SELECT col1, col2... FROM jsonb_populate_record(null::tbl, $1))"
    -- We just need the list of columns to be correct.
    
    SELECT string_agg(quote_ident(c), ', ') INTO v_col_list FROM unnest(v_columns) c;
    
    v_update_sql := format(
      'UPDATE %I SET (%s) = (SELECT %s FROM jsonb_populate_record(null::public.%I, $1)) WHERE id = $2',
      input_table_name, v_col_list, v_col_list, input_table_name
    );
    
    EXECUTE v_update_sql USING v_merged_json, v_newest_id;

    -- Delete others
    EXECUTE format('DELETE FROM %I WHERE id = ANY($1::uuid[]) AND id != $2', input_table_name) 
    USING v_dup_record.ids, v_newest_id;
    
  END LOOP;
END;
$$;


-- Fixed Smart Merge Trigger (Dynamic Columns)
CREATE OR REPLACE FUNCTION public.smart_merge_lead_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id uuid;
  v_unique_constraints text[];
  v_constraint text;
  v_existing_id uuid;
  v_existing_record jsonb;
  v_new_record jsonb;
  v_merged_record jsonb;
  v_sql text;
  v_columns text[];
  v_col_list text;
BEGIN
  v_company_id := NEW.company_id;
  IF v_company_id IS NULL THEN RETURN NEW; END IF;

  SELECT unique_constraints INTO v_unique_constraints
  FROM public.companies WHERE id = v_company_id;

  IF v_unique_constraints IS NULL OR array_length(v_unique_constraints, 1) IS NULL THEN RETURN NEW; END IF;

  v_new_record := to_jsonb(NEW);

  FOREACH v_constraint IN ARRAY v_unique_constraints
  LOOP
    IF v_new_record->>v_constraint IS NULL THEN CONTINUE; END IF;

    v_sql := format('SELECT to_jsonb(t) FROM %I t WHERE %I = %L LIMIT 1', TG_TABLE_NAME, v_constraint, v_new_record->>v_constraint);
    EXECUTE v_sql INTO v_existing_record;

    IF v_existing_record IS NOT NULL THEN
       v_existing_id := (v_existing_record->>'id')::uuid;
       v_merged_record := v_existing_record || jsonb_strip_nulls(v_new_record);
       
       -- Force timestamps using string JSON to ensure override
       -- Actually, jsonb_build_object is safer.
       v_merged_record := v_merged_record || jsonb_build_object('created_at', NOW(), 'updated_at', NOW());
       v_merged_record := v_merged_record - 'id';

       -- Get dynamic columns for this table
       SELECT array_agg(column_name::text) INTO v_columns
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = TG_TABLE_NAME AND column_name != 'id';

       SELECT string_agg(quote_ident(c), ', ') INTO v_col_list FROM unnest(v_columns) c;

       v_sql := format(
         'UPDATE %I SET (%s) = (SELECT %s FROM jsonb_populate_record(null::public.%I, $1)) WHERE id = $2',
         TG_TABLE_NAME, v_col_list, v_col_list, TG_TABLE_NAME
       );

       EXECUTE v_sql USING v_merged_record, v_existing_id;
       
       RETURN NULL; -- Cancel Insert
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;


-- RPC: Add Lead Attribute
CREATE OR REPLACE FUNCTION public.add_lead_attribute(
  input_company_id uuid,
  attribute_name text,
  attribute_type text DEFAULT 'text'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table_name text;
BEGIN
  -- Auth
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = input_company_id AND admin_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  SELECT custom_leads_table INTO v_table_name FROM public.companies WHERE id = input_company_id;
  IF v_table_name IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Custom table not enabled'); END IF;

  -- Verify type safety (basic whitelist)
  IF attribute_type NOT IN ('text', 'integer', 'boolean', 'date', 'numeric') THEN
     RETURN jsonb_build_object('success', false, 'message', 'Invalid type. Allowed: text, integer, boolean, date, numeric');
  END IF;

  -- Add Column
  BEGIN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I %s', v_table_name, attribute_name, attribute_type);
    RETURN jsonb_build_object('success', true, 'message', 'Attribute added successfully');
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
  END;
END;
$$;


-- RPC: Remove Lead Attribute
CREATE OR REPLACE FUNCTION public.remove_lead_attribute(
  input_company_id uuid,
  attribute_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table_name text;
  v_is_system boolean;
BEGIN
  -- Auth
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = input_company_id AND admin_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  SELECT custom_leads_table INTO v_table_name FROM public.companies WHERE id = input_company_id;
  IF v_table_name IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Custom table not enabled'); END IF;

  -- Prevent deleting system columns (basic check against leads schema or common sense)
  IF attribute_name IN ('id', 'created_at', 'updated_at', 'company_id', 'created_by_id', 'name', 'email', 'phone', 'status') THEN
     RETURN jsonb_build_object('success', false, 'message', 'Cannot delete system attribute');
  END IF;

  -- Drop Column
  BEGIN
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS %I', v_table_name, attribute_name);
    
    -- Also remove from unique_constraints if present
    UPDATE public.companies 
    SET unique_constraints = array_remove(unique_constraints, attribute_name)
    WHERE id = input_company_id;

    RETURN jsonb_build_object('success', true, 'message', 'Attribute removed successfully');
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
  END;
END;
$$;


-- RPC: Get Company Lead Columns
CREATE OR REPLACE FUNCTION public.get_company_lead_columns(
  input_company_id uuid
)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table_name text;
BEGIN
  -- Auth check mainly to ensure user belongs to company or is admin? 
  -- Loosely allow company members to see schema? Let's restrict to admin for now or check hierarchy.
  -- For settings page, admin is fine.
  
  -- Assuming caller verifies general access, but let's be safe.
  -- Simpler: Just get the table name if user has access.
  SELECT custom_leads_table INTO v_table_name FROM public.companies WHERE id = input_company_id;
  
  -- Fallback to 'leads' if not custom?
  IF v_table_name IS NULL THEN 
     v_table_name := 'leads'; 
  END IF;

  RETURN QUERY
  SELECT c.column_name::text, c.data_type::text, c.is_nullable::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name = v_table_name
  ORDER BY c.ordinal_position;
END;
$$;
