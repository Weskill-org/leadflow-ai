import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MoreHorizontal, FileText, Eye, Edit, Trash, AlertCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForms, useDeleteForm, useFormResponseCounts } from '@/hooks/useForms';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Forms() {
    const navigate = useNavigate();
    const { data: forms, isLoading } = useForms();
    const { data: responseCounts } = useFormResponseCounts();
    const deleteForm = useDeleteForm();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteForm.mutateAsync(deleteId);
            toast.success('Form deleted successfully');
        } catch (error: any) {
            console.error(error);
            // Check for foreign key constraint violation (Postgres error code 23503)
            if (error?.message?.includes('foreign key constraint') || error?.code === '23503') {
                toast.error('Cannot delete form because it has associated responses. Please delete the responses first.');
            } else if (error?.message) {
                toast.error(error.message);
            } else {
                toast.error('Failed to delete form');
            }
        } finally {
            setDeleteId(null);
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
                                            <TableCell className="text-right">
                                                {responseCounts?.[form.id] || 0}
                                            </TableCell>
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
                                                        <DropdownMenuItem onClick={() => navigate(`/dashboard/forms/${form.id}/responses`)}>
                                                            <Eye className="h-4 w-4 mr-2" /> View Responses
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(form.id);
                                                            }}
                                                        >
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

                <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the form and remove it from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}
