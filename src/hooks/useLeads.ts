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

export function useLeads({ search, statusFilter, page = 1, pageSize = 25 }: UseLeadsOptions = {}) {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Lead change received:', payload);
          // Invalidate and refetch leads query
          queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['leads', search, statusFilter, page, pageSize],
    queryFn: async (): Promise<{ leads: Lead[]; count: number }> => {
      let query = supabase
        .from('leads')
        .select('*, sales_owner:profiles!leads_sales_owner_id_fkey(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });

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
        throw error;
      }

      return { leads: data || [], count: count || 0 };
    },
    placeholderData: (previousData) => previousData,
  });
}

import { automationService } from '@/services/automationService';

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Lead>) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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

  return useMutation({
    mutationFn: async (newLead: TablesInsert<'leads'>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(newLead)
        .select()
        .single();

      if (error) throw error;
      return data;
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

  return useMutation({
    mutationFn: async (newLeads: TablesInsert<'leads'>[]) => {
      const { data, error } = await supabase
        .from('leads')
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
