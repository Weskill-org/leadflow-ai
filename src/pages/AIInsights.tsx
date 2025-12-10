import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export default function AIInsights() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleViewLeads = () => {
        // Navigate to All Leads page
        navigate('/dashboard/leads');
    };

    const handleSendReminder = () => {
        // Show success toast
        toast({
            title: "Reminders Sent",
            description: "Successfully sent follow-up reminders to 3 leads.",
        });
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Brain className="h-6 w-6 text-primary" />
                            AI Insights
                        </h1>
                        <p className="text-muted-foreground">Powered by Gemini - Intelligent recommendations for your sales.</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Refresh Insights
                    </Button>
                </div>

                {/* AI Action Center */}
                <Card className="glass border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            AI Action Center
                        </CardTitle>
                        <CardDescription>Gemini suggests these high-impact actions for today.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="p-2 rounded-full bg-primary/10 text-primary mt-1">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Call 5 High-Intent Leads</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Based on recent activity, these leads from IIT Delhi are 80% likely to convert today.
                                </p>
                                <Button
                                    size="sm"
                                    className="gradient-primary"
                                    onClick={handleViewLeads}
                                >
                                    View Leads
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                            <div className="p-2 rounded-full bg-orange-500/10 text-orange-500 mt-1">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Follow-up Required</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    3 leads from last week's webinar haven't been contacted yet. Risk of drop-off is high.
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSendReminder}
                                >
                                    Send Reminder
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Analytics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Conversion Probability</CardTitle>
                            <CardDescription>AI predicted success rate by college</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { name: 'IIT Delhi', score: '92%', color: 'bg-green-500' },
                                    { name: 'BITS Pilani', score: '85%', color: 'bg-green-500' },
                                    { name: 'VIT Vellore', score: '64%', color: 'bg-yellow-500' },
                                    { name: 'SRM Chennai', score: '45%', color: 'bg-orange-500' },
                                ].map((item) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <span className="font-medium">{item.name}</span>
                                        <div className="flex items-center gap-3 w-1/2">
                                            <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                                                <div className={`h-full ${item.color}`} style={{ width: item.score }} />
                                            </div>
                                            <span className="text-sm font-bold w-8">{item.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Revenue Forecast</CardTitle>
                            <CardDescription>Projected vs Actual for this month</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground border-2 border-dashed rounded-lg">
                                Chart Placeholder
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
