import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { Mail, Phone, Building, Calendar, User, CreditCard, Link } from 'lucide-react';

type Lead = Tables<'leads'> & {
    sales_owner?: {
        full_name: string | null;
    } | null;
};

interface LeadDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead: Lead | null;
}

export function LeadDetailsDialog({ open, onOpenChange, lead }: LeadDetailsDialogProps) {
    if (!lead) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Lead Details</DialogTitle>
                    <DialogDescription>
                        Detailed information about {lead.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> Name
                            </h4>
                            <p className="text-sm font-semibold">{lead.name}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Building className="h-4 w-4" /> College
                            </h4>
                            <p className="text-sm">{lead.college || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Email
                            </h4>
                            <p className="text-sm">{lead.email || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Phone
                            </h4>
                            <p className="text-sm">{lead.phone || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> Owner
                            </h4>
                            <p className="text-sm">{lead.sales_owner?.full_name || 'Unknown'}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Created Date
                            </h4>
                            <p className="text-sm">{format(new Date(lead.created_at), 'PPP')}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Program
                            </h4>
                            <p className="text-sm">{lead.product_purchased || 'None'}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Link className="h-4 w-4" /> Payment Link
                            </h4>
                            <p className="text-sm truncate max-w-[200px]" title={lead.payment_link || ''}>
                                {lead.payment_link ? (
                                    <a href={lead.payment_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        View Link
                                    </a>
                                ) : 'Not generated'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 capitalize">
                            {lead.status.replace('_', ' ')}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
