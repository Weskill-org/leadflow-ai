import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link2, Copy, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForms } from '@/hooks/useForms';
import { useLGLinks } from '@/hooks/useLGLinks';

export default function LGDashboard() {
    const [caName, setCaName] = useState('');
    const [selectedForm, setSelectedForm] = useState('');
    const [utmCampaign, setUtmCampaign] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    const { data: forms = [], isLoading: formsLoading } = useForms();
    const { links, loading: linksLoading, createLink } = useLGLinks();

    const activeForms = forms.filter(f => f.status === 'active');

    const handleCreateLink = async () => {
        if (!caName || !selectedForm) {
            toast({
                title: "Missing Information",
                description: "Please select a form and enter a CA Name.",
                variant: "destructive"
            });
            return;
        }

        setIsCreating(true);
        const { data, error } = await createLink(selectedForm, caName, utmCampaign || undefined);
        setIsCreating(false);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to create link. Please try again.",
                variant: "destructive"
            });
            return;
        }

        const utmSource = caName.toLowerCase().replace(/\s+/g, '_');
        const baseUrl = `${window.location.origin}/form/${selectedForm}`;
        const params = new URLSearchParams({
            utm_source: utmSource,
            utm_medium: 'referral',
            ...(utmCampaign && { utm_campaign: utmCampaign }),
            link_id: data?.id || ''
        });
        const generatedLink = `${baseUrl}?${params.toString()}`;

        navigator.clipboard.writeText(generatedLink);
        toast({
            title: "Link Created & Copied!",
            description: "The link has been generated and copied to your clipboard.",
        });

        setCaName('');
        setSelectedForm('');
        setUtmCampaign('');
    };

    const copyLink = (link: typeof links[0]) => {
        const baseUrl = `${window.location.origin}/form/${link.form_id}`;
        const params = new URLSearchParams({
            utm_source: link.utm_source,
            utm_medium: link.utm_medium || 'referral',
            ...(link.utm_campaign && { utm_campaign: link.utm_campaign }),
            link_id: link.id
        });
        const url = `${baseUrl}?${params.toString()}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Copied",
            description: "Link copied to clipboard",
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Lead Generation Dashboard</h1>
                    <p className="text-muted-foreground">Create UTM-tracked links and monitor performance.</p>
                </div>

                {/* Create Link Section */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-primary" />
                            Create Public Link with UTM Tracking
                        </CardTitle>
                        <CardDescription>Generate a unique lead form link with UTM parameters for tracking.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground mb-1 block">Select Form *</label>
                                <Select value={selectedForm} onValueChange={setSelectedForm}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a form" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formsLoading ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : activeForms.length === 0 ? (
                                            <SelectItem value="none" disabled>No active forms</SelectItem>
                                        ) : (
                                            activeForms.map(form => (
                                                <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-1 block">CA Name (utm_source) *</label>
                                <Input
                                    placeholder="e.g., Rahul Kumar"
                                    value={caName}
                                    onChange={(e) => setCaName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-1 block">Campaign (utm_campaign)</label>
                                <Input
                                    placeholder="e.g., summer_2024"
                                    value={utmCampaign}
                                    onChange={(e) => setUtmCampaign(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleCreateLink}
                                    className="gradient-primary w-full"
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    Generate Link
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            UTM parameters: utm_source={caName ? caName.toLowerCase().replace(/\s+/g, '_') : '[ca_name]'},
                            utm_medium=referral
                            {utmCampaign && `, utm_campaign=${utmCampaign}`}
                        </p>
                    </CardContent>
                </Card>

                {/* Reporting Table */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Link Performance</CardTitle>
                        <CardDescription>Track leads and revenue generated by each link.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {linksLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : links.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No links created yet. Create your first link above.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>CA Name</TableHead>
                                        <TableHead>Form</TableHead>
                                        <TableHead>UTM Source</TableHead>
                                        <TableHead>Campaign</TableHead>
                                        <TableHead className="text-right">Total Leads</TableHead>
                                        <TableHead className="text-right">Interested</TableHead>
                                        <TableHead className="text-right">Paid</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Projected</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {links.map((link) => (
                                        <TableRow key={link.id}>
                                            <TableCell className="font-medium">{link.ca_name}</TableCell>
                                            <TableCell>{link.form?.name || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{link.utm_source}</TableCell>
                                            <TableCell className="text-muted-foreground">{link.utm_campaign || '-'}</TableCell>
                                            <TableCell className="text-right">{link.lead_count || 0}</TableCell>
                                            <TableCell className="text-right">{link.interested_count || 0}</TableCell>
                                            <TableCell className="text-right">{link.paid_count || 0}</TableCell>
                                            <TableCell className="text-right text-success font-medium">
                                                {formatCurrency(link.revenue_received || 0)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {formatCurrency(link.revenue_projected || 0)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => copyLink(link)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
