-- Investigation script
DO $$
DECLARE
  v_count integer;
BEGIN
  -- 1. Check if 'company_id' column exists in 'profiles'
  SELECT count(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'company_id';
    
  IF v_count = 0 THEN
    RAISE EXCEPTION 'CRITICAL: company_id column MISSING from profiles table!';
  ELSE
    RAISE NOTICE 'CHECK: company_id column exists.';
  END IF;

  -- 2. Check triggers on auth.users
  RAISE NOTICE 'Listing triggers on auth.users:';
  FOR v_count IN 
    SELECT count(*) FROM information_schema.triggers 
    WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth'
  LOOP
    RAISE NOTICE 'Found % triggers', v_count;
  END LOOP;
  
  -- 3. Check for specific triggers
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN
     RAISE NOTICE 'CHECK: on_auth_user_created trigger exists.';
  ELSE
     RAISE EXCEPTION 'CRITICAL: on_auth_user_created trigger user MISSING!';
  END IF;

END $$;
