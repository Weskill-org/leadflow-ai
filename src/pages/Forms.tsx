import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MoreHorizontal, FileText, Eye, Edit, Trash } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForms, useDeleteForm } from '@/hooks/useForms';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Forms() {
    const navigate = useNavigate();
    const { data: forms, isLoading } = useForms();
    const deleteForm = useDeleteForm();

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this form?')) {
            try {
                await deleteForm.mutateAsync(id);
                toast.success('Form deleted successfully');
            } catch (error) {
                toast.error('Failed to delete form');
                console.error(error);
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Forms</h1>
                        <p className="text-muted-foreground">Create and manage your lead capture forms.</p>
                    </div>
                    <Button onClick={() => navigate('/dashboard/forms/new')} className="gradient-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Form
                    </Button>
                </div>

                <Card className="glass">
                    <CardHeader>
                        <CardTitle>All Forms</CardTitle>
                        <CardDescription>Manage your active forms and view responses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Form Name</TableHead>
                                    <TableHead className="text-right">Responses</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : forms?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No forms found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    forms?.map((form) => (
                                        <TableRow key={form.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {form.name}
                                            </TableCell>
                                            <TableCell className="text-right">0</TableCell> {/* Placeholder for responses count */}
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(form.created_at), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs ${form.status === 'active'
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : 'bg-yellow-500/10 text-yellow-500'
                                                    }`}>
                                                    {form.status || 'Draft'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => navigate(`/dashboard/forms/${form.id}`)}>
                                                            <Edit className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Eye className="h-4 w-4 mr-2" /> View Responses
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(form.id)}>
                                                            <Trash className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
