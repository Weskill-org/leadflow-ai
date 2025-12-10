import { useState } from 'react';
import { Tables } from '@/integrations/supabase/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLead } from '@/hooks/useLeads';
import { usePrograms } from '@/hooks/usePrograms';
import { useUserRole, isRoleAllowedToMarkPaid } from '@/hooks/useUserRole';
import { Constants } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EditLeadDialog } from './EditLeadDialog';
import { LeadDetailsDialog } from './LeadDetailsDialog';

type Lead = Tables<'leads'> & {
  sales_owner?: {
    full_name: string | null;
  } | null;
};

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  selectedLeads: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
}

const statusColors: Record<string, string> = {
  'new': 'bg-blue-500/10 text-blue-500',
  'interested': 'bg-yellow-500/10 text-yellow-500',
  'paid': 'bg-green-500/10 text-green-500',
  'follow_up': 'bg-purple-500/10 text-purple-500',
  'dnd': 'bg-red-500/10 text-red-500',
  'not_interested': 'bg-gray-500/10 text-gray-500',
  'rnr': 'bg-orange-500/10 text-orange-500',
};

export function LeadsTable({ leads, loading, selectedLeads, onSelectionChange }: LeadsTableProps) {
  const { data: programs } = usePrograms();
  const updateLead = useUpdateLead();
  const { data: userRole } = useUserRole();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

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

  const handleCreatePaymentLink = async (lead: Lead) => {
    console.log('handleCreatePaymentLink called for:', lead);
    console.log('Programs available:', programs);

    if (!lead.product_purchased) {
      toast.error('Please select a program first');
      return;
    }

    const selectedProgram = programs?.find(p => p.name === lead.product_purchased);
    console.log('Selected program:', selectedProgram);

    if (!selectedProgram) {
      toast.error('Program details not found');
      return;
    }

    // Convert price to paise (assuming price in DB is in INR)
    const amount = (selectedProgram.price || 0) * 100;
    console.log('Calculated amount (paise):', amount);

    if (amount <= 0) {
      toast.error('Program price must be greater than 0');
      return;
    }

    // Validation: Require either email or phone
    if (!lead.email && !lead.phone) {
      toast.error('Lead must have an email or phone number to create a payment link');
      return;
    }

    try {
      toast.loading('Creating payment link...');

      const payload = {
        amount,
        description: `Payment for ${lead.product_purchased}`,
        customer: {
          name: lead.name,
          email: lead.email || '',
          phone: lead.phone || ''
        },
        reference_id: lead.id
      };
      console.log('Sending payload:', payload);

      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: payload
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
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No leads found. Add your first lead to get started!</p>
      </div>
    );
  }

  const allSelected = leads.length > 0 && leads.every((lead) => selectedLeads.has(lead.id));

  const toggleAll = () => {
    if (allSelected) {
      const newSelected = new Set(selectedLeads);
      leads.forEach((lead) => newSelected.delete(lead.id));
      onSelectionChange(newSelected);
    } else {
      const newSelected = new Set(selectedLeads);
      leads.forEach((lead) => newSelected.add(lead.id));
      onSelectionChange(newSelected);
    }
  };

  const toggleOne = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Phone Number</TableHead>
              <TableHead className="font-semibold">College</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Owner</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Program</TableHead>
              <TableHead className="font-semibold">Payment Link</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="group">
                <TableCell>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedLeads.has(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                  />
                </TableCell>
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
                          disabled={status === 'paid'}
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
                      onClick={() => handleCreatePaymentLink(lead)}
                    >
                      Create Link
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={() => setViewingLead(lead)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup value={lead.status} onValueChange={(value) => handleStatusChange(lead.id, value)}>
                            {Constants.public.Enums.lead_status.map((status) => (
                              <DropdownMenuRadioItem
                                key={status}
                                value={status}
                                className="capitalize"
                                disabled={status === 'paid'}
                              >
                                {status.replace('_', ' ')}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem onClick={() => handleCreatePaymentLink(lead)}>
                        Create Payment Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditLeadDialog
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        lead={editingLead}
      />

      <LeadDetailsDialog
        open={!!viewingLead}
        onOpenChange={(open) => !open && setViewingLead(null)}
        lead={viewingLead}
      />
    </>
  );
}
