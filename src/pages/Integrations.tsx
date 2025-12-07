import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Mail, MessageSquare, Phone, CreditCard, Calendar, FileSpreadsheet, Webhook, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AddIntegrationDialog } from '@/components/integrations/AddIntegrationDialog';

const integrationTypes = [
    { id: 'gmail', name: 'Gmail / Outlook', icon: Mail, description: 'Sync emails and calendar', category: 'Communication' },
    { id: 'whatsapp', name: 'WhatsApp Business', icon: MessageSquare, description: 'Send automated messages', category: 'Communication' },
    { id: 'telephony', name: 'Exotel / Twilio', icon: Phone, description: 'Click-to-call and recording', category: 'Telephony' },
    { id: 'razorpay', name: 'Razorpay', icon: CreditCard, description: 'Payment links and reconciliation', category: 'Payments' },
    { id: 'google_calendar', name: 'Google Calendar', icon: Calendar, description: 'Schedule meetings', category: 'Scheduling' },
    { id: 'google_sheets', name: 'Google Sheets', icon: FileSpreadsheet, description: 'Export/Import leads', category: 'Data' },
    { id: 'webhooks', name: 'Webhooks', icon: Webhook, description: 'Connect custom apps', category: 'Developer' },
];

export default function Integrations() {
    const { user } = useAuth();
    const [selectedIntegration, setSelectedIntegration] = useState<{ id: string, name: string } | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: connectedKeys, isLoading } = useQuery({
        queryKey: ['integration-keys', user?.id],
        queryFn: async (): Promise<{ service_name: string; is_active: boolean | null }[]> => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('integration_api_keys')
                .select('service_name, is_active')
                .eq('user_id', user.id);

            if (error) throw error;
            return (data || []) as { service_name: string; is_active: boolean | null }[];
        },
        enabled: !!user?.id
    });

    const isConnected = (serviceId: string) => {
        return connectedKeys?.some(key => key.service_name === serviceId && key.is_active);
    };

    const handleConnect = (integration: { id: string, name: string }) => {
        setSelectedIntegration(integration);
        setIsDialogOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">Integrations</h1>
                    <p className="text-muted-foreground">Connect Lead Cubed with your favorite tools.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {integrationTypes.map((integration) => {
                            const connected = isConnected(integration.id);
                            return (
                                <Card key={integration.id} className="glass hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                                <integration.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <Badge variant={connected ? "default" : "outline"} className={connected ? "bg-green-500 hover:bg-green-600" : ""}>
                                                {connected ? 'Connected' : 'Disconnected'}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                                        <CardDescription>{integration.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{integration.category}</span>
                                            {connected ? (
                                                <Switch checked={true} />
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleConnect(integration)}>
                                                    Connect
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {selectedIntegration && (
                    <AddIntegrationDialog
                        isOpen={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        serviceName={selectedIntegration.id}
                        displayName={selectedIntegration.name}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
