import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Bell, Shield, User, Globe, Loader2, Database } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManageLeadAttributes from './ManageLeadAttributes';
import { useCompany } from '@/hooks/useCompany';

export default function Settings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: ''
    });
    const [passwordData, setPasswordData] = useState({
        password: '',
        confirmPassword: ''
    });
    const { isCompanyAdmin } = useCompany();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                email: profile.email || user?.email || '',
                phone: profile.phone || ''
            });
        }
    }, [profile, user]);

    const updateProfileMutation = useMutation({
        mutationFn: async (newData: typeof formData) => {
            if (!user?.id) throw new Error('No user');

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: newData.full_name,
                    phone: newData.phone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
            toast({
                title: "Profile updated",
                description: "Your profile information has been saved successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive"
            });
        }
    });

    const updatePasswordMutation = useMutation({
        mutationFn: async (password: string) => {
            const { error } = await supabase.auth.updateUser({
                password: password
            });
            if (error) throw error;
        },
        onSuccess: () => {
            setPasswordData({ password: '', confirmPassword: '' });
            toast({
                title: "Password updated",
                description: "Your password has been changed successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update password",
                variant: "destructive"
            });
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setPasswordData(prev => ({ ...prev, [id]: value }));
    };

    const handlePasswordSave = () => {
        if (passwordData.password !== passwordData.confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive"
            });
            return;
        }
        if (passwordData.password.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive"
            });
            return;
        }
        updatePasswordMutation.mutate(passwordData.password);
    };

    const handleSave = () => {
        updateProfileMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and application preferences.</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="mb-8">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <User className="h-4 w-4" /> Profile
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-2">
                            <Bell className="h-4 w-4" /> Notifications
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Security
                        </TabsTrigger>
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" /> General
                        </TabsTrigger>
                        {isCompanyAdmin && (
                            <TabsTrigger value="attributes" className="flex items-center gap-2">
                                <Database className="h-4 w-4" /> Lead Attributes
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="profile">
                        <Card className="glass max-w-2xl">
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your personal details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            value={formData.email}
                                            disabled
                                            className="bg-muted"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                </div>
                                <Button
                                    className="gradient-primary"
                                    onClick={handleSave}
                                    disabled={updateProfileMutation.isPending}
                                >
                                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications">
                        <Card className="glass max-w-2xl">
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>Choose what you want to be notified about.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Receive daily summaries and alerts.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Lead Assignments</Label>
                                        <p className="text-sm text-muted-foreground">Notify when a new lead is assigned.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Marketing Updates</Label>
                                        <p className="text-sm text-muted-foreground">Receive news about new features.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card className="glass max-w-2xl">
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>Manage your password and security preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={passwordData.password}
                                            onChange={handlePasswordChange}
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                                <Button
                                    className="gradient-primary"
                                    onClick={handlePasswordSave}
                                    disabled={updatePasswordMutation.isPending}
                                >
                                    {updatePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="general">
                        <Card className="glass max-w-2xl">
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>Manage general application settings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">General settings configuration coming soon.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {isCompanyAdmin && (
                        <TabsContent value="attributes">
                            <ManageLeadAttributes />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
