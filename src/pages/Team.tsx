import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, ChevronRight, Shield, Loader2, ArrowUp, Mail } from 'lucide-react';
import { useTeam, AppRole } from '@/hooks/useTeam';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

export default function Team() {
    const { members, loading, currentUserRole, promoteUser, setManager, getRoleLabel, getAssignableRoles, refetch } = useTeam();
    const { toast } = useToast();
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
    const [selectedManager, setSelectedManager] = useState<string>('');
    const [isPromoting, setIsPromoting] = useState(false);
    
    // Invite member state
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteFullName, setInviteFullName] = useState('');
    const [invitePassword, setInvitePassword] = useState('');
    const [inviteRole, setInviteRole] = useState<AppRole>('ca');
    const [isInviting, setIsInviting] = useState(false);

    const assignableRoles = getAssignableRoles();
    
    // Users who can be managers (above the lowest level)
    const potentialManagers = members.filter(m => {
        const roleLevel = getRoleLevelNum(m.role);
        return roleLevel < 10; // Above BDE level
    });

    function getRoleLevelNum(role: AppRole): number {
        const levels: Record<AppRole, number> = {
            company: 1, company_subadmin: 2, cbo: 3, vp: 4, avp: 5,
            dgm: 6, agm: 7, sm: 8, tl: 9, bde: 10, intern: 11, ca: 12
        };
        return levels[role] || 99;
    }

    const handleInviteMember = async () => {
        if (!inviteEmail || !inviteFullName || !invitePassword) {
            toast({
                title: "Error",
                description: "Please fill in all fields.",
                variant: "destructive"
            });
            return;
        }

        if (invitePassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters.",
                variant: "destructive"
            });
            return;
        }

        setIsInviting(true);
        
        try {
            // Create user with Supabase auth
            const { data, error } = await supabase.auth.signUp({
                email: inviteEmail,
                password: invitePassword,
                options: {
                    emailRedirectTo: `${window.location.origin}/`,
                    data: { full_name: inviteFullName }
                }
            });

            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                });
            } else if (data.user) {
                // Update the user's role if not the default 'ca'
                if (inviteRole !== 'bde') {
                    await supabase
                        .from('user_roles')
                        .update({ role: inviteRole })
                        .eq('user_id', data.user.id);
                }
                
                toast({
                    title: "Success",
                    description: `${inviteFullName} has been added as ${getRoleLabel(inviteRole)}.`,
                });
                setInviteDialogOpen(false);
                setInviteEmail('');
                setInviteFullName('');
                setInvitePassword('');
                setInviteRole('ca');
                // Refetch team after a short delay to allow the trigger to create profile
                setTimeout(() => refetch(), 1000);
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to invite member.",
                variant: "destructive"
            });
        }
        
        setIsInviting(false);
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
                                            {assignableRoles.map(role => (
                                                <SelectItem key={role} value={role}>
                                                    {getRoleLabel(role)}
                                                </SelectItem>
                                            ))}
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
                                <div className="space-y-3">
                                    {sortedMembers.map((member) => {
                                        const roleLevel = getRoleLevelNum(member.role);
                                        const indent = Math.min(roleLevel - 1, 6) * 16;
                                        const canManage = currentUserRole && 
                                            getRoleLevelNum(currentUserRole) < roleLevel;
                                        
                                        return (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                                                style={{ marginLeft: `${indent}px` }}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="font-bold text-primary">
                                                        {member.full_name?.[0] || member.email?.[0] || '?'}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold truncate">
                                                            {member.full_name || 'Unnamed User'}
                                                        </h3>
                                                        <Badge variant="outline" className="text-xs shrink-0">
                                                            {getRoleLabel(member.role)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                                                    {member.manager && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Reports to: {member.manager.full_name}
                                                        </p>
                                                    )}
                                                </div>
                                                {canManage && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedMember(member.id);
                                                                    setSelectedRole('');
                                                                    setSelectedManager(member.manager_id || '');
                                                                }}
                                                            >
                                                                <ArrowUp className="h-4 w-4 mr-1" />
                                                                Manage
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Manage {member.full_name}</DialogTitle>
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
                                                                            {assignableRoles
                                                                                .filter(role => getRoleLevelNum(role) < getRoleLevelNum(member.role))
                                                                                .map(role => (
                                                                                    <SelectItem key={role} value={role}>
                                                                                        {getRoleLabel(role)}
                                                                                    </SelectItem>
                                                                                ))
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
                                                                        value={selectedManager} 
                                                                        onValueChange={(v) => {
                                                                            setSelectedManager(v);
                                                                            handleSetManager(member.id, v);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select manager" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="">No Manager</SelectItem>
                                                                            {potentialManagers
                                                                                .filter(m => m.id !== member.id && getRoleLevelNum(m.role) < getRoleLevelNum(member.role))
                                                                                .map(m => (
                                                                                    <SelectItem key={m.id} value={m.id}>
                                                                                        {m.full_name || m.email} ({getRoleLabel(m.role)})
                                                                                    </SelectItem>
                                                                                ))
                                                                            }
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {members.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No team members yet.
                                        </div>
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
                                {[
                                    { role: 'company', desc: 'Full system access' },
                                    { role: 'company_subadmin', desc: 'Admin with some restrictions' },
                                    { role: 'cbo', desc: 'Chief Business Officer' },
                                    { role: 'vp', desc: 'Vice President' },
                                    { role: 'avp', desc: 'Assistant VP' },
                                    { role: 'dgm', desc: 'Deputy General Manager' },
                                    { role: 'agm', desc: 'Assistant General Manager' },
                                    { role: 'sm', desc: 'Sales Manager' },
                                    { role: 'tl', desc: 'Team Lead' },
                                    { role: 'bde', desc: 'Business Development' },
                                    { role: 'intern', desc: 'Intern' },
                                    { role: 'ca', desc: 'Campus Ambassador' },
                                ].map(({ role, desc }, idx) => (
                                    <div key={role} className="flex items-center gap-2 text-sm">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {idx + 1}
                                        </span>
                                        <span className="font-medium">{getRoleLabel(role as AppRole)}</span>
                                        <span className="text-muted-foreground text-xs">- {desc}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                                    <p>• New users start at lowest level (CA)</p>
                                    <p>• Only users above can promote others</p>
                                    <p>• Users see leads from their hierarchy</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
