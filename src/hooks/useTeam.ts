import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Constants } from '@/integrations/supabase/types';

export type AppRole = typeof Constants.public.Enums.app_role[number];

export interface TeamMember {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  manager_id: string | null;
  created_at: string;
  role: AppRole;
  manager?: {
    id: string;
    full_name: string | null;
  };
}

const ROLE_LABELS: Record<AppRole, string> = {
  company: 'Company Admin',
  company_subadmin: 'Company SubAdmin',
  cbo: 'CBO',
  vp: 'VP',
  avp: 'AVP',
  dgm: 'DGM',
  agm: 'AGM',
  sm: 'Sales Manager',
  tl: 'Team Lead',
  bde: 'BDE',
  intern: 'Intern',
  ca: 'Campus Ambassador',
};

const ROLE_LEVELS: Record<AppRole, number> = {
  company: 1,
  company_subadmin: 2,
  cbo: 3,
  vp: 4,
  avp: 5,
  dgm: 6,
  agm: 7,
  sm: 8,
  tl: 9,
  bde: 10,
  intern: 11,
  ca: 12,
};

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<AppRole | null>(null);
  const { user } = useAuth();

  const fetchTeam = async () => {
    if (!user) return;

    // Get current user's role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleData) {
      setCurrentUserRole(roleData.role as AppRole);
    }

    // Fetch profiles with roles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching team:', error);
      setLoading(false);
      return;
    }

    // Fetch roles and manager info for each profile
    const membersWithRoles = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .single();
        
        let manager = undefined;
        if (profile.manager_id) {
          const { data: managerData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', profile.manager_id)
            .single();
          if (managerData) {
            manager = managerData;
          }
        }
        
        return {
          ...profile,
          role: (roleData?.role as AppRole) || 'bde',
          manager,
        };
      })
    );

    setMembers(membersWithRoles as TeamMember[]);
    setLoading(false);
  };

  const promoteUser = async (targetUserId: string, newRole: AppRole) => {
    if (!user || !currentUserRole) {
      return { error: new Error('Not authenticated') };
    }

    // Check if current user can promote to this role
    const currentLevel = ROLE_LEVELS[currentUserRole];
    const targetLevel = ROLE_LEVELS[newRole];

    if (currentLevel >= targetLevel) {
      return { error: new Error('You can only assign roles below your level') };
    }

    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', targetUserId);

    if (!error) {
      setMembers(prev => prev.map(m => 
        m.id === targetUserId ? { ...m, role: newRole } : m
      ));
    }

    return { error };
  };

  const setManager = async (userId: string, managerId: string | null) => {
    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: managerId })
      .eq('id', userId);

    if (!error) {
      await fetchTeam();
    }

    return { error };
  };

  const getRoleLabel = (role: AppRole) => ROLE_LABELS[role] || role;
  
  const getAssignableRoles = (): AppRole[] => {
    if (!currentUserRole) return [];
    const currentLevel = ROLE_LEVELS[currentUserRole];
    return (Object.entries(ROLE_LEVELS) as [AppRole, number][])
      .filter(([_, level]) => level > currentLevel)
      .map(([role]) => role);
  };

  useEffect(() => {
    fetchTeam();
  }, [user]);

  return { 
    members, 
    loading, 
    currentUserRole,
    promoteUser, 
    setManager,
    getRoleLabel,
    getAssignableRoles,
    refetch: fetchTeam 
  };
}
