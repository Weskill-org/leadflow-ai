import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  total_licenses: number;
  used_licenses: number;
  is_active: boolean;
  custom_leads_table?: string | null;
  admin_id: string;
  industry: string | null;
}

export function useCompany() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCompany();
    } else {
      setCompany(null);
      setLoading(false);
    }
  }, [user]);

  const fetchCompany = async () => {
    setLoading(true);
    try {
      // Get user's profile with company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        setCompany(null);
        setLoading(false);
        return;
      }

      // Get company details
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (error) {
        console.error('[useCompany] Error fetching company:', error);
        setCompany(null);
      } else {

        setCompany(companyData);
        setIsCompanyAdmin(companyData.admin_id === user?.id);
      }
    } catch (err) {
      console.error('Error in useCompany:', err);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const canAddTeamMember = () => {
    if (!company) return false;
    return company.used_licenses < company.total_licenses;
  };

  const availableLicenses = () => {
    if (!company) return 0;
    return company.total_licenses - company.used_licenses;
  };

  return {
    company,
    loading,
    isCompanyAdmin,
    canAddTeamMember,
    availableLicenses,
    refetch: fetchCompany,
  };
}
