import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LGLink {
  id: string;
  form_id: string;
  ca_name: string;
  utm_source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_by_id: string;
  created_at: string;
  form?: {
    id: string;
    name: string;
  };
  lead_count?: number;
  interested_count?: number;
  paid_count?: number;
  revenue_received?: number;
  revenue_projected?: number;
}

export function useLGLinks() {
  const [links, setLinks] = useState<LGLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLinks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch links with form info
      const { data: linksData, error: linksError } = await supabase
        .from('lg_links' as any)
        .select(`
          *,
          form:forms(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (linksError) {
        console.error('Error fetching LG links:', linksError);
        setLoading(false);
        return;
      }

      const rawLinks = (linksData as unknown as any[]) || [];

      // Fetch lead stats for each link
      const linksWithStats = await Promise.all(
        rawLinks.map(async (link) => {
          const { data: leadStats } = await supabase
            .from('leads')
            .select('status, revenue_received, revenue_projected')
            .eq('lg_link_id', link.id);
          
          const stats = leadStats || [];
          return {
            ...link,
            lead_count: stats.length,
            interested_count: stats.filter((l: any) => l.status === 'interested').length,
            paid_count: stats.filter((l: any) => l.status === 'paid').length,
            revenue_received: stats.reduce((sum: number, l: any) => sum + (Number(l.revenue_received) || 0), 0),
            revenue_projected: stats.reduce((sum: number, l: any) => sum + (Number(l.revenue_projected) || 0), 0),
          };
        })
      );

      setLinks(linksWithStats as LGLink[]);
    } catch (err) {
      console.error('Error fetching LG links:', err);
    }
    setLoading(false);
  }, [user]);

  const createLink = async (formId: string, caName: string, utmCampaign?: string) => {
    if (!user) return { error: new Error('Not authenticated'), data: null };
    
    const utmSource = caName.toLowerCase().replace(/\s+/g, '_');
    
    try {
      const { data, error } = await supabase
        .from('lg_links' as any)
        .insert({
          form_id: formId,
          ca_name: caName,
          utm_source: utmSource,
          utm_medium: 'referral',
          utm_campaign: utmCampaign,
          created_by_id: user.id,
        })
        .select(`
          *,
          form:forms(id, name)
        `)
        .single();
      
      if (!error && data) {
        const newLink = data as unknown as LGLink;
        setLinks(prev => [{
          ...newLink,
          lead_count: 0,
          interested_count: 0,
          paid_count: 0,
          revenue_received: 0,
          revenue_projected: 0,
        }, ...prev]);
      }
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return { links, loading, createLink, refetch: fetchLinks };
}
