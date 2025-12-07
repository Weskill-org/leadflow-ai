import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Phone, Mail, AlertCircle } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { format } from 'date-fns';

export default function PendingPayments() {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: leads, isLoading } = useLeads({ search: searchTerm });

    const pendingLeads = leads?.filter(lead => {
        const projected = lead.revenue_projected || 0;
        const received = lead.revenue_received || 0;
        return projected > received;
    }) || [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Pending Payments</h1>
                        <p className="text-muted-foreground">Leads where projected revenue exceeds received revenue.</p>
                    </div>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                <Card className="glass">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search pending payments..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                    <TableHead>Contact</TableHead>
                                    <TableHead>College</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead className="text-right">Projected</TableHead>
                                    <TableHead className="text-right">Pending</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : pendingLeads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No pending payments found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pendingLeads.map((lead) => {
                                        const projected = lead.revenue_projected || 0;
                                        const received = lead.revenue_received || 0;
                                        const pending = projected - received;

                                        return (
                                            <TableRow key={lead.id}>
                                                <TableCell className="font-medium">{lead.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        {lead.email && (
                                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                                <Mail className="h-3 w-3" /> {lead.email}
                                                            </span>
                                                        )}
                                                        {lead.phone && (
                                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                                <Phone className="h-3 w-3" /> {lead.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{lead.college || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="capitalize">
                                                        {lead.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(received)}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {formatCurrency(projected)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-destructive">
                                                    {formatCurrency(pending)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" className="gradient-primary">
                                                        Send Reminder
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
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
