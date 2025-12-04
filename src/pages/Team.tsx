import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, ChevronRight, Shield } from 'lucide-react';

// Mock hierarchy data
const team = [
    { id: 1, name: 'Aditya Roy', role: 'Company Admin', email: 'aditya@leadcubed.in', reportsTo: null },
    { id: 2, name: 'Priya Sharma', role: 'VP Sales', email: 'priya@leadcubed.in', reportsTo: 'Aditya Roy' },
    { id: 3, name: 'Rahul Verma', role: 'AVP Sales', email: 'rahul@leadcubed.in', reportsTo: 'Priya Sharma' },
    { id: 4, name: 'Amit Singh', role: 'Team Lead', email: 'amit@leadcubed.in', reportsTo: 'Rahul Verma' },
    { id: 5, name: 'Sneha Gupta', role: 'BDE', email: 'sneha@leadcubed.in', reportsTo: 'Amit Singh' },
    { id: 6, name: 'Vikram Malhotra', role: 'Intern', email: 'vikram@leadcubed.in', reportsTo: 'Sneha Gupta' },
];

export default function Team() {
    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Team Management</h1>
                        <p className="text-muted-foreground">Manage your organization hierarchy and roles.</p>
                    </div>
                    <Button className="gradient-primary">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Hierarchy Tree */}
                    <Card className="glass lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Organization Hierarchy</CardTitle>
                            <CardDescription>Visual representation of reporting lines</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {team.map((member, index) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                                        style={{ marginLeft: `${index * 20}px` }}
                                    >
                                        {index > 0 && <div className="w-4 border-l-2 border-b-2 border-muted-foreground/30 h-8 -ml-6 -mt-8 rounded-bl-lg" />}
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="font-bold text-primary">{member.name[0]}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{member.name}</h3>
                                                <Badge variant="outline" className="text-xs">{member.role}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role Info */}
                    <Card className="glass h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Access Control
                            </CardTitle>
                            <CardDescription>Role-based permissions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm">
                                <h4 className="font-semibold mb-1">Admin</h4>
                                <p className="text-muted-foreground">Full access to all leads, settings, and team management.</p>
                            </div>
                            <div className="text-sm">
                                <h4 className="font-semibold mb-1">Manager (VP/AVP)</h4>
                                <p className="text-muted-foreground">Can view and manage leads of their entire downstream hierarchy.</p>
                            </div>
                            <div className="text-sm">
                                <h4 className="font-semibold mb-1">Sales (TL/BDE)</h4>
                                <p className="text-muted-foreground">Can only view and edit their own leads and leads assigned to them.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
