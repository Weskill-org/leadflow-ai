import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Search, Filter, MoreHorizontal, Phone, Mail, Download
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
import { Constants } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
    'new': 'bg-blue-500/10 text-blue-500',
    'interested': 'bg-yellow-500/10 text-yellow-500',
    'paid': 'bg-green-500/10 text-green-500',
    'follow_up': 'bg-purple-500/10 text-purple-500',
    'dnd': 'bg-red-500/10 text-red-500',
    'not_interested': 'bg-gray-500/10 text-gray-500',
    'rnr': 'bg-orange-500/10 text-orange-500',
};

export default function Paid() {
    const [searchQuery, setSearchQuery] = useState('');
    // Filter for 'paid' status
    const { data: leadsData, isLoading } = useLeads({ search: searchQuery, statusFilter: 'paid' });
    const leads = leadsData?.leads || [];
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone Number</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Payment Link</TableHead>
                                    <TableHead>Revenue Received</TableHead>
                                    <TableHead>Revenue Projected</TableHead>
                                    <TableHead>Revenue Pending</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                            No paid leads found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leads?.map((lead) => {
                                        const revenueReceived = lead.revenue_received || 0;
                                        const revenueProjected = lead.revenue_projected || 0;
                                        const revenuePending = revenueProjected - revenueReceived;

                                        return (
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
                                                <TableCell>
                                                    {lead.sales_owner?.full_name || 'Unknown'}
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
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(revenueReceived)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(revenueProjected)}
                                                </TableCell>
                                                <TableCell className={revenuePending > 0 ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(revenuePending)}
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
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
