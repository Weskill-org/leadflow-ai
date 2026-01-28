-- Create real_estate_properties table
CREATE TABLE IF NOT EXISTS public.real_estate_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- Property Type e.g., 'Apartment', 'Villa'
  name TEXT NOT NULL, -- Property Name e.g., 'Sunset Heights'
  sq_ft NUMERIC,
  cost NUMERIC,
  available_units INTEGER,
  location TEXT,
  state TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.real_estate_properties ENABLE ROW LEVEL SECURITY;

-- Policies

-- View: Authenticated users can view properties for their company
CREATE POLICY "Users can view their company properties"
ON public.real_estate_properties
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Manage: Company admins and subadmins can manage properties
CREATE POLICY "Company admins can manage properties"
ON public.real_estate_properties
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND company_id = public.real_estate_properties.company_id
  )
  AND (
    public.has_role(auth.uid(), 'company') 
    OR public.has_role(auth.uid(), 'company_subadmin')
  )
);

-- Super Admin
CREATE POLICY "Platform admins can manage all properties"
ON public.real_estate_properties
FOR ALL
USING (
  public.is_platform_admin(auth.uid())
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_real_estate_properties_updated_at
    BEFORE UPDATE ON public.real_estate_properties
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();
