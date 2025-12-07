import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard, Users, UserCheck, CreditCard, Settings,
  LogOut, Phone, Workflow, Link2, BarChart3, Brain, Calendar, FileText
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BarChart3, label: 'LG Dashboard', path: '/dashboard/lg' },
  { icon: Users, label: 'All Leads', path: '/dashboard/leads' },
  { icon: UserCheck, label: 'Interested', path: '/dashboard/interested' },
  { icon: CreditCard, label: 'Paid', path: '/dashboard/paid' },
  { icon: Calendar, label: 'Pending Payments', path: '/dashboard/pending' },
  { icon: Phone, label: 'Auto Dialer', path: '/dashboard/dialer' },
  { icon: Brain, label: 'AI Insights', path: '/dashboard/ai' },
  { icon: FileText, label: 'Forms', path: '/dashboard/forms' },
  { icon: Users, label: 'Team', path: '/dashboard/team' },
  { icon: Workflow, label: 'Automations', path: '/dashboard/automations' },
  { icon: Link2, label: 'Integrations', path: '/dashboard/integrations' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const { data: role } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const filteredNavItems = navItems.filter(item => {
    if (item.label === 'Integrations') {
      return role === 'company' || role === 'company_subadmin';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex">
        <div className="w-64 bg-sidebar border-r border-sidebar-border p-4">
          <Skeleton className="h-10 w-full mb-8" />
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">L³</span>
            </div>
            <div>
              <h1 className="font-semibold text-sidebar-foreground">Lead Cubed</h1>
              <p className="text-xs text-muted-foreground">AI-Powered CRM</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${location.pathname === item.path
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
