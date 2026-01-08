import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, Users, CreditCard, Globe, Palette, 
  Loader2, Save, ExternalLink, Copy, CheckCircle, AlertCircle
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  domain_status: string | null;
  logo_url: string | null;
  primary_color: string | null;
  total_licenses: number;
  used_licenses: number;
  is_active: boolean;
}

interface LicensePurchase {
  id: string;
  quantity: number;
  amount_paid: number;
  status: string;
  created_at: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ManageCompany() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [licenses, setLicenses] = useState<LicensePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  
  const [companyName, setCompanyName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
  const [seatsToBuy, setSeatsToBuy] = useState(1);

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // Get company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (companyError) throw companyError;

      setCompany(companyData);
      setCompanyName(companyData.name);
      setCustomDomain(companyData.custom_domain || '');
      setPrimaryColor(companyData.primary_color || '#8B5CF6');

      // Get license purchase history
      const { data: licenseData } = await supabase
        .from('company_licenses')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      setLicenses(licenseData || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load company data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!company) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyName,
          custom_domain: customDomain || null,
          primary_color: primaryColor,
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your company settings have been updated.',
      });

      fetchCompanyData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePurchaseSeats = async () => {
    if (seatsToBuy < 1) return;
    
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-licenses', {
        body: { quantity: seatsToBuy }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'Lead Cubed',
        description: `${data.quantity} Additional Seat${data.quantity > 1 ? 's' : ''}`,
        order_id: data.order_id,
        handler: function (response: any) {
          toast({
            title: 'Payment successful!',
            description: `${data.quantity} seat(s) added to your account.`,
          });
          // Refresh data after payment
          setTimeout(() => fetchCompanyData(), 2000);
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: primaryColor,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to initiate purchase',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Domain copied to clipboard',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No Company Found</h2>
          <p className="text-muted-foreground">You are not associated with any company.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Manage Company</h1>
          <p className="text-muted-foreground">Configure your company settings, branding, and licenses.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Company Branding */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>Customize your company appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Branding
              </Button>
            </CardContent>
          </Card>

          {/* Domain Settings */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain
              </CardTitle>
              <CardDescription>Your workspace URL and custom domain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Workspace URL</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                    {company.slug}.leadcubed.in
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(`${company.slug}.leadcubed.in`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                <Input
                  id="customDomain"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="crm.yourcompany.com"
                />
                {customDomain && (
                  <div className="flex items-center gap-2 mt-2">
                    {company.domain_status === 'active' ? (
                      <Badge className="bg-success/20 text-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending Verification
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Point a CNAME record to: app.leadcubed.in
                </p>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Domain Settings
              </Button>
            </CardContent>
          </Card>

          {/* License Management */}
          <Card className="glass md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Licenses
              </CardTitle>
              <CardDescription>Manage your team seats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-3xl font-bold text-primary">
                      {company.used_licenses} / {company.total_licenses}
                    </div>
                    <div className="text-sm text-muted-foreground">Seats Used</div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${(company.used_licenses / company.total_licenses) * 100}%` }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Buy Additional Seats</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={seatsToBuy}
                        onChange={(e) => setSeatsToBuy(parseInt(e.target.value) || 1)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">
                        × ₹500 = ₹{(seatsToBuy * 500).toLocaleString()}
                      </span>
                    </div>
                    <Button 
                      onClick={handlePurchaseSeats} 
                      disabled={purchasing}
                      className="gradient-primary"
                    >
                      {purchasing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Purchase Seats
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Purchase History</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {licenses.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No purchases yet
                      </p>
                    ) : (
                      licenses.map((license) => (
                        <div
                          key={license.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                        >
                          <div>
                            <div className="font-medium">
                              {license.quantity} Seat{license.quantity > 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(license.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">₹{license.amount_paid.toLocaleString()}</div>
                            <Badge 
                              variant={license.status === 'completed' ? 'default' : 'outline'}
                              className={license.status === 'completed' ? 'bg-success/20 text-success' : ''}
                            >
                              {license.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
