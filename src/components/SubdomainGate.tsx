import { useSubdomainContext } from '@/contexts/SubdomainContext';
import { Loader2 } from 'lucide-react';

interface SubdomainGateProps {
  children: React.ReactNode;
  mainDomainContent: React.ReactNode;
}

export function SubdomainGate({ children, mainDomainContent }: SubdomainGateProps) {
  const { isSubdomain, loading, error, company, isMainDomain } = useSubdomainContext();

  // Show loading state while checking subdomain
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Show error state for invalid subdomains
  if (error && isSubdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Workspace Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <a 
            href="https://fastestcrm.com" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to FastestCRM
          </a>
        </div>
      </div>
    );
  }

  // On main domain (fastestcrm.com, www, localhost, preview domains)
  if (isMainDomain && !isSubdomain) {
    return <>{mainDomainContent}</>;
  }

  // On a valid company subdomain - show full app
  if (isSubdomain && company) {
    return <>{children}</>;
  }

  // Default to main domain content for any unhandled cases
  return <>{mainDomainContent}</>;
}
