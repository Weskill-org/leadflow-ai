import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useCompany } from '@/hooks/useCompany';
import { Tables } from '@/integrations/supabase/types';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { RealEstateLeadsTable } from '@/industries/real_estate/components/RealEstateLeadsTable';
import { useRealEstateLeads } from '@/industries/real_estate/hooks/useRealEstateLeads';
import { RealEstateAssignLeadsDialog } from '@/industries/real_estate/components/RealEstateAssignLeadsDialog';

type Lead = Tables<'leads'> & {
    sales_owner?: {
        full_name: string | null;
    } | null;
};

export default function Interested() {
    const { company } = useCompany();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);

    const isRealEstate = company?.industry === 'real_estate';

    // Fetch confirmed 'interested' statuses
    const { data: interestedStatuses } = useQuery({
        queryKey: ['interested-statuses', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data } = await supabase
                .from('company_lead_statuses' as any)
                .select('value')
                .eq('company_id', company.id)
                .eq('category', 'interested');

            const statuses = data?.map((s: any) => s.value) || [];
            return statuses.length > 0 ? statuses : ['interested'];
        },
        enabled: !!company?.id
    });

    const statusFilter = interestedStatuses && interestedStatuses.length > 0 ? interestedStatuses : ['interested'];

    // 1. Hook options
    const hookOptions = {
        search: searchQuery,
        statusFilter: statusFilter
    };

    // 2. Call BOTH hooks, but rely on `enabled` or just ignore one. 
    // Actually, hooks must be called unconditionally.
    // However, `useLeads` and `useRealEstateLeads` might fetch automatically.
    // We can control `enabled` in their queries if they exposed it, but they don't seem to fully expose `enabled` for the main query easily without modifying hooks.
    // But `useRealEstateLeads` checks `company.id`.

    // Let's just call both. The generic one `useLeads` might return empty or wrong data if we are RE, but we won't use it.
    // Actually `useLeads` detects RE now and queries `leads_real_estate`, so it DOES return data.
    // BUT `useLeads` returns generic `Lead` type, while `useRealEstateLeads` returns `RealEstateLead` with extra fields.
    // We want `useRealEstateLeads` for the extra fields.

    const genericLeadsQuery = useLeads(hookOptions);
    const realEstateLeadsQuery = useRealEstateLeads(hookOptions);

    const isLoading = isRealEstate ? realEstateLeadsQuery.isLoading : genericLeadsQuery.isLoading;
    const refetch = isRealEstate ? realEstateLeadsQuery.refetch : genericLeadsQuery.refetch;

    // Filter Owners (for leads table)
    const { data: owners } = useQuery({
        queryKey: ['leadsFilterOptionsOwners'],
        queryFn: async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name')
                .not('full_name', 'is', null);
            return data?.map(o => ({ label: o.full_name || 'Unknown', value: o.id })) || [];
        }
    });

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
                    <div>
                        <h1 className="text-3xl font-bold">Interested Leads</h1>
                        <p className="text-muted-foreground">Leads marked as interested and ready for follow-up.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search interested leads..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isRealEstate ? (
                            <RealEstateLeadsTable
                                leads={realEstateLeadsQuery.data?.leads || []}
                                loading={realEstateLeadsQuery.isLoading}
                                selectedLeads={selectedLeads}
                                onSelectionChange={setSelectedLeads}
                                owners={owners}
                                onRefetch={realEstateLeadsQuery.refetch}
                            />
                        ) : (
                            <LeadsTable
                                leads={(genericLeadsQuery.data?.leads || []) as Lead[]}
                                loading={genericLeadsQuery.isLoading}
                                selectedLeads={selectedLeads}
                                onSelectionChange={setSelectedLeads}
                                owners={owners}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {isRealEstate && (
                <RealEstateAssignLeadsDialog
                    open={assignDialogOpen}
                    onOpenChange={setAssignDialogOpen}
                    selectedLeadIds={Array.from(selectedLeads)}
                    onSuccess={() => setSelectedLeads(new Set())}
                />
            )}

        </DashboardLayout>
    );
}
