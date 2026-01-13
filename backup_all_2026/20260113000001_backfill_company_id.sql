-- Backfill existing leads with specific company_id
UPDATE "public"."leads"
SET "company_id" = '06d5c053-c04c-4d08-905f-ce7f669e8da3'
WHERE "company_id" IS NULL;
