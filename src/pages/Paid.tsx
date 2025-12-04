import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Phone, Mail } from 'lucide-react';

// Mock data - filtered for Paid
const leads = [
    { id: 2, name: 'Sneha Gupta', email: 'sneha@example.com', phone: '+91 98765 43211', college: 'BITS Pilani', status: 'Paid', owner: 'Priya Singh', date: '2024-03-14', amount: '₹5,000' },
];

export default function Paid() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <DashboardLayout>
            <div className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Paid Leads</h1>
                        <p className="text-muted-foreground">Successfully converted leads and payments.</p>
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
                                    placeholder="Search paid leads..."
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
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Date</TableHead>
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
                                            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                                                {lead.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-success">{lead.amount}</TableCell>
                                        <TableCell>{lead.owner}</TableCell>
                                        <TableCell className="text-muted-foreground">{lead.date}</TableCell>
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
