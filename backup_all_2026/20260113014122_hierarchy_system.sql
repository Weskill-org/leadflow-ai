-- Create company_hierarchies table
CREATE TABLE IF NOT EXISTS public.company_hierarchies (
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    level_1 TEXT NOT NULL DEFAULT 'Company Admin',
    level_2 TEXT NOT NULL DEFAULT 'Company Sub-Admin',
    level_3 TEXT NOT NULL DEFAULT 'CBO',
    level_4 TEXT NOT NULL DEFAULT 'VP',
    level_5 TEXT NOT NULL DEFAULT 'AVP',
    level_6 TEXT NOT NULL DEFAULT 'DGM',
    level_7 TEXT NOT NULL DEFAULT 'AGM',
    level_8 TEXT NOT NULL DEFAULT 'Sales Manager',
    level_9 TEXT NOT NULL DEFAULT 'Team Lead',
    level_10 TEXT NOT NULL DEFAULT 'BDE',
    level_11 TEXT NOT NULL DEFAULT 'Intern',
    level_12 TEXT NOT NULL DEFAULT 'Campus Ambassador',
    level_13 TEXT NOT NULL DEFAULT 'Level 13',
    level_14 TEXT NOT NULL DEFAULT 'Level 14',
    level_15 TEXT NOT NULL DEFAULT 'Level 15',
    level_16 TEXT NOT NULL DEFAULT 'Level 16',
    level_17 TEXT NOT NULL DEFAULT 'Level 17',
    level_18 TEXT NOT NULL DEFAULT 'Level 18',
    level_19 TEXT NOT NULL DEFAULT 'Level 19',
    level_20 TEXT NOT NULL DEFAULT 'Level 20',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (company_id)
);

-- Enable RLS
ALTER TABLE public.company_hierarchies ENABLE ROW LEVEL SECURITY;

-- Policies for company_hierarchies
-- 1. View: All users in the company can view the hierarchy names
CREATE POLICY "Company users can view their hierarchy" ON public.company_hierarchies
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- 2. Update: Only Company Admins (Level 1) can update the hierarchy names
-- Note: 'company' role corresponds to Level 1
CREATE POLICY "Company admins can update hierarchy" ON public.company_hierarchies
    FOR UPDATE USING (
        public.has_role(auth.uid(), 'company')
    );

-- 3. Insert: Trigger usually handles creation, but allow admins to insert if missing
CREATE POLICY "Company admins can insert hierarchy" ON public.company_hierarchies
    FOR INSERT WITH CHECK (
        public.has_role(auth.uid(), 'company')
    );


-- Trigger to automatically create hierarchy when a company is created
CREATE OR REPLACE FUNCTION public.handle_new_company_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.company_hierarchies (company_id)
    VALUES (NEW.id)
    ON CONFLICT (company_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to companies table
DROP TRIGGER IF EXISTS on_company_created_hierarchy ON public.companies;
CREATE TRIGGER on_company_created_hierarchy
    AFTER INSERT ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_company_hierarchy();

-- Backfill: Create hierarchy entries for EXISTING companies
INSERT INTO public.company_hierarchies (company_id)
SELECT id FROM public.companies
ON CONFLICT (company_id) DO NOTHING;


-- Migrate existing user roles to new level_X roles
-- company (Level 1) and company_subadmin (Level 2) remain unchanged in DB
UPDATE public.user_roles SET role = 'level_3' WHERE role = 'cbo';
UPDATE public.user_roles SET role = 'level_4' WHERE role = 'vp';
UPDATE public.user_roles SET role = 'level_5' WHERE role = 'avp';
UPDATE public.user_roles SET role = 'level_6' WHERE role = 'dgm';
UPDATE public.user_roles SET role = 'level_7' WHERE role = 'agm';
UPDATE public.user_roles SET role = 'level_8' WHERE role = 'sm';
UPDATE public.user_roles SET role = 'level_9' WHERE role = 'tl';
UPDATE public.user_roles SET role = 'level_10' WHERE role = 'bde';
UPDATE public.user_roles SET role = 'level_11' WHERE role = 'intern';
UPDATE public.user_roles SET role = 'level_12' WHERE role = 'ca';
