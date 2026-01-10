import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users, Phone, CreditCard, Workflow,
  Brain, ArrowRight, Zap, Target, TrendingUp
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Lead Management',
    description: 'Track every lead from generation to conversion with smart status tracking and ownership assignment.'
  },
  {
    icon: Brain,
    title: 'AI Analytics (Gemini)',
    description: 'Get intelligent insights, conversion predictions, and AI-powered recommendations for every lead.'
  },
  {
    icon: Phone,
    title: 'Auto Dialer',
    description: 'Sequential calling with one click. Update status instantly after each call.'
  },
  {
    icon: Users,
    title: 'Team Hierarchy',
    description: '12-level hierarchy from CA to Company. Role-based access ensures data security.'
  },
  {
    icon: CreditCard,
    title: 'Payment Links',
    description: 'Razorpay integration for instant payment collection. Auto-update lead status on payment.'
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description: 'Rule-based triggers and actions. Automate follow-ups, notifications, and lead assignments.'
  }
];

const benefits = [
  { icon: Zap, text: 'Close deals faster with AI-prioritized leads' },
  { icon: Target, text: 'Automate follow-ups, never miss an opportunity' },
  { icon: TrendingUp, text: 'Track revenue in real-time from lead to payment' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/fastestcrmlogo.png" alt="Fastest CRM" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold">Fastest CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/register-company">
              <Button size="sm" className="gradient-primary">
                Register Company
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm text-muted-foreground">India's First AI-Powered CRM</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            AI CRM for{' '}
            <span className="gradient-text">Leads → Calls → Payments → Analytics</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Built for Indian sales teams, training companies, and enrollment teams.
            Manage your entire pipeline with AI-powered insights.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="gradient-primary glow px-8 text-lg">
                Access CRM
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="px-8 text-lg">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Scale Sales</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From lead capture to payment collection, Fastest CRM handles your entire sales workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass p-6 rounded-xl hover:glow transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Why Teams Love <span className="gradient-text">Fastest CRM</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.text}
                  className="flex flex-col items-center text-center p-6 animate-fade-in"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4 glow">
                    <benefit.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <p className="text-lg font-medium">{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="glass rounded-2xl p-12 text-center max-w-4xl mx-auto glow-strong">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Sales?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of sales teams already using Fastest CRM to close more deals.
            </p>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="gradient-primary px-10 text-lg">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/fastestcrmlogo.png" alt="Fastest CRM" className="w-8 h-8 object-contain" />
            <span className="font-semibold">Fastest CRM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Fastest CRM by Upmarking.com. Built for Fastest Sales Teams.
          </p>
        </div>
      </footer>
    </div>
  );
}