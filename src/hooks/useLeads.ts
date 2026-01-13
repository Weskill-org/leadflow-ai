import { useState, useEffect } from 'react';
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
  statusFilter?: string;
  page?: number;
  pageSize?: number;
}

import { useLeadsTable } from './useLeadsTable';

export function useLeads({ search, statusFilter, page = 1, pageSize = 25 }: UseLeadsOptions = {}) {
  const queryClient = useQueryClient();
  const { tableName, companyId, loading: tableLoading } = useLeadsTable();

  // Set up real-time subscription (re-subscribe when table changes)
  useEffect(() => {
    if (!tableName) return;

    console.log('[useLeads] Setting up realtime subscription for table:', tableName);

    const channel = supabase
      .channel(`leads-realtime-${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log('[useLeads] Realtime change received:', { table: tableName, event: payload.eventType });
          // Invalidate and refetch leads query
          queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
      )
      .subscribe();

    return () => {
      console.log('[useLeads] Cleaning up realtime subscription for table:', tableName);
      supabase.removeChannel(channel);
    };
  }, [queryClient, tableName]);

  return useQuery({
    queryKey: ['leads', search, statusFilter, page, pageSize, tableName, companyId],
    queryFn: async (): Promise<{ leads: Lead[]; count: number }> => {
      console.log('[useLeads] Querying table:', { tableName, companyId, statusFilter, search, page });
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
        console.log('[useLeads] Applying strict company_id filter:', companyId);
        query = query.eq('company_id', companyId);
      } else {
        console.log('[useLeads] Custom table detected, skipping company_id filter (Implicit Isolation)');
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as LeadStatus);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,college.ilike.%${search}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('[useLeads] Query error:', error);
        throw error;
      }

      console.log('[useLeads] Query successful:', { count, rowsReturned: data?.length });

      return { leads: (data as unknown as Lead[]) || [], count: count || 0 };
    },
    placeholderData: (previousData) => previousData,
    enabled: !tableLoading,
  });
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
