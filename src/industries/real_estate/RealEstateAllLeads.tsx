import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, X, ChevronLeft, ChevronRight, Users, Trash2, Home } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import {
  RealEstateLeadsTable,
} from './components/RealEstateLeadsTable';
import { RealEstateAddLeadDialog } from './components/RealEstateAddLeadDialog';
import { RealEstateAssignLeadsDialog } from './components/RealEstateAssignLeadsDialog';
import { useRealEstateLeads } from './hooks/useRealEstateLeads';
import { REAL_ESTATE_PROPERTY_TYPES } from './config';

export default function RealEstateAllLeads() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const { company } = useCompany();
  const { data: userRole } = useUserRole();

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['realEstateLeadsFilterOptions', company?.id],
    queryFn: async () => {
      if (!company?.id) return null;

      // Fetch owners (profiles)
      const { data: ownersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', company.id)
        .not('full_name', 'is', null);

      let activeOwners = ownersData || [];
      if (activeOwners.length > 0) {
        const ownerIds = activeOwners.map(o => o.id);
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('user_id', ownerIds);

        const activeUserIds = new Set(rolesData?.map(r => r.user_id));
        activeOwners = activeOwners.filter(o => activeUserIds.has(o.id));
      }

      const { data: statusesData } = await supabase
        .from('company_lead_statuses' as any)
        .select('label, value, category, order_index')
        .eq('company_id', company.id)
        .order('order_index');

      const statuses = statusesData && statusesData.length > 0
        ? statusesData.map((s: any) => ({
          label: s.label,
          value: s.value,
          group: s.category
        }))
        : [];

      return {
        owners: activeOwners.map(o => ({ label: o.full_name || 'Unknown', value: o.id })),
        statuses,
        propertyTypes: REAL_ESTATE_PROPERTY_TYPES.map(t => ({ label: t, value: t })),
      };
    },
    enabled: !!company?.id
  });

  const { data: leadsData, isLoading, refetch } = useRealEstateLeads({
    search: debouncedSearchQuery,
    statusFilter: selectedStatuses.size === 1 ? Array.from(selectedStatuses)[0] : undefined,
    ownerFilter: Array.from(selectedOwners),
    propertyTypeFilter: Array.from(selectedPropertyTypes),
    page,
    pageSize
  });

  const leads = leadsData?.leads || [];
  const totalCount = leadsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleDeleteLeads = async () => {
    if (!confirm('Are you sure you want to delete the selected leads? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads_real_estate')
        .delete()
        .in('id', Array.from(selectedLeads));

      if (error) throw error;

      toast.success(`Successfully deleted ${selectedLeads.size} leads`);
      setSelectedLeads(new Set());
      await refetch();
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Failed to delete leads');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Real Estate Leads</h1>
          </div>
          <div className="flex gap-2">
            {selectedLeads.size > 0 && (
              <>
                {(userRole === 'company' || userRole === 'company_subadmin') && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteLeads}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete {selectedLeads.size}
                  </Button>
                )}
                <Button onClick={() => setAssignDialogOpen(true)} variant="secondary">
                  <Users className="mr-2 h-4 w-4" />
                  Assign {selectedLeads.size} to...
                </Button>
              </>
            )}
            <RealEstateAddLeadDialog />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-2 pt-2">
              {filterOptions && (
                <>
                  <MultiSelectFilter
                    title="Owner"
                    options={filterOptions.owners}
                    selectedValues={selectedOwners}
                    onSelectionChange={setSelectedOwners}
                  />
                  <MultiSelectFilter
                    title="Status"
                    options={filterOptions.statuses}
                    selectedValues={selectedStatuses}
                    onSelectionChange={setSelectedStatuses}
                  />
                  <MultiSelectFilter
                    title="Property Type"
                    options={filterOptions.propertyTypes}
                    selectedValues={selectedPropertyTypes}
                    onSelectionChange={setSelectedPropertyTypes}
                  />
                  {(selectedOwners.size > 0 || selectedStatuses.size > 0 || selectedPropertyTypes.size > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOwners(new Set());
                        setSelectedStatuses(new Set());
                        setSelectedPropertyTypes(new Set());
                      }}
                      className="h-8 px-2 lg:px-3"
                    >
                      Reset
                      <X className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <RealEstateLeadsTable
              leads={leads}
              loading={isLoading}
              selectedLeads={selectedLeads}
              onSelectionChange={setSelectedLeads}
              owners={filterOptions?.owners || []}
              onRefetch={refetch}
            />
          </CardContent>
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} leads
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {page} of {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <RealEstateAssignLeadsDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedLeadIds={Array.from(selectedLeads)}
        onSuccess={() => setSelectedLeads(new Set())}
      />
    </DashboardLayout>
  );
}
