import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneForwarded, CheckCircle2, XCircle, Clock, Play, Pause, SkipForward } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock leads for dialing
const dialList = [
    { id: 1, name: 'Aarav Sharma', phone: '+91 98765 43210', status: 'New', college: 'IIT Delhi' },
    { id: 2, name: 'Rohan Verma', phone: '+91 98765 43212', status: 'Follow-up', college: 'VIT Vellore' },
    { id: 3, name: 'Ishita Reddy', phone: '+91 98765 43213', status: 'New', college: 'SRM Chennai' },
];

export default function AutoDialer() {
    const [isDialing, setIsDialing] = useState(false);
    const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
    const [callStatus, setCallStatus] = useState('');

    const currentLead = dialList[currentLeadIndex];

    const startDialing = () => {
        setIsDialing(true);
        // In a real app, this would trigger the telephony integration
    };

    const stopDialing = () => {
        setIsDialing(false);
    };

    const nextCall = () => {
        if (currentLeadIndex < dialList.length - 1) {
            setCurrentLeadIndex(currentLeadIndex + 1);
            setCallStatus('');
        } else {
            setIsDialing(false);
            alert('Dialing list completed!');
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">Auto Dialer</h1>
                    <p className="text-muted-foreground">Sequential calling for high-velocity sales.</p>
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
                            {isDialing ? (
                                <div className="text-center py-8 space-y-6">
                                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <Phone className="h-10 w-10 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">{currentLead.name}</h2>
                                        <p className="text-xl text-muted-foreground">{currentLead.phone}</p>
                                        <p className="text-sm text-muted-foreground mt-2">{currentLead.college}</p>
                                    </div>

                                    <div className="flex justify-center gap-4 max-w-md mx-auto">
                                        <Select value={callStatus} onValueChange={setCallStatus}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Select Outcome" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="interested">Interested</SelectItem>
                                                <SelectItem value="callback">Call Back Later</SelectItem>
                                                <SelectItem value="rnr">RNR (No Response)</SelectItem>
                                                <SelectItem value="not_interested">Not Interested</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button onClick={nextCall} disabled={!callStatus} className="gradient-primary">
                                            Next Call <SkipForward className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground mb-6">
                                        {dialList.length} leads queued for dialing. Click start to begin.
                                    </p>
                                    <Button size="lg" onClick={startDialing} className="gradient-primary text-lg px-8">
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
                            <CardDescription>{dialList.length} leads remaining</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {dialList.map((lead, index) => (
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
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
