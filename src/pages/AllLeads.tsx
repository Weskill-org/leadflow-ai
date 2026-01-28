import { useCompany } from '@/hooks/useCompany';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RealEstateAllLeads from '@/industries/real_estate/RealEstateAllLeads';
import GenericAllLeads from './GenericAllLeads';

export default function AllLeads() {
  const { company, loading: companyLoading } = useCompany();

  if (companyLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // If company industry is Real Estate, render the Real Estate specific dashboard
  if ((company as any)?.industry === 'real_estate') {
    return <RealEstateAllLeads />;
  }

  // Otherwise render the generic dashboard
  return <GenericAllLeads />;
}
