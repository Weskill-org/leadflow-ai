-- Debug verification script
DO $$
DECLARE
  v_role app_role;
  v_meta jsonb;
  v_extracted text;
BEGIN
  -- 1. Check if 'company' is a valid app_role
  BEGIN
    v_role := 'company'::app_role;
    RAISE NOTICE 'Step 1: app_role "company" is VALID';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Step 1: app_role "company" is INVALID. The enum type might be missing the value.';
  END;

  -- 2. Check metadata extraction logic
  v_meta := '{"role": "company"}'::jsonb;
  v_extracted := (v_meta ->> 'role');
  
  IF v_extracted = 'company' THEN
     RAISE NOTICE 'Step 2: JSON extraction works';
  ELSE
     RAISE EXCEPTION 'Step 2: JSON extraction FAILED';
  END IF;

  -- 3. Check casting logic from trigger
  BEGIN
    v_role := v_extracted::app_role;
    RAISE NOTICE 'Step 3: Trigger casting logic works';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Step 3: Trigger casting logic FAILED';
  END;

END $$;
