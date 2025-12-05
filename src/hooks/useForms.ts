import { useState, useEffect } from 'react';
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

  const fetchForms = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching forms:', error);
    } else {
      setForms(data as Form[]);
    }
    setLoading(false);
  };

  const createForm = async (name: string, description?: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('forms')
      .insert({
        name,
        description,
        created_by_id: user.id,
        status: 'active'
      })
      .select()
      .single();
    
    if (!error && data) {
      setForms(prev => [data as Form, ...prev]);
    }
    
    return { data, error };
  };

  const updateForm = async (id: string, updates: Partial<Form>) => {
    const { data, error } = await supabase
      .from('forms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (!error && data) {
      setForms(prev => prev.map(f => f.id === id ? data as Form : f));
    }
    
    return { data, error };
  };

  const deleteForm = async (id: string) => {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setForms(prev => prev.filter(f => f.id !== id));
    }
    
    return { error };
  };

  useEffect(() => {
    fetchForms();
  }, [user]);

  return { forms, loading, createForm, updateForm, deleteForm, refetch: fetchForms };
}
