import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Form {
  id: string;
  name: string;
  description: string | null;
  fields: any[];
  status: 'draft' | 'active' | 'archived';
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export function useForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchForms = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('forms' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching forms:', error);
      } else {
        setForms((data as unknown as Form[]) || []);
      }
    } catch (err) {
      console.error('Error fetching forms:', err);
    }
    setLoading(false);
  }, [user]);

  const createForm = async (name: string, description?: string) => {
    if (!user) return { error: new Error('Not authenticated'), data: null };
    
    try {
      const { data, error } = await supabase
        .from('forms' as any)
        .insert({
          name,
          description,
          created_by_id: user.id,
          status: 'active'
        })
        .select()
        .single();
      
      if (!error && data) {
        setForms(prev => [(data as unknown as Form), ...prev]);
      }
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateForm = async (id: string, updates: Partial<Form>) => {
    try {
      const { data, error } = await supabase
        .from('forms' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (!error && data) {
        setForms(prev => prev.map(f => f.id === id ? (data as unknown as Form) : f));
      }
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteForm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('forms' as any)
        .delete()
        .eq('id', id);
      
      if (!error) {
        setForms(prev => prev.filter(f => f.id !== id));
      }
      
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  return { forms, loading, createForm, updateForm, deleteForm, refetch: fetchForms };
}
