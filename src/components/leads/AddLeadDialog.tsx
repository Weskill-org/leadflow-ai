import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateLead } from '@/hooks/useLeads';
import { useAuth } from '@/hooks/useAuth';
import { Constants } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
    college: z.string().optional(),
    status: z.enum(Constants.public.Enums.lead_status as unknown as [string, ...string[]]),
});

export function AddLeadDialog() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const createLead = useCreateLead();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            college: '',
            status: 'new',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) {
            toast.error('You must be logged in to add a lead');
            return;
        }

        try {
            await createLead.mutateAsync({
                name: values.name,
                email: values.email || null,
                phone: values.phone || null,
                college: values.college || null,
                status: values.status as any,
                created_by_id: user.id,
                sales_owner_id: user.id,
            });
            toast.success('Lead added successfully');
            setOpen(false);
            form.reset();
        } catch (error) {
            toast.error('Failed to add lead');
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new lead here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+91 98765 43210" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="college"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>College</FormLabel>
                                    <FormControl>
                                        <Input placeholder="IIT Delhi" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Constants.public.Enums.lead_status.map((status) => (
                                                <SelectItem key={status} value={status} className="capitalize">
                                                    {status.replace('_', ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={createLead.isPending}>
                            {createLead.isPending ? 'Adding...' : 'Add Lead'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
