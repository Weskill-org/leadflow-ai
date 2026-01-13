-- Fix regression: 'company' column in leads table is a string (prospect company name), not a UUID (tenant ID).
-- We remove the check against 'company' column and rely on is_in_hierarchy which now strictly enforces company isolation.

DROP POLICY IF EXISTS "Users can view their own leads and subordinates' leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads and subordinates' leads" ON leads;

-- Read Policy
CREATE POLICY "Users can view their own leads and subordinates' leads"
ON leads
FOR SELECT
USING (
  is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
);

-- Update Policy
CREATE POLICY "Users can update their own leads and subordinates' leads"
ON leads
FOR UPDATE
USING (
  is_in_hierarchy(auth.uid(), COALESCE(sales_owner_id, created_by_id))
);
