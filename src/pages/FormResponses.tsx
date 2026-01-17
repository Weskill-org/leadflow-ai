
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react';
import { useForm, useFormResponses } from '@/hooks/useForms';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function FormResponses() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: form, isLoading: formLoading } = useForm(id);
    const { data: responses, isLoading: responsesLoading } = useFormResponses(id);

    if (formLoading || responsesLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!form) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Form not found</h1>
                    <Button onClick={() => navigate('/dashboard/forms')} className="mt-4">
                        Back to Forms
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const handleExport = () => {
        if (!responses?.length) return;

        // Convert responses to CSV
        const headers = ['Name', 'Email', 'Phone', 'Created At'];
        const csvContent = [
            headers.join(','),
            ...responses.map(r => [
                r.name,
                r.email || '',
                r.phone || '',
                format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${form.name}-responses.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/forms')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{form.name} Responses</h1>
                            <p className="text-muted-foreground">View and manage form submissions</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport} disabled={!responses?.length}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Submissions ({responses?.length || 0})</CardTitle>
                        <CardDescription>List of all leads captured through this form</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Submitted On</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {responses?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No responses yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    responses?.map((response) => (
                                        <TableRow key={response.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                    {response.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{response.email || '-'}</TableCell>
                                            <TableCell>{response.phone || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {format(new Date(response.created_at), 'MMM d, yyyy HH:mm')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-500`}>
                                                    {response.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
