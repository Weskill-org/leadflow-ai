-- Create forms table
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create LG links table with UTM tracking
CREATE TABLE public.lg_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  ca_name TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  utm_medium TEXT DEFAULT 'referral',
  utm_campaign TEXT,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add utm tracking columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES public.forms(id),
ADD COLUMN IF NOT EXISTS lg_link_id UUID REFERENCES public.lg_links(id);

-- Enable RLS on new tables
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lg_links ENABLE ROW LEVEL SECURITY;

-- Forms RLS policies
CREATE POLICY "Users can view forms from hierarchy"
ON public.forms FOR SELECT
USING (is_in_hierarchy(auth.uid(), created_by_id));

CREATE POLICY "Users can create forms"
ON public.forms FOR INSERT
WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "Users can update their forms"
ON public.forms FOR UPDATE
USING (created_by_id = auth.uid() OR is_in_hierarchy(auth.uid(), created_by_id));

-- LG Links RLS policies
CREATE POLICY "Users can view lg_links from hierarchy"
ON public.lg_links FOR SELECT
USING (is_in_hierarchy(auth.uid(), created_by_id));

CREATE POLICY "Users can create lg_links"
ON public.lg_links FOR INSERT
WITH CHECK (created_by_id = auth.uid());

-- Enable realtime for leads table
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER TABLE public.leads REPLICA IDENTITY FULL;

-- Triggers for updated_at
CREATE TRIGGER update_forms_updated_at
BEFORE UPDATE ON public.forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create function to get hierarchy level for a role
CREATE OR REPLACE FUNCTION public.get_role_level(_role app_role)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _role
    WHEN 'company' THEN 1
    WHEN 'company_subadmin' THEN 2
    WHEN 'cbo' THEN 3
    WHEN 'vp' THEN 4
    WHEN 'avp' THEN 5
    WHEN 'dgm' THEN 6
    WHEN 'agm' THEN 7
    WHEN 'sm' THEN 8
    WHEN 'tl' THEN 9
    WHEN 'bde' THEN 10
    WHEN 'intern' THEN 11
    WHEN 'ca' THEN 12
    ELSE 99
  END
$$;

-- Create function to check if user can promote another user
CREATE OR REPLACE FUNCTION public.can_promote_user(_promoter_id uuid, _target_user_id uuid, _new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promoter_role app_role;
  promoter_level INTEGER;
  new_role_level INTEGER;
BEGIN
  -- Get promoter's role
  SELECT role INTO promoter_role FROM public.user_roles WHERE user_id = _promoter_id LIMIT 1;
  
  IF promoter_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  promoter_level := get_role_level(promoter_role);
  new_role_level := get_role_level(_new_role);
  
  -- Promoter can only assign roles below their level
  -- And the target must be in their hierarchy
  RETURN promoter_level < new_role_level AND is_in_hierarchy(_promoter_id, _target_user_id);
END;
$$;