// React imports removed as they are no longer used

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, Database } from '@/integrations/supabase/types';

type Lead = Tables<'leads'> & {
  sales_owner?: {
    full_name: string | null;
  } | null;
};
type LeadStatus = Database['public']['Enums']['lead_status'];

interface UseLeadsOptions {
  search?: string;
  statusFilter?: string | string[];
  ownerFilter?: string[];
  productFilter?: string[];
  page?: number;
  pageSize?: number;
  fetchAll?: boolean;
  pendingPaymentOnly?: boolean;
}

import { useLeadsTable } from './useLeadsTable';

export function useLeads({ search, statusFilter, ownerFilter, productFilter, pendingPaymentOnly, page = 1, pageSize = 25, fetchAll = false }: UseLeadsOptions & { fetchAll?: boolean; pendingPaymentOnly?: boolean } = {}) {
  const queryClient = useQueryClient();
  const { tableName, companyId, loading: tableLoading } = useLeadsTable();

  // Realtime subscription removed to prevent unwanted table reloads during exploration.
  // Updates are now handled via optimistic updates or explicit invalidation in mutation hooks.


  const query = useQuery({
    queryKey: ['leads', search, statusFilter, ownerFilter, productFilter, pendingPaymentOnly, page, pageSize, fetchAll, tableName, companyId],
    queryFn: async (): Promise<{ leads: Lead[]; count: number }> => {

      // Build select query with dynamic foreign key reference
      // For custom tables, we can't use named FK joins because CREATE TABLE LIKE doesn't copy FK constraints
      // We'll just select all fields without joins for custom tables
      const selectQuery = tableName === 'leads'
        ? '*, sales_owner:profiles!leads_sales_owner_id_fkey(full_name)'
        : '*';

      let query = supabase
        .from(tableName as any)
        .select(selectQuery, { count: 'exact' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });

      // CRITICAL: Enforce company isolation for shared table
      // Custom tables are already isolated (contain only one company's data)
      if (tableName === 'leads') {
        if (!companyId) {
          console.warn('[useLeads] Security Guard: companyId missing for shared table. Aborting query to prevent data leakage.');
          return { leads: [], count: 0 };
        }
        query = query.eq('company_id', companyId);
      } else {

      }

      if (statusFilter) {
        if (Array.isArray(statusFilter)) {
          if (statusFilter.length > 0) {
            query = query.in('status', statusFilter);
          }
        } else if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter as LeadStatus);
        }
      }

      if (ownerFilter && ownerFilter.length > 0) {
        query = query.in('sales_owner_id', ownerFilter);
      }

      if (productFilter && productFilter.length > 0) {
        query = query.in('product_purchased', productFilter);
      }

      if (pendingPaymentOnly) {
        query = query.gt('revenue_received', 0);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,college.ilike.%${search}%`
        );
      }

      let from = (page - 1) * pageSize;
      let to = from + pageSize - 1;

      if (fetchAll) {
        from = 0;
        to = 1000000 - 1; // Effectively "all"
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('[useLeads] Query error:', error);
        throw error;
      }



      return { leads: (data as unknown as Lead[]) || [], count: count || 0 };
    },
    placeholderData: (previousData) => previousData,
    enabled: !tableLoading,
  });

  return {
    ...query,
    isLoading: query.isLoading || tableLoading
  };
}

import { automationService } from '@/services/automationService';

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { tableName } = useLeadsTable();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Lead>) => {
      const { data, error } = await supabase
        .from(tableName as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Trigger Automation: Status Changed
      if (data.status) {
        automationService.checkAndRunAutomations('status_changed', data);
      }
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { tableName } = useLeadsTable();

  return useMutation({
    mutationFn: async (newLead: TablesInsert<'leads'>) => {
      const { data, error } = await supabase
        .from(tableName as any)
        .insert(newLead)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Trigger Automation: Lead Created
      automationService.checkAndRunAutomations('lead_created', data);
    },
  });
}

export function useCreateLeads() {
  const queryClient = useQueryClient();
  const { tableName } = useLeadsTable();

  return useMutation({
    mutationFn: async (newLeads: TablesInsert<'leads'>[]) => {
      const { data, error } = await supabase
        .from(tableName as any)
        .insert(newLeads)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Trigger Automation for each new lead
      if (data && Array.isArray(data)) {
        data.forEach(lead => automationService.checkAndRunAutomations('lead_created', lead));
      }
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const { tableName } = useLeadsTable();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
