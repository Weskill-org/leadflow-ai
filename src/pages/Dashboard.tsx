import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Brain, TrendingUp, DollarSign, Target, BarChart3, CreditCard, Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLeads } from '@/hooks/useLeads';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: leads = [], isLoading } = useLeads();

  // Calculate stats
  const today = new Date();
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const leadsToday = leads.filter(lead => isToday(lead.updated_at));
  const paidLeadsToday = leadsToday.filter(lead => lead.status === 'paid');

  const revenueToday = leadsToday.reduce((sum, lead) => sum + (Number(lead.revenue_received) || 0), 0);
  const totalRevenue = leads.reduce((sum, lead) => sum + (Number(lead.revenue_received) || 0), 0);
  const projectedRevenue = leads
    .filter(lead => lead.status === 'paid')
    .reduce((sum, lead) => sum + (Number(lead.revenue_projected) || 0), 0);
  const pipelineValue = leads
    .filter(lead => ['interested', 'follow_up'].includes(lead.status))
    .reduce((sum, lead) => sum + (Number(lead.revenue_projected) || 0), 0);

  const stats = [
    {
      label: 'Daily Sales',
      value: paidLeadsToday.length.toString(),
      icon: Target,
      trend: 'Today'
    },
    {
      label: 'Revenue Today',
      value: `₹${revenueToday.toLocaleString()}`,
      icon: DollarSign,
      trend: 'Today'
    },
    {
      label: 'Projected Revenue',
      value: `₹${projectedRevenue.toLocaleString()}`,
      icon: TrendingUp,
      trend: 'Total'
    },
    {
      label: 'Lifetime Payments',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      trend: 'Total'
    },
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: BarChart3,
      trend: 'Total'
    },
    {
      label: 'Pipeline Value',
      value: `₹${pipelineValue.toLocaleString()}`,
      icon: Brain,
      trend: 'Forecast'
    },
  ];

  const recentLeads = leads.slice(0, 5);

  return (
    <DashboardLayout>
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border px-8 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your sales overview.</p>
          </div>
          <Button className="gradient-primary">
            <Users className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </header>

      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {stats.map((stat) => (
                <Card key={stat.label} className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{stat.trend}</span>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="glass lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Leads</CardTitle>
                  <CardDescription>Your latest lead activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentLeads.length > 0 ? (
                    <div className="space-y-4">
                      {recentLeads.map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {lead.name[0]}
                            </div>
                            <div>
                              <p className="font-medium">{lead.name}</p>
                              <p className="text-sm text-muted-foreground">{lead.email || lead.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium capitalize">{lead.status.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(lead.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No leads yet. Add your first lead to get started!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Insights
                  </CardTitle>
                  <CardDescription>Powered by Gemini</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    {leads.length > 0 ? (
                      <p className="text-sm">
                        You have {leads.length} leads.
                        {pipelineValue > 0 && ` Potential pipeline value of ₹${pipelineValue.toLocaleString()}.`}
                        <br />Keep following up!
                      </p>
                    ) : (
                      <p className="text-sm">Add leads to unlock AI-powered insights and recommendations.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
