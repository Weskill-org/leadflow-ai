import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useForm } from '@/hooks/useForms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PublicForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { data: form, isLoading } = useForm(id);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Initialize form data with default values and URL parameters
    useEffect(() => {
        if (form?.fields) {
            const initialData: Record<string, string> = {};
            const fields = form.fields as any[];

            fields.forEach(field => {
                // Priority: 1. URL Param, 2. Default Value, 3. Empty
                // Check if field attribute matches a URL param (e.g., ?utm_source=...)
                const paramValue = field.attribute ? searchParams.get(field.attribute) : null;

                if (paramValue) {
                    initialData[field.id] = paramValue;
                } else if (field.defaultValue) {
                    initialData[field.id] = field.defaultValue;
                } else {
                    initialData[field.id] = '';
                }
            });

            // Also capture standard UTM params even if not explicitly mapped, if we want to be safe
            // But for now, we rely on the form configuration mapping

            setFormData(initialData);
        }
    }, [form, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;

        setSubmitting(true);
        try {
            // Map form data to leads table columns
            const leadData: Record<string, any> = {
                form_id: form.id,
                status: 'new',
                created_by_id: form.created_by_id // Assign to form creator by default
            };

            const fields = form.fields as any[];
            fields.forEach(field => {
                if (field.attribute && formData[field.id]) {
                    leadData[field.attribute] = formData[field.id];
                }
            });

            // Capture link_id if present in URL
            const linkId = searchParams.get('link_id');
            if (linkId) {
                leadData.lg_link_id = linkId;
            }

            // Capture UTM parameters
            const utmSource = searchParams.get('utm_source');
            if (utmSource) {
                leadData.ca_name = utmSource;
            }

            const { error } = await supabase
                .from('leads')
                .insert(leadData);

            if (error) throw error;

            setSubmitted(true);
            toast.success('Form submitted successfully!');
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Failed to submit form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <h2 className="text-xl font-semibold text-gray-900">Form Not Found</h2>
                        <p className="text-gray-500 mt-2">The form you are looking for does not exist or has been removed.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Thank You!</CardTitle>
                        <CardDescription>Your response has been recorded successfully.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Submit Another Response
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>{form.name}</CardTitle>
                        {form.description && <CardDescription>{form.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {(form.fields as any[]).map((field) => {
                                if (field.hidden) return null;

                                return (
                                    <div key={field.id} className="space-y-2">
                                        <Label htmlFor={field.id}>
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </Label>

                                        {field.type === 'textarea' ? (
                                            <Textarea
                                                id={field.id}
                                                required={field.required}
                                                value={formData[field.id] || ''}
                                                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                            />
                                        ) : field.type === 'select' ? (
                                            <Select
                                                value={formData[field.id] || ''}
                                                onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.options?.map((option: string) => (
                                                        <SelectItem key={option} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                id={field.id}
                                                type={field.type}
                                                required={field.required}
                                                value={formData[field.id] || ''}
                                                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                            />
                                        )}
                                    </div>
                                );
                            })}

                            <Button type="submit" className="w-full gradient-primary" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
