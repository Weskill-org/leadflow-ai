import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export function useUserRole() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['userRole', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return data?.role as AppRole;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
}

export const HIERARCHY_LEVELS: Record<AppRole, number> = {
    'company': 100,
    'company_subadmin': 90,
    'cbo': 80,
    'vp': 70,
    'avp': 60,
    'dgm': 50,
    'agm': 40,
    'sm': 30,
    'tl': 20,
    'bde': 10,
    'intern': 5,
    'ca': 0
};

export function isRoleAllowedToMarkPaid(role: AppRole | null | undefined): boolean {
    if (!role) return false;
    // "Above team lead" means > 20
    return HIERARCHY_LEVELS[role] > 20;
}
