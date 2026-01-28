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

type Lead = Tables<'leads'> & {
    sales_owner?: {
        full_name: string | null;
    } | null;
};

export default function Paid() {
    const { company } = useCompany();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

    const isRealEstate = company?.industry === 'real_estate';

    // Fetch confirmed 'paid' statuses
    const { data: paidStatuses } = useQuery({
        queryKey: ['paid-statuses', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data } = await supabase
                .from('company_lead_statuses' as any)
                .select('value')
                .eq('company_id', company.id)
                .eq('category', 'paid');

            const statuses = data?.map((s: any) => s.value) || [];
            return statuses.length > 0 ? statuses : ['paid'];
        },
        enabled: !!company?.id
    });

    const statusFilter = paidStatuses && paidStatuses.length > 0 ? paidStatuses : ['paid'];

    const hookOptions = {
        search: searchQuery,
        statusFilter: statusFilter
    };

    const genericLeadsQuery = useLeads(hookOptions);
    const realEstateLeadsQuery = useRealEstateLeads(hookOptions);

    const isLoading = isRealEstate ? realEstateLeadsQuery.isLoading : genericLeadsQuery.isLoading;

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
                        <h1 className="text-3xl font-bold">Paid Leads</h1>
                        <p className="text-muted-foreground">Successfully converted leads and payments.</p>
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
                                    placeholder="Search paid leads..."
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
        </DashboardLayout>
    );
}
