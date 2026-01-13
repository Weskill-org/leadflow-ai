-- Add configuration column to companies table
ALTER TABLE IF EXISTS "public"."companies" 
ADD COLUMN IF NOT EXISTS "custom_leads_table" text;

-- Function to enable custom leads table for a company
CREATE OR REPLACE FUNCTION public.enable_custom_leads_table(input_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_company_slug text;
    v_total_licenses int;
    v_new_table_name text;
    v_old_count int;
    v_new_count int;
BEGIN
    -- 1. Get Company Details
    SELECT slug, total_licenses INTO v_company_slug, v_total_licenses
    FROM public.companies
    WHERE id = input_company_id;

    IF v_company_slug IS NULL THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    -- 2. Verify License Requirement
    IF v_total_licenses < 2 THEN
        RAISE EXCEPTION 'Company does not meet license requirements (Minimum 2)';
    END IF;

    -- 3. Define New Table Name (leads_slug)
    -- Sanitize slug to ensure valid table name (alphanumeric only)
    v_new_table_name := 'leads_' || regexp_replace(v_company_slug, '[^a-zA-Z0-9_]', '_', 'g');

    -- Check if table already exists to avoid overwriting (idempotency)
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = v_new_table_name
    ) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Custom table already exists', 
            'table_name', v_new_table_name
        );
    END IF;

    -- 4. Create New Table (Like leads)
    EXECUTE format('CREATE TABLE public.%I (LIKE public.leads INCLUDING ALL)', v_new_table_name);

    -- 5. Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_new_table_name);

    -- 6. Recreate Policies
    -- Use the same logic as standard leads table
    
    -- SELECT
    EXECUTE format('
        CREATE POLICY "Users can view their own leads and subordinates'' leads" 
        ON public.%I FOR SELECT 
        USING (
            auth.uid() = sales_owner_id 
            OR 
            is_in_hierarchy(auth.uid(), sales_owner_id)
        )', v_new_table_name);

    -- INSERT
    EXECUTE format('
        CREATE POLICY "Users can create leads" 
        ON public.%I FOR INSERT 
        WITH CHECK (
            auth.uid() = created_by_id
        )', v_new_table_name);

    -- UPDATE
    EXECUTE format('
        CREATE POLICY "Users can update their own leads and subordinates'' leads" 
        ON public.%I FOR UPDATE 
        USING (
            auth.uid() = sales_owner_id 
            OR 
            is_in_hierarchy(auth.uid(), sales_owner_id)
        )', v_new_table_name);

    -- DELETE
    EXECUTE format('
        CREATE POLICY "Only Super Admin can delete leads" 
        ON public.%I FOR DELETE 
        USING (
            has_role(auth.uid(), ''company''::app_role)
        )', v_new_table_name);

    -- 7. Recreate Triggers
    -- Update Timestamp
    EXECUTE format('
        CREATE TRIGGER update_leads_updated_at 
        BEFORE UPDATE ON public.%I 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()
    ', v_new_table_name);

    -- Lead Source from Link
    -- Note: We reuse the same trigger function as it is generic enough
    EXECUTE format('
        CREATE TRIGGER set_lead_source_from_link 
        BEFORE INSERT OR UPDATE ON public.%I 
        FOR EACH ROW EXECUTE FUNCTION public.handle_lead_source_from_link()
    ', v_new_table_name);

    -- 8. Migrate Data
    EXECUTE format('
        INSERT INTO public.%I 
        SELECT * FROM public.leads 
        WHERE company_id = %L
    ', v_new_table_name, input_company_id);

    GET DIAGNOSTICS v_new_count = ROW_COUNT;

    -- 9. Delete Old Data
    DELETE FROM public.leads WHERE company_id = input_company_id;
    GET DIAGNOSTICS v_old_count = ROW_COUNT;

    -- 10. Update Company Record
    UPDATE public.companies 
    SET custom_leads_table = v_new_table_name 
    WHERE id = input_company_id;

    RETURN jsonb_build_object(
        'success', true,
        'table_name', v_new_table_name,
        'leads_migrated', v_new_count,
        'leads_deleted_from_main', v_old_count
    );
END;
$$;
