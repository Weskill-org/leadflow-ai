import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useLeadsTable } from '@/hooks/useLeadsTable';
import { useQueryClient } from '@tanstack/react-query';

interface AssignLeadsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedLeadIds: string[];
    onSuccess: () => void;
}

interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
}

export function AssignLeadsDialog({ open, onOpenChange, selectedLeadIds, onSuccess }: AssignLeadsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const { user } = useAuth();
    const { tableName } = useLeadsTable();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (open) {
            fetchProfiles();
        }
    }, [open]);

    const fetchProfiles = async () => {
        try {
            // RLS policy "Users can view profiles in their hierarchy" ensures we only get
            // profiles that are in the user's hierarchy (subordinates and self).
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .neq('id', user?.id); // Exclude current user if we only want "below" in hierarchy

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            toast.error('Failed to load team members');
        }
    };

    const handleAssign = async () => {
        if (!selectedUserId) {
            toast.error('Please select a team member');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from(tableName as any)
                .update({ sales_owner_id: selectedUserId })
                .in('id', selectedLeadIds);

            if (error) throw error;

            toast.success(`Successfully assigned ${selectedLeadIds.length} leads`);
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error assigning leads:', error);
            toast.error('Failed to assign leads');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Leads</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Assign {selectedLeadIds.length} selected lead{selectedLeadIds.length !== 1 ? 's' : ''} to:
                    </p>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                            {profiles.map((profile) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                    {profile.full_name || profile.email || 'Unknown'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={loading || !selectedUserId}>
                        {loading ? 'Assigning...' : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
