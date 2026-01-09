import { useState, useEffect, useCallback } from 'react';
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
  platform_admin: 'Platform Admin',
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
  platform_admin: 0,
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

  const fetchTeam = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch current user's role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const myRole = (roleData?.role as AppRole) || null;
      if (myRole) {
        setCurrentUserRole(myRole);
      }

      // 2. Fetch ALL profiles and ALL roles in parallel
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url, manager_id, created_at')
          .order('created_at', { ascending: true }),
        supabase
          .from('user_roles')
          .select('user_id, role')
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      // 3. Map roles for easy lookup
      const roleMap = new Map<string, AppRole>();
      rolesResult.data?.forEach(r => {
        if (r.user_id && r.role) {
          roleMap.set(r.user_id, r.role as AppRole);
        }
      });

      // 4. Build initial TeamMember list (unfiltered)
      //    We need a map to easily look up managers for the UI
      const allMembersMap = new Map<string, TeamMember>();

      const allMembers: TeamMember[] = (profilesResult.data || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        manager_id: profile.manager_id,
        created_at: profile.created_at,
        role: roleMap.get(profile.id) || 'bde',
      }));

      // Populate valid manager objects
      allMembers.forEach(m => {
        allMembersMap.set(m.id, m);
      });

      allMembers.forEach(m => {
        if (m.manager_id && allMembersMap.has(m.manager_id)) {
          const mgr = allMembersMap.get(m.manager_id)!;
          m.manager = {
            id: mgr.id,
            full_name: mgr.full_name
          };
        }
      });

      // 5. Filter based on Hierarchy
      //    If Company Admin => See everyone
      //    Else => See self + all descendants
      let visibleMembers: TeamMember[] = [];

      if (myRole === 'company') {
        visibleMembers = allMembers;
      } else {
        // Build adjacency list for the tree: manager_id -> [direct_reports]
        const reportsMap = new Map<string, string[]>();
        allMembers.forEach(m => {
          if (m.manager_id) {
            if (!reportsMap.has(m.manager_id)) {
              reportsMap.set(m.manager_id, []);
            }
            reportsMap.get(m.manager_id)?.push(m.id);
          }
        });

        // DFS to find all descendants
        const descendants = new Set<string>();
        const queue = [user.id];

        // Also include self
        descendants.add(user.id);

        while (queue.length > 0) {
          const currentId = queue.shift()!;
          const directReports = reportsMap.get(currentId) || [];

          for (const reportId of directReports) {
            if (!descendants.has(reportId)) {
              descendants.add(reportId);
              queue.push(reportId);
            }
          }
        }

        visibleMembers = allMembers.filter(m => descendants.has(m.id));
      }

      setMembers(visibleMembers);

    } catch (err) {
      console.error('Error fetching team:', err);
    }
    setLoading(false);
  }, [user]);

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
  }, [fetchTeam]);

  return {
    members,
    loading,
    currentUserRole,
    promoteUser,
    deleteMember: async (targetUserId: string) => {
      if (!user) return { error: new Error('Not authenticated') };

      const { data, error: funcError } = await supabase.functions.invoke('delete-team-member', {
        body: { targetUserId }
      });

      if (funcError) return { error: funcError };
      if (data?.error) return { error: new Error(data.error) };

      // Optimistic update
      setMembers(prev => prev.filter(m => m.id !== targetUserId));
      return { error: null };
    },
    setManager,
    getRoleLabel,
    getAssignableRoles,
    refetch: fetchTeam
  };
}
