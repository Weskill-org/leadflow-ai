import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSubdomainContext } from '@/contexts/SubdomainContext';

interface CompanyBrandingContextType {
  companyName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  applyBranding: boolean;
}

const CompanyBrandingContext = createContext<CompanyBrandingContextType>({
  companyName: null,
  logoUrl: null,
  primaryColor: null,
  applyBranding: false,
});

function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function CompanyBrandingProvider({ children }: { children: ReactNode }) {
  const { company, isSubdomain } = useSubdomainContext();

  const brandingValue: CompanyBrandingContextType = {
    companyName: company?.name || null,
    logoUrl: company?.logo_url || null,
    primaryColor: company?.primary_color || null,
    applyBranding: !!company,
  };

  useEffect(() => {
    if (!brandingValue.applyBranding || !company?.primary_color) {
      // Reset to default colors
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--ring');
      document.documentElement.style.removeProperty('--sidebar-primary');
      document.documentElement.style.removeProperty('--sidebar-ring');
      return;
    }

    try {
      const hslColor = hexToHsl(company.primary_color);

      // Apply primary color to CSS variables
      document.documentElement.style.setProperty('--primary', hslColor);
      document.documentElement.style.setProperty('--accent', hslColor);
      document.documentElement.style.setProperty('--ring', hslColor);
      document.documentElement.style.setProperty('--sidebar-primary', hslColor);
      document.documentElement.style.setProperty('--sidebar-ring', hslColor);
    } catch (e) {
      console.error('Failed to apply company branding:', e);
    }

    return () => {
      // Cleanup on unmount
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--ring');
      document.documentElement.style.removeProperty('--sidebar-primary');
      document.documentElement.style.removeProperty('--sidebar-ring');
    };
  }, [brandingValue.applyBranding, company?.primary_color]);

  return (
    <CompanyBrandingContext.Provider value={brandingValue}>
      {children}
    </CompanyBrandingContext.Provider>
  );
}

export function useCompanyBranding() {
  return useContext(CompanyBrandingContext);
}
