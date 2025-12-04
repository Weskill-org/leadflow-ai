import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Mail, MessageSquare, Phone, CreditCard, Calendar, FileSpreadsheet, Webhook } from 'lucide-react';

const integrations = [
    { id: 1, name: 'Gmail / Outlook', icon: Mail, description: 'Sync emails and calendar', connected: true, category: 'Communication' },
    { id: 2, name: 'WhatsApp Business', icon: MessageSquare, description: 'Send automated messages', connected: true, category: 'Communication' },
    { id: 3, name: 'Exotel / Twilio', icon: Phone, description: 'Click-to-call and recording', connected: false, category: 'Telephony' },
    { id: 4, name: 'Razorpay', icon: CreditCard, description: 'Payment links and reconciliation', connected: true, category: 'Payments' },
    { id: 5, name: 'Google Calendar', icon: Calendar, description: 'Schedule meetings', connected: true, category: 'Scheduling' },
    { id: 6, name: 'Google Sheets', icon: FileSpreadsheet, description: 'Export/Import leads', connected: false, category: 'Data' },
    { id: 7, name: 'Webhooks', icon: Webhook, description: 'Connect custom apps', connected: false, category: 'Developer' },
];

export default function Integrations() {
    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">Integrations</h1>
                    <p className="text-muted-foreground">Connect Lead Cubed with your favorite tools.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.map((integration) => (
                        <Card key={integration.id} className="glass hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                        <integration.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <Badge variant={integration.connected ? "default" : "outline"} className={integration.connected ? "bg-green-500 hover:bg-green-600" : ""}>
                                        {integration.connected ? 'Connected' : 'Disconnected'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg">{integration.name}</CardTitle>
                                <CardDescription>{integration.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{integration.category}</span>
                                    <Switch checked={integration.connected} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
