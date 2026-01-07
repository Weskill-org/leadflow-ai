-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency (including old names)
DROP POLICY IF EXISTS "Users can view their own leads and subordinates' leads" ON leads;
DROP POLICY IF EXISTS "Users can create leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads and subordinates' leads" ON leads;
DROP POLICY IF EXISTS "Users can delete their own leads and subordinates' leads" ON leads;
DROP POLICY IF EXISTS "Only Super Admin can delete leads" ON leads;
-- Drop policies from previous migrations
DROP POLICY IF EXISTS "Users can view leads they created" ON leads;
DROP POLICY IF EXISTS "Users can view leads they own" ON leads;
DROP POLICY IF EXISTS "Users can view leads from hierarchy" ON leads;
DROP POLICY IF EXISTS "Users can update their leads" ON leads;

-- Policy for SELECT (Read)
-- Users can see leads they own OR leads owned by someone below them in hierarchy
CREATE POLICY "Users can view their own leads and subordinates' leads"
ON leads
FOR SELECT
USING (
  auth.uid() = sales_owner_id 
  OR 
  is_in_hierarchy(auth.uid(), sales_owner_id)
);

-- Policy for INSERT (Create)
-- Authenticated users can create leads
CREATE POLICY "Users can create leads"
ON leads
FOR INSERT
WITH CHECK (
  auth.uid() = created_by_id
);

-- Policy for UPDATE
-- Users can update leads they own OR leads owned by someone below them in hierarchy
CREATE POLICY "Users can update their own leads and subordinates' leads"
ON leads
FOR UPDATE
USING (
  auth.uid() = sales_owner_id 
  OR 
  is_in_hierarchy(auth.uid(), sales_owner_id)
);

-- Policy for DELETE
-- Only Super Admin (company role) can delete leads
CREATE POLICY "Only Super Admin can delete leads"
ON leads
FOR DELETE
USING (
  has_role(auth.uid(), 'company'::app_role)
);
