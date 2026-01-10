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
  Loader2, Save, ExternalLink, Copy, CheckCircle, AlertCircle, Upload,
  RefreshCw, Trash2, Link2
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

interface DnsRecord {
  type: string;
  name: string;
  data: string;
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
  const [companySlug, setCompanySlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
  const [seatsToBuy, setSeatsToBuy] = useState(1);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState('');
  
  // Custom domain states
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);
  const [domainError, setDomainError] = useState('');

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
      setCompanySlug(companyData.slug);
      setCustomDomain(companyData.custom_domain || '');
      setPrimaryColor(companyData.primary_color || '#8B5CF6');
      setLogoUrl(companyData.logo_url);

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
          logo_url: logoUrl,
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
        name: 'Fastest CRM',
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
      description: 'URL copied to clipboard',
    });
  };

  const validateSlug = (slug: string): boolean => {
    // Only lowercase letters, numbers, and hyphens allowed
    const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!slug) {
      setSlugError('Slug is required');
      return false;
    }
    if (slug.length < 3) {
      setSlugError('Slug must be at least 3 characters');
      return false;
    }
    if (slug.length > 32) {
      setSlugError('Slug must be 32 characters or less');
      return false;
    }
    if (!slugRegex.test(slug)) {
      setSlugError('Only lowercase letters, numbers, and hyphens allowed');
      return false;
    }
    if (slug.includes('--')) {
      setSlugError('No consecutive hyphens allowed');
      return false;
    }
    // Reserved slugs
    const reserved = ['www', 'api', 'app', 'admin', 'dashboard', 'mail', 'smtp', 'ftp'];
    if (reserved.includes(slug)) {
      setSlugError('This slug is reserved');
      return false;
    }
    setSlugError('');
    return true;
  };

  const handleSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setCompanySlug(normalized);
    if (normalized) validateSlug(normalized);
  };

  const handleSaveSlug = async () => {
    if (!company || !validateSlug(companySlug)) return;

    setSavingSlug(true);
    try {
      // Check if slug is already taken
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', companySlug)
        .neq('id', company.id)
        .maybeSingle();

      if (existing) {
        setSlugError('This slug is already taken');
        setSavingSlug(false);
        return;
      }

      const { error } = await supabase
        .from('companies')
        .update({ slug: companySlug })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Workspace URL updated',
        description: `Your new URL is ${companySlug}.fastestcrm.com`,
      });

      fetchCompanyData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update slug',
        variant: 'destructive',
      });
    } finally {
      setSavingSlug(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!company?.custom_domain) return;

    setVerifyingDomain(true);
    setDomainError('');
    try {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: {
          action: 'check',
          domain: company.custom_domain,
          company_id: company.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDnsRecords(data.records || []);

      if (data.valid) {
        toast({
          title: 'Domain Verified!',
          description: 'Your custom domain is properly configured and active.',
        });
        fetchCompanyData();
      } else {
        toast({
          title: 'DNS Not Ready',
          description: 'Please ensure your CNAME record points to cname.vercel-dns.com',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setDomainError(err.message || 'Failed to verify domain');
      toast({
        title: 'Verification Failed',
        description: err.message || 'Failed to verify domain',
        variant: 'destructive',
      });
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!company) return;

    setSavingDomain(true);
    setDomainError('');
    try {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: {
          action: 'save',
          domain: customDomain || null,
          company_id: company.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDnsRecords(data.records || []);

      toast({
        title: data.dnsValid ? 'Domain Activated!' : 'Domain Saved',
        description: data.message,
      });

      fetchCompanyData();
    } catch (err: any) {
      setDomainError(err.message || 'Failed to save domain');
      toast({
        title: 'Error',
        description: err.message || 'Failed to save domain',
        variant: 'destructive',
      });
    } finally {
      setSavingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!company) return;

    setSavingDomain(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: {
          action: 'remove',
          company_id: company.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCustomDomain('');
      setDnsRecords([]);
      toast({
        title: 'Domain Removed',
        description: 'Your custom domain has been disconnected.',
      });

      fetchCompanyData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove domain',
        variant: 'destructive',
      });
    } finally {
      setSavingDomain(false);
    }
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
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg border border-border flex items-center justify-center overflow-hidden bg-muted/50 relative group">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Company Logo" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !company) return;

                        setUploadingLogo(true);
                        try {
                          const fileExt = file.name.split('.').pop();
                          const filePath = `${company.id}/${crypto.randomUUID()}.${fileExt}`;

                          const { error: uploadError } = await supabase.storage
                            .from('company_assets')
                            .upload(filePath, file);

                          if (uploadError) throw uploadError;

                          const { data: { publicUrl } } = supabase.storage
                            .from('company_assets')
                            .getPublicUrl(filePath);

                          setLogoUrl(publicUrl);
                          toast({
                            title: "Logo uploaded",
                            description: "Don't forget to save your changes.",
                          });
                        } catch (error: any) {
                          toast({
                            title: "Error uploading logo",
                            description: error.message,
                            variant: "destructive"
                          });
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: 512x512px, PNG or JPG (Max 2MB)
                    </p>
                  </div>
                </div>
              </div>

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
            <CardContent className="space-y-6">
              {/* Default Workspace URL with Editable Slug */}
              <div className="space-y-3">
                <Label>Default Workspace URL</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center flex-1 bg-muted rounded-md overflow-hidden">
                    <Input
                      value={companySlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="your-company"
                    />
                    <span className="px-3 py-2 text-sm text-muted-foreground font-mono whitespace-nowrap border-l border-border bg-muted/50">
                      .fastestcrm.com
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`https://${companySlug}.fastestcrm.com`)}
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`https://${companySlug}.fastestcrm.com`, '_blank')}
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                {slugError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {slugError}
                  </p>
                )}
                {companySlug !== company.slug && !slugError && (
                  <Button
                    onClick={handleSaveSlug}
                    disabled={savingSlug}
                    size="sm"
                    className="mt-2"
                  >
                    {savingSlug ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save New Slug
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  This is your team's default workspace URL. Only lowercase letters, numbers, and hyphens allowed.
                </p>
              </div>

              <Separator />

              {/* Custom Domain */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  {company.custom_domain && (
                    <Badge 
                      variant={company.domain_status === 'active' ? 'default' : 'outline'}
                      className={company.domain_status === 'active' ? 'bg-success/20 text-success border-success/30' : ''}
                    >
                      {company.domain_status === 'active' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    id="customDomain"
                    value={customDomain}
                    onChange={(e) => {
                      setCustomDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''));
                      setDomainError('');
                    }}
                    placeholder="crm.yourcompany.com"
                    className="flex-1"
                  />
                  {company.custom_domain && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleVerifyDomain}
                        disabled={verifyingDomain}
                        title="Verify DNS"
                      >
                        {verifyingDomain ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(`https://${company.custom_domain}`, '_blank')}
                        title="Open domain"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {domainError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {domainError}
                  </p>
                )}

                {/* DNS Records found */}
                {dnsRecords.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-md text-xs space-y-2">
                    <p className="font-medium">DNS Records Found:</p>
                    <div className="space-y-1">
                      {dnsRecords.map((record, i) => (
                        <div key={i} className="flex items-center gap-2 text-muted-foreground font-mono">
                          <Badge variant="outline" className="text-[10px]">{record.type}</Badge>
                          <span className="truncate">{record.data}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DNS Setup Instructions */}
                <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Link2 className="h-4 w-4" />
                    DNS Configuration
                  </div>
                  <p className="text-muted-foreground text-xs">
                    To connect your custom domain, add these DNS records at your domain registrar:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-background rounded border text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground">Type:</span> CNAME
                      </div>
                      <div>
                        <span className="text-muted-foreground">Name:</span> @
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Target:</span>
                        <code className="px-1 py-0.5 bg-muted rounded">cname.vercel-dns.com</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard('cname.vercel-dns.com')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    DNS changes can take up to 48 hours to propagate. Click the refresh button to check status.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {customDomain !== (company.custom_domain || '') && (
                    <Button 
                      onClick={handleSaveDomain} 
                      disabled={savingDomain}
                      className="flex-1"
                    >
                      {savingDomain ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {customDomain ? 'Save Domain' : 'Remove Domain'}
                    </Button>
                  )}
                  {company.custom_domain && customDomain === company.custom_domain && (
                    <Button 
                      variant="destructive"
                      onClick={handleRemoveDomain}
                      disabled={savingDomain}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
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
