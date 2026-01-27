import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Edit2, Trash2, GripVertical, Save, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface CompanyLeadStatus {
    id: string;
    company_id: string;
    label: string;
    value: string;
    color: string;
    category: 'new' | 'paid' | 'interested' | 'other';
    sub_statuses: string[];
    order_index: number;
    is_active: boolean;
}

export default function ManageStatuses() {
    const { company, isCompanyAdmin } = useCompany();
    const { user } = useAuth();
    
    const [isaddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<CompanyLeadStatus | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        label: '',
        color: '#3B82F6',
        category: 'interested',
    });

    const { data: statuses, isLoading, refetch } = useQuery({
        queryKey: ['company-lead-statuses', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data, error } = await supabase
                .from('company_lead_statuses')
                .select('*')
                .eq('company_id', company.id)
                .order('order_index', { ascending: true });
            
            if (error) throw error;
            return data as CompanyLeadStatus[];
        },
        enabled: !!company?.id
    });

    const handleOpenAdd = () => {
        setEditingStatus(null);
        setFormData({ label: '', color: '#3B82F6', category: 'interested' });
        setIsAddDialogOpen(true);
    };

    const handleOpenEdit = (status: CompanyLeadStatus) => {
        setEditingStatus(status);
        setFormData({
            label: status.label,
            color: status.color,
            category: status.category as any,
        });
        setIsAddDialogOpen(true);
    };

    const handleSave = async () => {
        if (!company || !user) return;
        if (!formData.label.trim()) {
            toast.error('Label is required');
            return;
        }

        setSaving(true);
        try {
            const value = formData.label.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
            
            const payload = {
                company_id: company.id,
                label: formData.label.trim(),
                value: editingStatus ? editingStatus.value : value, // Keep original value if editing to avoid breaking old data references, or decide if value should update? Usually value stays stable.
                color: formData.color,
                category: formData.category,
                // For new items, put at end. better logic needed for true reordering but simple append works for now.
                order_index: editingStatus ? editingStatus.order_index : (statuses?.length || 0), 
            };

            if (editingStatus) {
                const { error } = await supabase
                    .from('company_lead_statuses')
                    .update({
                        label: payload.label,
                        color: payload.color,
                        category: payload.category
                    })
                    .eq('id', editingStatus.id);
                if (error) throw error;
                toast.success('Status updated');
            } else {
                 const { error } = await supabase
                    .from('company_lead_statuses')
                    .insert(payload);
                if (error) throw error;
                toast.success('Status created');
            }

            setIsAddDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast.error('Failed to save: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? leads with this status might display incorrectly if not migrated.')) return;
        try {
            const { error } = await supabase.from('company_lead_statuses').delete().eq('id', id);
            if (error) throw error;
            toast.success('Status deleted');
            refetch();
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!isCompanyAdmin) return <div className="p-8 text-center text-red-500">Access Restricted</div>;

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto pb-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Lead Statuses</h1>
                        <p className="text-muted-foreground">Customize the stages of your sales pipeline.</p>
                    </div>
                    <Button onClick={handleOpenAdd}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Status
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pipeline Stages</CardTitle>
                        <CardDescription>
                            Define statuses and map them to system categories (New, Paid, etc.) for reporting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statuses?.map((status) => (
                                    <TableRow key={status.id}>
                                        <TableCell>
                                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Badge variant="outline" style={{ borderColor: status.color, color: status.color }}>
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">
                                                {status.category.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }} />
                                                <span className="text-xs text-muted-foreground uppercase">{status.color}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(status)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(status.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {statuses?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No statuses defined.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isaddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingStatus ? 'Edit Status' : 'Add New Status'}</DialogTitle>
                            <DialogDescription>
                                Configure the display label and behavior of this status.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input 
                                    placeholder="e.g. Meeting Scheduled"
                                    value={formData.label}
                                    onChange={(e) => setFormData({...formData, label: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>System Category</Label>
                                <Select 
                                    value={formData.category} 
                                    onValueChange={(val) => setFormData({...formData, category: val as any})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New (Fresh Leads)</SelectItem>
                                        <SelectItem value="interested">Interested (In Progress)</SelectItem>
                                        <SelectItem value="paid">Paid (Closed Won)</SelectItem>
                                        <SelectItem value="other">Other (Closed Lost / Archive)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Determines how this status is counted in analytics.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Color</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="color" 
                                        className="w-12 h-10 p-1 cursor-pointer"
                                        value={formData.color}
                                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                                    />
                                    <Input 
                                        value={formData.color}
                                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                                        className="uppercase font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Status
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
