-- Add company_id column to leads table
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "company_id" uuid REFERENCES "public"."companies"("id");

-- Optional: Create an index for performance
CREATE INDEX IF NOT EXISTS "leads_company_id_idx" ON "public"."leads" ("company_id");
