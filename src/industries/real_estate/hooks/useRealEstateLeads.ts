import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import type { RealEstateLead } from '../components/RealEstateLeadsTable';

interface UseRealEstateLeadsOptions {
  search?: string;
  statusFilter?: string | string[];
  ownerFilter?: string[];
  propertyTypeFilter?: string[];
  page?: number;
  pageSize?: number;
}

export function useRealEstateLeads({
  search,
  statusFilter,
  ownerFilter,
  propertyTypeFilter,
  page = 1,
  pageSize = 25,
}: UseRealEstateLeadsOptions = {}) {
  const { company, loading: companyLoading } = useCompany();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [
      'real-estate-leads',
      search,
      statusFilter,
      ownerFilter,
      propertyTypeFilter,
      page,
      pageSize,
      company?.id,
    ],
    queryFn: async (): Promise<{ leads: RealEstateLead[]; count: number }> => {
      if (!company?.id) {
        return { leads: [], count: 0 };
      }

      let query = supabase
        .from('leads_real_estate')
        .select(`
          *,
          pre_sales_owner:profiles!leads_real_estate_pre_sales_owner_id_fkey(full_name),
          sales_owner:profiles!leads_real_estate_sales_owner_id_fkey(full_name),
          post_sales_owner:profiles!leads_real_estate_post_sales_owner_id_fkey(full_name)
        `, { count: 'exact' })
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        if (Array.isArray(statusFilter)) {
          if (statusFilter.length > 0) {
            query = query.in('status', statusFilter);
          }
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      if (ownerFilter && ownerFilter.length > 0) {
        // Filter by any of the owner fields
        query = query.or(
          ownerFilter.map(id =>
            `pre_sales_owner_id.eq.${id},sales_owner_id.eq.${id},post_sales_owner_id.eq.${id}`
          ).join(',')
        );
      }

      if (propertyTypeFilter && propertyTypeFilter.length > 0) {
        query = query.in('property_type', propertyTypeFilter);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,preferred_location.ilike.%${search}%,property_name.ilike.%${search}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('[useRealEstateLeads] Query error:', error);
        throw error;
      }

      return {
        leads: (data as unknown as RealEstateLead[]) || [],
        count: count || 0
      };
    },
    enabled: !companyLoading && !!company?.id,
    placeholderData: (prev) => prev,
  });

  return {
    ...query,
    isLoading: query.isLoading || companyLoading,
    refetch: query.refetch,
  };
}
