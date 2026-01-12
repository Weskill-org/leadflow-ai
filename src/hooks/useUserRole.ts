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
    'platform_admin': 110,
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
    'ca': 0,
    'level_3': 80,
    'level_4': 70,
    'level_5': 60,
    'level_6': 50,
    'level_7': 40,
    'level_8': 30,
    'level_9': 20,
    'level_10': 10,
    'level_11': 5,
    'level_12': 0,
    'level_13': -1,
    'level_14': -2,
    'level_15': -3,
    'level_16': -4,
    'level_17': -5,
    'level_18': -6,
    'level_19': -7,
    'level_20': -8,
};

export function isRoleAllowedToMarkPaid(role: AppRole | null | undefined): boolean {
    if (!role) return false;
    // "Above team lead" means > 20
    return HIERARCHY_LEVELS[role] > 20;
}
