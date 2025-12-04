import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Brain, TrendingUp, DollarSign, Target, BarChart3, Calendar
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const stats = [
  { label: 'Daily Sales', value: '0', icon: Target, trend: '+0%' },
  { label: 'Revenue Today', value: '₹0', icon: DollarSign, trend: '+0%' },
  { label: 'Projected Revenue', value: '₹0', icon: TrendingUp, trend: '+0%' },
  { label: 'Lifetime Payments', value: '₹0', icon: CreditCard, trend: '+0%' },
  { label: 'Total Revenue', value: '₹0', icon: BarChart3, trend: '+0%' },
  { label: 'Revenue Forecast', value: '₹0', icon: Brain, trend: '+0%' },
];

import { CreditCard } from 'lucide-react';

export default function Dashboard() {
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-success font-medium">{stat.trend}</span>
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
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leads yet. Add your first lead to get started!</p>
              </div>
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
                <p className="text-sm">Add leads to unlock AI-powered insights and recommendations.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
