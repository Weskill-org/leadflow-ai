-- Create company_lead_statuses table
CREATE TABLE IF NOT EXISTS public.company_lead_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    color TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('new', 'paid', 'interested', 'other')),
    sub_statuses TEXT[] DEFAULT ARRAY[]::TEXT[],
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, value)
);

-- Enable RLS
ALTER TABLE public.company_lead_statuses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view statuses of their company"
    ON public.company_lead_statuses FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage statuses of their company"
    ON public.company_lead_statuses FOR ALL
    USING (company_id IN (
        SELECT company_id FROM public.companies WHERE admin_id = auth.uid()
    ));

-- Drop dependent trigger before altering column
DROP TRIGGER IF EXISTS on_lead_paid_update_inventory ON public.leads;

-- Change leads.status to text to allow custom values
-- We do this for the main leads table.
-- Note: existing data will be cast to text automatically
ALTER TABLE public.leads 
    ALTER COLUMN status TYPE TEXT;

-- Re-create the trigger with the same logic, now operating on TEXT column
CREATE TRIGGER on_lead_paid_update_inventory
AFTER UPDATE OF status ON public.leads
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM 'paid' AND NEW.status = 'paid')
EXECUTE FUNCTION public.decrement_product_quantity();

-- Also update leads_weskill if it exists (it was in types.ts)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads_weskill') THEN
        ALTER TABLE public.leads_weskill ALTER COLUMN status TYPE TEXT;
    END IF;
END $$;

-- Trigger to update updated_at
CREATE TRIGGER update_company_lead_statuses_updated_at
    BEFORE UPDATE ON public.company_lead_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to populate default statuses for existing companies
CREATE OR REPLACE FUNCTION populate_default_statuses()
RETURNS void AS $$
DECLARE
    company_record RECORD;
BEGIN
    FOR company_record IN SELECT id FROM public.companies LOOP
        -- Insert default statuses if they don't exist
        INSERT INTO public.company_lead_statuses (company_id, label, value, color, category, order_index)
        VALUES 
            (company_record.id, 'New', 'new', '#3B82F6', 'new', 0),
            (company_record.id, 'Interested', 'interested', '#F59E0B', 'interested', 1),
            (company_record.id, 'Follow Up', 'follow_up', '#8B5CF6', 'interested', 2),
            (company_record.id, 'RNR', 'rnr', '#EC4899', 'other', 3),
            (company_record.id, 'DND', 'dnd', '#EF4444', 'other', 4),
            (company_record.id, 'Not Interested', 'not_interested', '#6B7280', 'other', 5),
            (company_record.id, 'Paid', 'paid', '#10B981', 'paid', 6)
        ON CONFLICT (company_id, value) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the population function
SELECT populate_default_statuses();

-- Drop the function as it's a one-time migration helper
DROP FUNCTION populate_default_statuses();

-- Drop the enum type if no longer used (optional, keeping it safe for now)
-- DROP TYPE IF EXISTS public.lead_status;
