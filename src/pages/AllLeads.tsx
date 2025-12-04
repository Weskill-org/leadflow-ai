import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Search, Filter, Download, Plus, MoreHorizontal, Phone, Mail
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const leads = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav@example.com', phone: '+91 98765 43210', college: 'IIT Delhi', status: 'Interested', owner: 'Rahul Kumar', date: '2024-03-15' },
  { id: 2, name: 'Sneha Gupta', email: 'sneha@example.com', phone: '+91 98765 43211', college: 'BITS Pilani', status: 'Paid', owner: 'Priya Singh', date: '2024-03-14' },
  { id: 3, name: 'Rohan Verma', email: 'rohan@example.com', phone: '+91 98765 43212', college: 'VIT Vellore', status: 'Follow-up', owner: 'Amit Patel', date: '2024-03-14' },
  { id: 4, name: 'Ishita Reddy', email: 'ishita@example.com', phone: '+91 98765 43213', college: 'SRM Chennai', status: 'New', owner: 'Rahul Kumar', date: '2024-03-13' },
  { id: 5, name: 'Kabir Singh', email: 'kabir@example.com', phone: '+91 98765 43214', college: 'Manipal', status: 'DND', owner: 'Priya Singh', date: '2024-03-13' },
];

const statusColors: Record<string, string> = {
  'New': 'bg-blue-500/10 text-blue-500',
  'Interested': 'bg-yellow-500/10 text-yellow-500',
  'Paid': 'bg-green-500/10 text-green-500',
  'Follow-up': 'bg-purple-500/10 text-purple-500',
  'DND': 'bg-red-500/10 text-red-500',
};

export default function AllLeads() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">All Leads</h1>
            <p className="text-muted-foreground">Manage and track all your leads in one place.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        <Card className="glass">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
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
                  <TableHead>Owner</TableHead>
                  <TableHead>Date</TableHead>
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
                      <Badge variant="secondary" className={statusColors[lead.status] || 'bg-secondary'}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.owner}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.date}</TableCell>
                    <TableCell className="text-right">
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
