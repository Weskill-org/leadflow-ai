import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, Filter, MoreHorizontal, Phone, Mail, X, ChevronLeft, ChevronRight, Users
} from 'lucide-react';

import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/hooks/useAuth';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Constants } from '@/integrations/supabase/types';
import { AddLeadDialog } from '@/components/leads/AddLeadDialog';
import { UploadLeadsDialog } from '@/components/leads/UploadLeadsDialog';
import { AssignLeadsDialog } from '@/components/leads/AssignLeadsDialog';
import { LeadsTable } from '@/components/leads/LeadsTable';



export default function AllLeads() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedColleges, setSelectedColleges] = useState<Set<string>>(new Set());
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['leadsFilterOptions'],
    queryFn: async () => {
      const { data: owners } = await supabase
        .from('profiles')
        .select('id, full_name')
        .not('full_name', 'is', null);

      // For colleges and programs, we might want to fetch distinct values from leads table
      // or use the programs table for programs.
      // Let's use programs table for programs.
      const { data: programs } = await supabase.from('programs').select('name');

      const { data: leadsData } = await supabase.from('leads').select('college');
      const uniqueColleges = Array.from(new Set(leadsData?.map(l => l.college).filter(Boolean)));

      return {
        owners: owners?.map(o => ({ label: o.full_name || 'Unknown', value: o.id })) || [],
        programs: ((programs || []) as { name: string }[]).map(p => ({ label: p.name, value: p.name })),
        colleges: uniqueColleges.map(c => ({ label: c!, value: c! })),
        statuses: Constants.public.Enums.lead_status.map(s => ({ label: s.replace('_', ' '), value: s }))
      };
    }
  });

  const { data: leadsData, isLoading } = useLeads({
    search: debouncedSearchQuery,
    statusFilter: selectedStatuses.size === 1 ? Array.from(selectedStatuses)[0] : undefined,
    page,
    pageSize
  });
  const leads = leadsData?.leads || [];
  const totalCount = leadsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const { user } = useAuth();

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
          <h1 className="text-3xl font-bold">All Leads</h1>
          <div className="flex gap-2">
            {selectedLeads.size > 0 && (
              <Button onClick={() => setAssignDialogOpen(true)} variant="secondary">
                <Users className="mr-2 h-4 w-4" />
                Assign {selectedLeads.size} to...
              </Button>
            )}
            <UploadLeadsDialog />
            <AddLeadDialog />
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
                    title="College"
                    options={filterOptions.colleges}
                    selectedValues={selectedColleges}
                    onSelectionChange={setSelectedColleges}
                  />
                  <MultiSelectFilter
                    title="Program"
                    options={filterOptions.programs}
                    selectedValues={selectedPrograms}
                    onSelectionChange={setSelectedPrograms}
                  />
                  {(selectedOwners.size > 0 || selectedStatuses.size > 0 || selectedColleges.size > 0 || selectedPrograms.size > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOwners(new Set());
                        setSelectedStatuses(new Set());
                        setSelectedColleges(new Set());
                        setSelectedPrograms(new Set());
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
            <LeadsTable
              leads={leads}
              loading={isLoading}
              selectedLeads={selectedLeads}
              onSelectionChange={setSelectedLeads}
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

      <AssignLeadsDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedLeadIds={Array.from(selectedLeads)}
        onSuccess={() => setSelectedLeads(new Set())}
      />
    </DashboardLayout>
  );
}
