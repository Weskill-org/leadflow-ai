import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, CreditCard, Settings,
  Phone, Brain, FileText, Menu, X, BarChart3, Workflow, Link2, Calendar
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

const primaryNavItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Users, label: 'Leads', path: '/dashboard/leads' },
  { icon: UserCheck, label: 'Interested', path: '/dashboard/interested' },
  { icon: CreditCard, label: 'Paid', path: '/dashboard/paid' },
  { icon: Menu, label: 'More', path: 'menu' },
];

const allNavItems = [
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

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: role } = useUserRole();

  const filteredAllNavItems = allNavItems.filter(item => {
    if (item.label === 'Integrations') {
      return role === 'company' || role === 'company_subadmin';
    }
    return true;
  });

  const handleNavClick = (path: string) => {
    if (path === 'menu') {
      setIsMenuOpen(!isMenuOpen);
    } else {
      setIsMenuOpen(false);
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    if (path === 'menu') return isMenuOpen;
    return location.pathname === path;
  };

  return (
    <>
      {/* Full menu overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex flex-col h-full pb-20 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">L³</span>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">Lead Cubed</h1>
                  <p className="text-xs text-muted-foreground">AI-Powered CRM</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 p-4 space-y-1">
              {filteredAllNavItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                    location.pathname === item.path
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {primaryNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive(item.path)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive(item.path) && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
