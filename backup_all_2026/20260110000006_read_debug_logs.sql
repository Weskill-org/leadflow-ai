-- Read debug logs
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '--- DEBUG LOGS START ---';
  FOR r IN SELECT * FROM public.debug_logs ORDER BY created_at DESC LIMIT 5 LOOP
    RAISE NOTICE 'Time: %, Message: %, Details: %', r.created_at, r.message, r.details;
  END LOOP;
  RAISE NOTICE '--- DEBUG LOGS END ---';
END $$;
