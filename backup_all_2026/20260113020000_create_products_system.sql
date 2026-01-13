-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity_available INTEGER, -- NULL means unlimited
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add product_category to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS product_category TEXT;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies for products

-- View: Authenticated users can view products for their company
DROP POLICY IF EXISTS "Users can view their company products" ON public.products;
CREATE POLICY "Users can view their company products"
ON public.products
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Manage: Company admins and subadmins can manage products
DROP POLICY IF EXISTS "Company admins can manage products" ON public.products;
CREATE POLICY "Company admins can manage products"
ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND company_id = public.products.company_id
  )
  AND (
    public.has_role(auth.uid(), 'company') 
    OR public.has_role(auth.uid(), 'company_subadmin')
  )
);

-- Super Admin
DROP POLICY IF EXISTS "Platform admins can manage all products" ON public.products;
CREATE POLICY "Platform admins can manage all products"
ON public.products
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

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- Inventory Trigger Logic

CREATE OR REPLACE FUNCTION public.decrement_product_quantity()
RETURNS TRIGGER AS $$
DECLARE
    product_rec RECORD;
BEGIN
    SELECT id, quantity_available 
    INTO product_rec
    FROM public.products
    WHERE company_id = NEW.company_id
      AND name = NEW.product_purchased
      AND (
          (category IS NULL AND NEW.product_category IS NULL)
          OR 
          (category = NEW.product_category)
      )
    LIMIT 1;

    IF FOUND THEN
        IF product_rec.quantity_available IS NOT NULL THEN
            UPDATE public.products
            SET quantity_available = quantity_available - 1
            WHERE id = product_rec.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lead_paid_update_inventory ON public.leads;
CREATE TRIGGER on_lead_paid_update_inventory
AFTER UPDATE OF status ON public.leads
FOR EACH ROW
WHEN (OLD.status != 'paid' AND NEW.status = 'paid')
EXECUTE FUNCTION public.decrement_product_quantity();
