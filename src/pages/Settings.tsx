import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Bell, Shield, User, Globe } from 'lucide-react';

export default function Settings() {
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
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" defaultValue="Aditya Roy" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" defaultValue="aditya@leadcubed.in" disabled />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" defaultValue="+91 98765 43210" />
                                    </div>
                                </div>
                                <Button className="gradient-primary">Save Changes</Button>
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
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
