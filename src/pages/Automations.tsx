import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Workflow, Plus, Zap, ArrowRight, Mail, Phone, UserPlus } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

// Mock automations
const automations = [
    { id: 1, name: 'New Lead Welcome', trigger: 'Lead Created', action: 'Send Email', active: true },
    { id: 2, name: 'Payment Success', trigger: 'Status = Paid', action: 'Update Revenue', active: true },
    { id: 3, name: 'Follow-up Reminder', trigger: 'No Activity 3 Days', action: 'Create Task', active: false },
];

export default function Automations() {
    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Workflow Automations</h1>
                        <p className="text-muted-foreground">Automate repetitive tasks and scale your sales process.</p>
                    </div>
                    <Button className="gradient-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Automation
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {automations.map((auto) => (
                        <Card key={auto.id} className="glass hover:border-primary/50 transition-colors">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${auto.active ? 'bg-primary/10' : 'bg-muted'}`}>
                                        <Workflow className={`h-6 w-6 ${auto.active ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">{auto.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Badge variant="outline" className="bg-background">{auto.trigger}</Badge>
                                            <ArrowRight className="h-3 w-3" />
                                            <Badge variant="outline" className="bg-background">{auto.action}</Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">{auto.active ? 'Active' : 'Paused'}</span>
                                    <Switch checked={auto.active} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Templates Section */}
                <div className="mt-12">
                    <h2 className="text-xl font-bold mb-6">Popular Templates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="glass cursor-pointer hover:bg-card/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-blue-500" />
                                    Auto-Responder
                                </CardTitle>
                                <CardDescription>Send email when lead is created</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="glass cursor-pointer hover:bg-card/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <UserPlus className="h-4 w-4 text-green-500" />
                                    Auto-Assign
                                </CardTitle>
                                <CardDescription>Assign lead based on source</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="glass cursor-pointer hover:bg-card/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    Status Update
                                </CardTitle>
                                <CardDescription>Move to 'Won' on payment</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
