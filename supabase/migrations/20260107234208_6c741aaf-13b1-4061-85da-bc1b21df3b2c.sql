-- Phase 1: Multi-Tenant SaaS Platform Schema

-- 1.1 Add platform_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin' BEFORE 'company';

-- 1.2 Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  custom_domain text UNIQUE,
  domain_status text DEFAULT 'pending' CHECK (domain_status IN ('pending', 'verifying', 'active', 'failed')),
  logo_url text,
  primary_color text DEFAULT '#8B5CF6',
  total_licenses integer NOT NULL DEFAULT 1 CHECK (total_licenses >= 1),
  used_licenses integer NOT NULL DEFAULT 1 CHECK (used_licenses >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT used_not_exceed_total CHECK (used_licenses <= total_licenses)
);

-- 1.3 Create company_licenses table (purchase history)
CREATE TABLE public.company_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity >= 1),
  amount_paid integer NOT NULL CHECK (amount_paid >= 0),
  payment_id text,
  razorpay_order_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- 1.4 Create platform_admins table
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 1.5 Add company_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 1.6 Create indexes for performance
CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_companies_custom_domain ON public.companies(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_companies_admin_id ON public.companies(admin_id);
CREATE INDEX idx_company_licenses_company_id ON public.company_licenses(company_id);
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_platform_admins_user_id ON public.platform_admins(user_id);

-- 1.7 Create helper functions

-- Check if user is a platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = _user_id
  )
$$;

-- Get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Check if user is admin of their company
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies 
    WHERE admin_id = _user_id AND is_active = true
  )
$$;

-- Check if company can add more members
CREATE OR REPLACE FUNCTION public.can_add_team_member(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = _company_id 
      AND is_active = true 
      AND used_licenses < total_licenses
  )
$$;

-- Get company by domain (for multi-domain support)
CREATE OR REPLACE FUNCTION public.get_company_by_domain(_domain text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.companies 
  WHERE (custom_domain = _domain AND domain_status = 'active')
     OR slug = _domain
  LIMIT 1
$$;

-- 1.8 Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- 1.9 RLS Policies for companies table

-- Platform admins can do everything
CREATE POLICY "Platform admins have full access to companies"
ON public.companies
FOR ALL
USING (is_platform_admin(auth.uid()));

-- Company admins can view their own company
CREATE POLICY "Company admins can view their company"
ON public.companies
FOR SELECT
USING (admin_id = auth.uid());

-- Company admins can update their own company (except licenses)
CREATE POLICY "Company admins can update their company"
ON public.companies
FOR UPDATE
USING (admin_id = auth.uid())
WITH CHECK (admin_id = auth.uid());

-- Members can view their company
CREATE POLICY "Members can view their company"
ON public.companies
FOR SELECT
USING (id = get_user_company_id(auth.uid()));

-- 1.10 RLS Policies for company_licenses table

-- Platform admins can do everything
CREATE POLICY "Platform admins have full access to licenses"
ON public.company_licenses
FOR ALL
USING (is_platform_admin(auth.uid()));

-- Company admins can view their license history
CREATE POLICY "Company admins can view their licenses"
ON public.company_licenses
FOR SELECT
USING (
  company_id IN (SELECT id FROM public.companies WHERE admin_id = auth.uid())
);

-- Company admins can insert new license purchases (pending status only)
CREATE POLICY "Company admins can create license purchases"
ON public.company_licenses
FOR INSERT
WITH CHECK (
  company_id IN (SELECT id FROM public.companies WHERE admin_id = auth.uid())
  AND status = 'pending'
);

-- 1.11 RLS Policies for platform_admins table

-- Only platform admins can view the table
CREATE POLICY "Platform admins can view platform admins"
ON public.platform_admins
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Only existing platform admins can add new ones
CREATE POLICY "Platform admins can add platform admins"
ON public.platform_admins
FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()));

-- 1.12 Update triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 1.13 Function to increment used_licenses
CREATE OR REPLACE FUNCTION public.increment_used_licenses(_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies
  SET used_licenses = used_licenses + 1,
      updated_at = now()
  WHERE id = _company_id
    AND used_licenses < total_licenses;
  
  RETURN FOUND;
END;
$$;

-- 1.14 Function to decrement used_licenses
CREATE OR REPLACE FUNCTION public.decrement_used_licenses(_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies
  SET used_licenses = GREATEST(used_licenses - 1, 1),
      updated_at = now()
  WHERE id = _company_id;
  
  RETURN FOUND;
END;
$$;

-- 1.15 Function to add licenses after successful payment
CREATE OR REPLACE FUNCTION public.add_company_licenses(_company_id uuid, _quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies
  SET total_licenses = total_licenses + _quantity,
      updated_at = now()
  WHERE id = _company_id;
  
  RETURN FOUND;
END;
$$;