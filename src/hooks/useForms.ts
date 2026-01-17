import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Form = Tables<'forms'>;
export type FormInsert = TablesInsert<'forms'>;
export type FormUpdate = TablesUpdate<'forms'>;

export function useForms() {
  return useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useForm(id: string | undefined) {
  return useQuery({
    queryKey: ['form', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function usePublicForm(id: string | undefined) {
  return useQuery({
    queryKey: ['public-form', id],
    queryFn: async () => {
      if (!id) return null;

      try {
        const { data, error } = await supabase.functions.invoke('get-public-form', {
          body: { formId: id }
        });

        if (error) throw error;

        return data as Form;
      } catch (e) {
        console.warn('Edge function failed, falling back to direct DB query:', e);

        const { data: dbData, error: dbError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .single();

        if (dbError) throw dbError;

        return dbData;
      }
    },
    enabled: !!id,
    retry: 1
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newForm: FormInsert) => {
      const { data, error } = await supabase
        .from('forms')
        .insert(newForm)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & FormUpdate) => {
      const { data, error } = await supabase
        .from('forms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['form', data.id] });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error, count } = await supabase
        .from('forms')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) throw error;
      if (count === 0) {
        throw new Error('Permission denied or form not found');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

import { useLeadsTable } from './useLeadsTable';

export function useFormResponses(formId: string | undefined) {
  const { tableName, companyId } = useLeadsTable();

  return useQuery({
    queryKey: ['form-responses', formId, tableName, companyId],
    queryFn: async () => {
      if (!formId) return [];

      let query = supabase
        .from(tableName as any)
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false });

      if (tableName === 'leads' && companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });
}

export function useFormResponseCounts() {
  const { tableName, companyId } = useLeadsTable();

  return useQuery({
    queryKey: ['form-response-counts', tableName, companyId],
    queryFn: async () => {
      // For performance in large datasets, we might want to use a more optimized approach
      // but for now, we'll fetch ID and form_id to aggregate on the client side
      // or use a direct group by count if we can write a custom RPC function later.
      // Since standard Supabase client doesn't support "group by" easily without raw SQL or RPC,
      // and "custom_leads_table" might be dynamic, we'll select form_id only.

      let query = supabase
        .from(tableName as any)
        .select('form_id');

      if (tableName === 'leads' && companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregating counts
      const counts: Record<string, number> = {};
      data?.forEach((row: any) => {
        if (row.form_id) {
          counts[row.form_id] = (counts[row.form_id] || 0) + 1;
        }
      });

      return counts;
    },
  });
}
