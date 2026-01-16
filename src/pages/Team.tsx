import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, ChevronRight, Shield, Loader2, ArrowUp, Mail, Trash2, Lock, Pencil } from 'lucide-react';
import { useTeam, AppRole } from '@/hooks/useTeam';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useCompany } from '@/hooks/useCompany';
import { useNavigate } from 'react-router-dom';
import { OrgChart } from '@/components/team/OrgChart';

// Validation schema for team member invitation
const inviteSchema = z.object({
    email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255, { message: "Email must be less than 255 characters" }),
    fullName: z.string().trim().min(1, { message: "Full name is required" }).max(100, { message: "Full name must be less than 100 characters" }).regex(/^[a-zA-Z\s'-]+$/, { message: "Full name can only contain letters, spaces, hyphens, and apostrophes" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72, { message: "Password must be less than 72 characters" }),
    role: z.enum([
        "company", "company_subadmin", "cbo", "vp", "avp",
        "dgm", "agm", "sm", "tl", "bde", "intern", "ca",
        "level_3", "level_4", "level_5", "level_6", "level_7", "level_8",
        "level_9", "level_10", "level_11", "level_12", "level_13", "level_14",
        "level_15", "level_16", "level_17", "level_18", "level_19", "level_20"
    ])
});
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Team() {
    const { members, loading, currentUserRole, promoteUser, setManager, deleteMember, getRoleLabel, getAssignableRoles, refetch } = useTeam();
    const { company } = useCompany();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
    const [selectedManager, setSelectedManager] = useState<string>('');
    const [isPromoting, setIsPromoting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Invite member state
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteFullName, setInviteFullName] = useState('');
    const [invitePassword, setInvitePassword] = useState('');
    const [inviteRole, setInviteRole] = useState<AppRole>('level_10');
    const [isInviting, setIsInviting] = useState(false);

    // Hierarchy Edit State
    const [editHierarchyOpen, setEditHierarchyOpen] = useState(false);
    const [hierarchyForm, setHierarchyForm] = useState<Record<string, string>>({});
    const [isSavingHierarchy, setIsSavingHierarchy] = useState(false);
    const { roleLabels } = useTeam();

    const openEditHierarchy = () => {
        // Initialize form with current labels
        const initialForm: Record<string, string> = {};
        for (let i = 3; i <= 20; i++) {
            const key = `level_${i}` as AppRole;
            initialForm[key] = getRoleLabel(key);
        }
        setHierarchyForm(initialForm);
        setEditHierarchyOpen(true);
    };

    const handleSaveHierarchy = async () => {
        if (!company?.id) return;
        setIsSavingHierarchy(true);
        try {
            const updates: Record<string, string> = {};
            // Only send level_3 to level_20
            Object.keys(hierarchyForm).forEach(key => {
                if (key.startsWith('level_')) {
                    updates[key] = hierarchyForm[key];
                }
            });

            const { error } = await supabase
                .from('company_hierarchies')
                .update(updates)
                .eq('company_id', company.id);

            if (error) throw error;

            toast({ title: "Success", description: "Hierarchy names updated." });
            setEditHierarchyOpen(false);
            refetch();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive"
            });
        }
        setIsSavingHierarchy(false);
    };

    const assignableRoles = getAssignableRoles();

    // Users who can be managers (above the lowest level)
    const potentialManagers = members.filter(m => {
        const roleLevel = getRoleLevelNum(m.role);
        return roleLevel < 10; // Above BDE level
    });

    function getRoleLevelNum(role: AppRole): number {
        const fixedLevels: Partial<Record<AppRole, number>> = {
            platform_admin: 0, company: 1, company_subadmin: 2, cbo: 3, vp: 4, avp: 5,
            dgm: 6, agm: 7, sm: 8, tl: 9, bde: 10, intern: 11, ca: 12
        };

        if (role in fixedLevels) {
            return fixedLevels[role]!;
        }

        if (role.startsWith('level_')) {
            const level = parseInt(role.split('_')[1]);
            return isNaN(level) ? 99 : level;
        }

        return 99;
    }

    const handleInviteMember = async () => {
        // Validate inputs with Zod
        const validationResult = inviteSchema.safeParse({
            email: inviteEmail,
            fullName: inviteFullName,
            password: invitePassword,
            role: inviteRole
        });

        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0];
            toast({
                title: "Validation Error",
                description: firstError.message,
                variant: "destructive"
            });
            return;
        }

        console.log("Starting invite process...", { email: inviteEmail, role: inviteRole });
        setIsInviting(true);

        try {
            console.log("Invoking edge function 'invite-team-member'...");
            // Call secure edge function for team member invitation
            const { data, error } = await supabase.functions.invoke('invite-team-member', {
                body: {
                    email: validationResult.data.email,
                    fullName: validationResult.data.fullName,
                    password: validationResult.data.password,
                    role: validationResult.data.role
                }
            });

            console.log("Edge function returned:", { data, error });

            if (error) {
                console.error("Invoke error details:", error);
                // Extract error message if it's buried in JSON string
                let msg = error.message || "Failed to invite member";
                try {
                    if (error && typeof error === 'object' && 'context' in error) {
                        // Supabase functions error might be in context
                        console.error("Error context:", (error as any).context);
                    }
                } catch (e) { console.error("Error parsing error context", e); }

                throw new Error(msg);
            }

            if (data?.error) {
                console.error("Data error details:", data.error);
                throw new Error(data.error);
            }

            toast({
                title: "Success",
                description: `${inviteFullName} has been added as ${getRoleLabel(inviteRole)}.`,
            });
            setInviteDialogOpen(false);
            setInviteEmail('');
            setInviteFullName('');
            setInvitePassword('');
            setInviteRole('level_10');
            // Refetch team after a short delay
            setTimeout(() => refetch(), 1500);
        } catch (err: any) {
            console.error("Invite member error caught:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to invite member.",
                variant: "destructive"
            });
        } finally {
            console.log("Setting isInviting to false");
            setIsInviting(false);
        }
    };

    const handlePromote = async () => {
        if (!selectedMember || !selectedRole) return;

        setIsPromoting(true);
        const { error } = await promoteUser(selectedMember, selectedRole as AppRole);
        setIsPromoting(false);

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Success",
                description: "User role updated successfully.",
            });
            setSelectedMember(null);
            setSelectedRole('');
        }
    };

    const handleSetManager = async (userId: string, managerId: string) => {
        const { error } = await setManager(userId, managerId || null);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to update manager.",
                variant: "destructive"
            });
        } else {
            toast({
                title: "Success",
                description: "Manager updated successfully.",
            });
        }
    };

    const handleDeleteMember = async () => {
        if (!memberToDelete) return;
        setIsDeleting(true);
        const { error } = await deleteMember(memberToDelete);
        setIsDeleting(false);

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Success",
                description: "Team member removed successfully.",
            });
            setDeleteDialogOpen(false);
            setMemberToDelete(null);
            setSelectedMember(null); // Close the manage dialog too if needed, though state is separate
        }
    };

    // Sort members by role level
    const sortedMembers = [...members].sort((a, b) =>
        getRoleLevelNum(a.role) - getRoleLevelNum(b.role)
    );

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Team Management</h1>
                        <p className="text-muted-foreground">Manage your organization hierarchy and roles.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentUserRole === 'company' && (
                            <Dialog open={editHierarchyOpen} onOpenChange={setEditHierarchyOpen}>
                                <Button variant="outline" onClick={openEditHierarchy}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Hierarchy
                                </Button>
                                <DialogContent className="max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Edit Organization Hierarchy</DialogTitle>
                                        <DialogDescription>
                                            Customize the role names for your organization. Levels 1 & 2 are fixed.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4 items-center p-3 bg-muted/50 rounded-md">
                                            <div className="font-medium text-sm">Level 1 (Fixed)</div>
                                            <div className="text-sm font-bold">{getRoleLabel('company')}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 items-center p-3 bg-muted/50 rounded-md">
                                            <div className="font-medium text-sm">Level 2 (Fixed)</div>
                                            <div className="text-sm font-bold">{getRoleLabel('company_subadmin')}</div>
                                        </div>
                                        {Array.from({ length: 18 }, (_, i) => i + 3).map(level => {
                                            const key = `level_${level}`;
                                            return (
                                                <div key={key} className="flex items-center gap-4">
                                                    <div className="font-medium text-sm text-muted-foreground w-16 shrink-0">Level {level}</div>
                                                    <Input
                                                        value={hierarchyForm[key] || ''}
                                                        onChange={(e) => setHierarchyForm(prev => ({ ...prev, [key]: e.target.value }))}
                                                        placeholder={`Role Name for Level ${level}`}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setHierarchyForm(prev => ({ ...prev, [key]: '' }))}
                                                        title="Clear/Delete Role"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                        <Button className="w-full mt-4" onClick={handleSaveHierarchy} disabled={isSavingHierarchy}>
                                            {isSavingHierarchy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                        {company && company.used_licenses >= company.total_licenses ? (
                            <Button
                                variant="destructive"
                                onClick={() => navigate('/dashboard/company')}
                                className="gap-2"
                            >
                                <Lock className="h-4 w-4" />
                                License Limit Exhausted, Buy Now
                            </Button>
                        ) : (
                            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gradient-primary">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Invite Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite New Team Member</DialogTitle>
                                        <DialogDescription>
                                            Add a new member and assign their role in the organization.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Full Name</label>
                                            <Input
                                                placeholder="Enter full name"
                                                value={inviteFullName}
                                                onChange={(e) => setInviteFullName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Email</label>
                                            <Input
                                                type="email"
                                                placeholder="Enter email address"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Role / Position</label>
                                            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {assignableRoles.map(role => {
                                                        const label = getRoleLabel(role);
                                                        if (!label) return null;
                                                        return (
                                                            <SelectItem key={role} value={role}>
                                                                {label}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                You can only assign roles below your level.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Temporary Password</label>
                                            <Input
                                                type="password"
                                                placeholder="Min 6 characters"
                                                value={invitePassword}
                                                onChange={(e) => setInvitePassword(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Share this password with the new member to let them log in.
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={handleInviteMember}
                                            disabled={isInviting}
                                        >
                                            {isInviting ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Mail className="h-4 w-4 mr-2" />
                                            )}
                                            Send Invitation
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Hierarchy Tree */}
                        <Card className="glass lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Organization Hierarchy</CardTitle>
                                <CardDescription>
                                    {currentUserRole && `Your role: ${getRoleLabel(currentUserRole)}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 overflow-hidden">
                                    {members.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No team members yet.
                                        </div>
                                    ) : (
                                        <OrgChart
                                            members={members}
                                            currentUserRole={currentUserRole}
                                            currentUserId={members.find(m => m.id === (supabase.auth.getUser() as any)?.id)?.id} // We might need a better way to get current ID if not in hook
                                            getRoleLabel={getRoleLabel}
                                            getRoleLevelNum={getRoleLevelNum}
                                            onManage={(member) => {
                                                setSelectedMember(member.id);
                                                setSelectedRole('');
                                                setSelectedManager(member.manager_id || '');
                                            }}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Role Info */}
                        <Card className="glass h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Role Hierarchy
                                </CardTitle>
                                <CardDescription>12-level access control</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Array.from({ length: 20 }, (_, i) => i + 1)
                                    .filter((level) => {
                                        let roleKey: AppRole | null = null;
                                        if (level === 1) roleKey = 'company';
                                        else if (level === 2) roleKey = 'company_subadmin';
                                        else roleKey = `level_${level}` as AppRole;

                                        return roleKey && getRoleLabel(roleKey);
                                    })
                                    .map((originalLevel, index) => {
                                        const displayIndex = index + 1;
                                        let roleKey: AppRole | null = null;
                                        if (originalLevel === 1) roleKey = 'company';
                                        else if (originalLevel === 2) roleKey = 'company_subadmin';
                                        else roleKey = `level_${originalLevel}` as AppRole;

                                        // Should be guaranteed by filter, but safe check
                                        if (!roleKey) return null;
                                        const label = getRoleLabel(roleKey);

                                        return (
                                            <div key={originalLevel} className="flex items-center gap-2 text-sm">
                                                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                                    {displayIndex}
                                                </span>
                                                <span className="font-medium truncate">{label}</span>
                                            </div>
                                        );
                                    })
                                }
                                <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                                    <p>• New users start at lowest level (CA)</p>
                                    <p>• Only users above can promote others</p>
                                    <p>• Users see leads from their hierarchy</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Manage Member Dialog - Controlled by selectedMember state */}
                <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Manage {members.find(m => m.id === selectedMember)?.full_name}</DialogTitle>
                            <DialogDescription>
                                Update role or reporting structure
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Promote to Role
                                </label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={(v) => setSelectedRole(v as AppRole)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select new role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedMember && assignableRoles
                                            .filter(role => {
                                                const member = members.find(m => m.id === selectedMember);
                                                return member && getRoleLevelNum(role) < getRoleLevelNum(member.role);
                                            })
                                            .map(role => {
                                                const label = getRoleLabel(role);
                                                if (!label) return null;
                                                return (
                                                    <SelectItem key={role} value={role}>
                                                        {label}
                                                    </SelectItem>
                                                );
                                            })
                                        }
                                    </SelectContent>
                                </Select>
                                <Button
                                    className="mt-2 w-full"
                                    disabled={!selectedRole || isPromoting}
                                    onClick={handlePromote}
                                >
                                    {isPromoting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Promote
                                </Button>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Set Manager
                                </label>
                                <Select
                                    value={selectedManager || "no_manager"}
                                    onValueChange={(v) => {
                                        const newValue = v === "no_manager" ? "" : v;
                                        setSelectedManager(newValue);
                                        if (selectedMember) handleSetManager(selectedMember, newValue);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no_manager">No Manager</SelectItem>
                                        {selectedMember && potentialManagers
                                            .filter(m => {
                                                const member = members.find(mem => mem.id === selectedMember);
                                                return member && m.id !== member.id && getRoleLevelNum(m.role) < getRoleLevelNum(member.role);
                                            })
                                            .map(m => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.full_name || m.email} ({getRoleLabel(m.role)})
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 border-t">
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => {
                                        if (selectedMember) {
                                            setMemberToDelete(selectedMember);
                                            setDeleteDialogOpen(true);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove Member
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the team member
                            and remove their access to the platform.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteMember();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
