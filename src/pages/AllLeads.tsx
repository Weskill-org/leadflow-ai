import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, Filter, MoreHorizontal, Phone, Mail, X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeads, useUpdateLead } from '@/hooks/useLeads';
import { usePrograms } from '@/hooks/usePrograms';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, isRoleAllowedToMarkPaid } from '@/hooks/useUserRole';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Constants } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddLeadDialog } from '@/components/leads/AddLeadDialog';
import { UploadLeadsDialog } from '@/components/leads/UploadLeadsDialog';

const statusColors: Record<string, string> = {
  'new': 'bg-blue-500/10 text-blue-500',
  'interested': 'bg-yellow-500/10 text-yellow-500',
  'paid': 'bg-green-500/10 text-green-500',
  'follow_up': 'bg-purple-500/10 text-purple-500',
  'dnd': 'bg-red-500/10 text-red-500',
  'not_interested': 'bg-gray-500/10 text-gray-500',
  'rnr': 'bg-orange-500/10 text-orange-500',
};

export default function AllLeads() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedColleges, setSelectedColleges] = useState<Set<string>>(new Set());
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());

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

  const { data: leads, isLoading } = useLeads({
    search: debouncedSearchQuery,
    statusFilter: selectedStatuses.size === 1 ? Array.from(selectedStatuses)[0] : undefined
  });
  const { data: programs } = usePrograms();
  const updateLead = useUpdateLead();
  const { user } = useAuth();
  const { data: userRole } = useUserRole();

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLead.mutateAsync({
        id: leadId,
        status: newStatus as any
      });
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleProgramChange = async (leadId: string, newProgram: string) => {
    try {
      await updateLead.mutateAsync({
        id: leadId,
        product_purchased: newProgram
      });
      toast.success('Program updated successfully');
    } catch (error) {
      toast.error('Failed to update program');
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
          <h1 className="text-3xl font-bold">All Leads</h1>
          <div className="flex gap-2">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Payment Link</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  leads?.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        {lead.email && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {lead.email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.phone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{lead.college || '-'}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={lead.status}
                          onValueChange={(value) => handleStatusChange(lead.id, value)}
                        >
                          <SelectTrigger className={`w-[140px] h-8 ${statusColors[lead.status] || 'bg-secondary'}`}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {Constants.public.Enums.lead_status.map((status) => (
                              <SelectItem
                                key={status}
                                value={status}
                                className="capitalize"
                                disabled={status === 'paid' && !isRoleAllowedToMarkPaid(userRole)}
                              >
                                {status.replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {lead.sales_owner?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(lead.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={lead.product_purchased || undefined}
                          onValueChange={(value) => handleProgramChange(lead.id, value)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Select Program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs?.map((program) => (
                              <SelectItem key={program.id} value={program.name}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {lead.payment_link ? (
                          <Button
                            variant={lead.status === 'paid' ? 'default' : 'outline'}
                            size="sm"
                            className={`h-8 ${lead.status === 'paid' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(lead.payment_link!);
                                toast.success('Link copied to clipboard');
                              } catch (err) {
                                console.error('Failed to copy:', err);
                                toast.error('Failed to copy link');
                              }
                            }}
                          >
                            {lead.status === 'paid' ? 'Paid' : 'Copy Link'}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={async () => {
                              if (!lead.product_purchased) {
                                toast.error('Please select a program first');
                                return;
                              }

                              const selectedProgram = programs?.find(p => p.name === lead.product_purchased);

                              if (!selectedProgram) {
                                toast.error('Program details not found');
                                return;
                              }

                              // Convert price to paise (assuming price in DB is in INR)
                              const amount = selectedProgram.price * 100;

                              try {
                                toast.loading('Creating payment link...');
                                const { data, error } = await supabase.functions.invoke('create-payment-link', {
                                  body: {
                                    amount,
                                    description: `Payment for ${lead.product_purchased}`,
                                    customer: {
                                      name: lead.name,
                                      email: lead.email || '',
                                      phone: lead.phone || ''
                                    },
                                    reference_id: lead.id
                                  }
                                });

                                if (error) throw error;
                                if (data.error) throw new Error(data.error);

                                await updateLead.mutateAsync({
                                  id: lead.id,
                                  payment_link: data.short_url,
                                  revenue_projected: selectedProgram.price
                                });

                                toast.dismiss();
                                toast.success('Payment link created successfully');
                              } catch (error: any) {
                                toast.dismiss();
                                console.error('Payment Link Error:', error);
                                toast.error(error.message || 'Failed to create payment link');
                              }
                            }}
                          >
                            Create Link
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
