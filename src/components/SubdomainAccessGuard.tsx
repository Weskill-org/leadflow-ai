import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubdomainContext } from '@/contexts/SubdomainContext';
import { useCompany } from '@/hooks/useCompany';
import { getWorkspaceUrl } from '@/hooks/useSubdomain';
import { Loader2 } from 'lucide-react';

interface SubdomainAccessGuardProps {
  children: React.ReactNode;
}

export function SubdomainAccessGuard({ children }: SubdomainAccessGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { isSubdomain, company: subdomainCompany, loading: subdomainLoading } = useSubdomainContext();
  const { company: userCompany, loading: companyLoading } = useCompany();
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for all loading states to complete
    if (authLoading || subdomainLoading || companyLoading) {
      return;
    }

    // If not logged in, allow access (auth page will handle)
    if (!user) {
      setChecking(false);
      return;
    }

    // If not on a subdomain, allow access
    if (!isSubdomain || !subdomainCompany) {
      setChecking(false);
      return;
    }

    // If user doesn't have a company yet, allow access
    if (!userCompany) {
      setChecking(false);
      return;
    }

    // Check if user's company matches the subdomain they're accessing
    if (userCompany.id !== subdomainCompany.id) {
      // User is trying to access a different company's subdomain
      // Redirect them to their own company's subdomain
      const correctUrl = getWorkspaceUrl(userCompany.slug);
      const currentPath = window.location.pathname;
      
      // Show toast-like message before redirecting
      console.log(`Redirecting to correct workspace: ${correctUrl}${currentPath}`);
      
      // Redirect to user's actual workspace
      window.location.href = `${correctUrl}${currentPath}`;
      return;
    }

    // User's company matches subdomain - allow access
    setChecking(false);
  }, [user, authLoading, isSubdomain, subdomainCompany, subdomainLoading, userCompany, companyLoading, navigate]);

  // Show loading while checking access
  if (checking && (authLoading || subdomainLoading || companyLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying workspace access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
