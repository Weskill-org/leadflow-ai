import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Phone, Mail, AlertCircle } from 'lucide-react';

// Mock data - filtered for Pending Payments
const leads = [
    { id: 4, name: 'Ishita Reddy', email: 'ishita@example.com', phone: '+91 98765 43213', college: 'SRM Chennai', status: 'Payment Pending', owner: 'Rahul Kumar', date: '2024-03-13', received: '₹2,000', projected: '₹5,000' },
];

export default function PendingPayments() {
    const [searchTerm, setSearchTerm] = useState('');

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
                                {leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell className="font-medium">{lead.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Mail className="h-3 w-3" /> {lead.email}
                                                </span>
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Phone className="h-3 w-3" /> {lead.phone}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{lead.college}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                                                {lead.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{lead.received}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{lead.projected}</TableCell>
                                        <TableCell className="text-right font-bold text-destructive">
                                            ₹{parseInt(lead.projected.replace(/[^0-9]/g, '')) - parseInt(lead.received.replace(/[^0-9]/g, ''))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" className="gradient-primary">
                                                Send Reminder
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
