-- Fix deduplicate_leads function syntax error
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
BEGIN
  -- Loop through groups having duplicates
  FOR v_dup_record IN EXECUTE format('
    SELECT %I as value, array_agg(id ORDER BY created_at DESC, id DESC) as ids
    FROM %I
    WHERE %I IS NOT NULL
    GROUP BY %I
    HAVING count(*) > 1
  ', attribute_name, input_table_name, attribute_name, attribute_name)
  LOOP
    -- ids[1] is newest because ORDER BY created_at DESC
    v_newest_id := v_dup_record.ids[1];
    
    -- Merge logic: Iterate from Oldest (last) to Newest (first)
    -- Start with empty object
    v_merged_json := '{}'::jsonb;
    
    DECLARE
       v_row_json jsonb;
       v_id uuid;
    BEGIN
       -- Iterate backwards (Oldest first)
       FOR i IN REVERSE array_length(v_dup_record.ids, 1)..1 LOOP
          v_id := v_dup_record.ids[i];
          EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE id = %L', input_table_name, v_id) INTO v_row_json;
          -- Merge: Accumulate non-nulls. 
          v_merged_json := v_merged_json || jsonb_strip_nulls(v_row_json);
       END LOOP;
    END;

    -- Update the newest row with valid data (excluding ID)
    v_merged_json := v_merged_json - 'id';
    
    -- Update logic
    EXECUTE format('UPDATE %I SET (created_at, updated_at, name, email, phone, college, status, sales_owner_id, lead_source, notes, next_follow_up, custom_data, lead_score) = 
      (SELECT created_at, updated_at, name, email, phone, college, status, sales_owner_id, lead_source, notes, next_follow_up, custom_data, lead_score
       FROM jsonb_populate_record(null::public.leads, %L)) WHERE id = %L', input_table_name, v_merged_json, v_newest_id);

    -- Delete the others
    -- FIX: added cast to uuid[] for the array in ANY clause
    EXECUTE format('DELETE FROM %I WHERE id = ANY(%L::uuid[]) AND id != %L', input_table_name, v_dup_record.ids, v_newest_id);
    
  END LOOP;
END;
$$;
