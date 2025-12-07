import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneForwarded, CheckCircle2, XCircle, Clock, Play, Pause, SkipForward } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads, useUpdateLead } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type LeadStatus = Database['public']['Enums']['lead_status'];

export default function AutoDialer() {
    const [isDialing, setIsDialing] = useState(false);
    const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
    const [callStatus, setCallStatus] = useState<LeadStatus | ''>('');

    // Fetch only 'new' leads for auto-dialer
    const { data: leads, isLoading } = useLeads({ statusFilter: 'new' });
    const updateLead = useUpdateLead();

    const currentLead = leads?.[currentLeadIndex];

    // Reset index if it goes out of bounds (e.g. after list update)
    useEffect(() => {
        if (leads && currentLeadIndex >= leads.length && leads.length > 0) {
            setCurrentLeadIndex(0);
        }
    }, [leads, currentLeadIndex]);

    const startDialing = () => {
        if (!leads || leads.length === 0) {
            toast.error("No new leads to dial");
            return;
        }
        setIsDialing(true);
        setCurrentLeadIndex(0);
    };

    const stopDialing = () => {
        setIsDialing(false);
    };

    const handleCallOutcome = async () => {
        if (!currentLead || !callStatus) return;

        try {
            await updateLead.mutateAsync({
                id: currentLead.id,
                status: callStatus as LeadStatus
            });

            toast.success(`Lead marked as ${callStatus}`);
            setCallStatus('');

            // Move to next lead
            if (currentLeadIndex < (leads?.length || 0) - 1) {
                setCurrentLeadIndex(prev => prev + 1);
            } else {
                setIsDialing(false);
                toast.success('Dialing list completed!');
                setCurrentLeadIndex(0);
            }
        } catch (error) {
            toast.error("Failed to update lead status");
            console.error(error);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">Auto Dialer</h1>
                    <p className="text-muted-foreground">Sequential calling for high-velocity sales. Focusing on 'New' leads.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Call Card */}
                    <Card className="lg:col-span-2 glass border-primary/20">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <PhoneForwarded className="h-5 w-5 text-primary animate-pulse" />
                                        Active Call
                                    </CardTitle>
                                    <CardDescription>
                                        {isDialing ? 'Dialing in progress...' : 'Ready to start dialing'}
                                    </CardDescription>
                                </div>
                                <Badge variant={isDialing ? "default" : "secondary"} className="text-lg px-4 py-1">
                                    {isDialing ? 'ON CALL' : 'IDLE'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {isDialing && currentLead ? (
                                <div className="text-center py-8 space-y-6">
                                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <a href={`tel:${currentLead.phone}`} className="flex items-center justify-center w-full h-full">
                                            <Phone className="h-10 w-10 text-primary" />
                                        </a>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">{currentLead.name}</h2>
                                        <a href={`tel:${currentLead.phone}`} className="text-xl text-primary hover:underline block mb-1">
                                            {currentLead.phone}
                                        </a>
                                        <p className="text-sm text-muted-foreground mt-2">{currentLead.college || 'No College'}</p>
                                    </div>

                                    <div className="flex justify-center gap-4 max-w-md mx-auto">
                                        <Select value={callStatus} onValueChange={(val) => setCallStatus(val as LeadStatus)}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Select Outcome" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="interested">Interested</SelectItem>
                                                <SelectItem value="follow_up">Follow Up</SelectItem>
                                                <SelectItem value="rnr">RNR (No Response)</SelectItem>
                                                <SelectItem value="not_interested">Not Interested</SelectItem>
                                                <SelectItem value="dnd">DND</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button onClick={handleCallOutcome} disabled={!callStatus} className="gradient-primary">
                                            Next Call <SkipForward className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground mb-6">
                                        {leads?.length || 0} 'New' leads queued for dialing. Click start to begin.
                                    </p>
                                    <Button size="lg" onClick={startDialing} disabled={!leads || leads.length === 0} className="gradient-primary text-lg px-8">
                                        <Play className="mr-2 h-5 w-5" /> Start Auto Dial
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Queue List */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Call Queue</CardTitle>
                            <CardDescription>{leads?.length || 0} leads remaining</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                {leads?.map((lead, index) => (
                                    <div
                                        key={lead.id}
                                        className={`p-4 rounded-lg border ${index === currentLeadIndex && isDialing
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-card/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium">{lead.name}</span>
                                            {index < currentLeadIndex && <CheckCircle2 className="h-4 w-4 text-success" />}
                                            {index === currentLeadIndex && isDialing && <Clock className="h-4 w-4 text-primary animate-spin-slow" />}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex justify-between">
                                            <span>{lead.phone}</span>
                                            <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                                {(!leads || leads.length === 0) && (
                                    <div className="text-center text-muted-foreground py-4">
                                        No new leads found.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
