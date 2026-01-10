import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useCompany } from '@/hooks/useCompany';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard, Users, UserCheck, CreditCard, Settings, LogOut, Phone, Workflow, Link2, BarChart3, Brain, Calendar, FileText, Building2, Shield } from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';
const navItems = [{
  icon: LayoutDashboard,
  label: 'Dashboard',
  path: '/dashboard'
}, {
  icon: BarChart3,
  label: 'LG Dashboard',
  path: '/dashboard/lg'
}, {
  icon: Users,
  label: 'All Leads',
  path: '/dashboard/leads'
}, {
  icon: UserCheck,
  label: 'Interested',
  path: '/dashboard/interested'
}, {
  icon: CreditCard,
  label: 'Paid',
  path: '/dashboard/paid'
}, {
  icon: Calendar,
  label: 'Pending Payments',
  path: '/dashboard/pending'
}, {
  icon: Phone,
  label: 'Auto Dialer',
  path: '/dashboard/dialer'
}, {
  icon: Brain,
  label: 'AI Insights',
  path: '/dashboard/ai'
}, {
  icon: FileText,
  label: 'Forms',
  path: '/dashboard/forms'
}, {
  icon: Users,
  label: 'Team',
  path: '/dashboard/team'
}, {
  icon: Workflow,
  label: 'Automations',
  path: '/dashboard/automations'
}, {
  icon: Link2,
  label: 'Integrations',
  path: '/dashboard/integrations'
}, {
  icon: Building2,
  label: 'Manage Company',
  path: '/dashboard/company'
}, {
  icon: Settings,
  label: 'Settings',
  path: '/dashboard/settings'
}];
interface DashboardLayoutProps {
  children: ReactNode;
}
export default function DashboardLayout({
  children
}: DashboardLayoutProps) {
  const {
    user,
    loading,
    signOut
  } = useAuth();
  const {
    data: role
  } = useUserRole();
  const {
    company,
    isCompanyAdmin
  } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);
  const filteredNavItems = navItems.filter(item => {
    if (item.label === 'Integrations') {
      return role === 'company' || role === 'company_subadmin';
    }
    if (item.label === 'Manage Company') {
      return role === 'company' || role === 'company_subadmin' || isCompanyAdmin;
    }
    return true;
  });
  if (loading) {
    return <div className="min-h-screen bg-background dark flex">
      {!isMobile && <div className="w-64 bg-sidebar border-r border-sidebar-border p-4">
        <Skeleton className="h-10 w-full mb-8" />
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />)}
      </div>}
      <div className="flex-1 p-4 md:p-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    </div>;
  }
  if (!user) return null;
  return <div className="h-screen overflow-hidden bg-background dark flex">
    {/* Desktop Sidebar */}
    {!isMobile && <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-10 h-10 rounded-lg object-cover bg-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">
                {company?.name?.[0] || 'F'}
              </span>
            </div>
          )}
          <div>
            <h1 className="font-semibold text-sidebar-foreground">
              {company?.name || 'Fastest CRM'}
            </h1>
            <p className="text-xs text-muted-foreground">Fastest CRM by Upmarking.com</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map(item => <button key={item.label} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>)}
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
        <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>}

    {/* Main Content */}
    <main className={`flex-1 overflow-auto ${isMobile ? 'pb-20' : ''}`}>
      <div className="p-4 md:p-8 min-h-[calc(100vh-2rem)] flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <footer className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          © 2025 Fastest CRM by Upmarking.com. Built for Fastest Sales Teams.
        </footer>
      </div>
    </main>

    {/* Mobile Bottom Navigation */}
    {isMobile && <MobileBottomNav />}
  </div>;
}