import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, Users, Search, Plus, Minus, 
  Loader2, ArrowLeft, CheckCircle, XCircle, Eye
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Company {
  id: string;
  name: string;
  slug: string;
  admin_id: string;
  total_licenses: number;
  used_licenses: number;
  is_active: boolean;
  created_at: string;
}

export default function PlatformAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [licensesToAdd, setLicensesToAdd] = useState(1);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      checkPlatformAdmin();
    }
  }, [user]);

  const checkPlatformAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error || !data) {
        setIsPlatformAdmin(false);
        setLoading(false);
        return;
      }

      setIsPlatformAdmin(true);
      fetchCompanies();
    } catch (err) {
      setIsPlatformAdmin(false);
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (company: Company) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: !company.is_active })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Company ${company.is_active ? 'deactivated' : 'activated'}`,
      });
      fetchCompanies();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update company status',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAddLicenses = async () => {
    if (!selectedCompany || licensesToAdd < 1) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('add_company_licenses', {
        _company_id: selectedCompany.id,
        _quantity: licensesToAdd
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Added ${licensesToAdd} license(s) to ${selectedCompany.name}`,
      });
      setSelectedCompany(null);
      setLicensesToAdd(1);
      fetchCompanies();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add licenses',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter(c => c.is_active).length,
    totalLicenses: companies.reduce((acc, c) => acc + c.total_licenses, 0),
    usedLicenses: companies.reduce((acc, c) => acc + c.used_licenses, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-background dark flex flex-col items-center justify-center gap-4">
        <XCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You are not authorized to view this page.</p>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Platform Administration</h1>
            </div>
            <p className="text-muted-foreground">Manage all companies and licenses</p>
          </div>
          <Badge className="bg-primary/20 text-primary">Platform Admin</Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                  <div className="text-sm text-muted-foreground">Total Companies</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.activeCompanies}</div>
                  <div className="text-sm text-muted-foreground">Active Companies</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalLicenses}</div>
                  <div className="text-sm text-muted-foreground">Total Licenses</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.usedLicenses}</div>
                  <div className="text-sm text-muted-foreground">Used Licenses</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Companies</CardTitle>
                <CardDescription>Manage all registered companies</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Licenses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {company.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{company.used_licenses}</span>
                      <span className="text-muted-foreground"> / {company.total_licenses}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={company.is_active ? 'default' : 'destructive'}
                        className={company.is_active ? 'bg-success/20 text-success' : ''}
                      >
                        {company.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedCompany(company);
                                setLicensesToAdd(1);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Licenses
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Licenses</DialogTitle>
                              <DialogDescription>
                                Add licenses to {selectedCompany?.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Number of Licenses</label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={licensesToAdd}
                                  onChange={(e) => setLicensesToAdd(parseInt(e.target.value) || 1)}
                                />
                              </div>
                              <Button
                                className="w-full"
                                onClick={handleAddLicenses}
                                disabled={processing}
                              >
                                {processing ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4 mr-2" />
                                )}
                                Add {licensesToAdd} License{licensesToAdd > 1 ? 's' : ''}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant={company.is_active ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleActive(company)}
                          disabled={processing}
                        >
                          {company.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCompanies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No companies found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
