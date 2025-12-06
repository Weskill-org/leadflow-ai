import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCreateLeads } from '@/hooks/useLeads';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, FileUp } from 'lucide-react';
import Papa from 'papaparse';
import { Constants } from '@/integrations/supabase/types';

export function UploadLeadsDialog() {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const { user } = useAuth();
    const createLeads = useCreateLeads();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setUploading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const leads = results.data.map((row: any) => {
                        // Basic validation and mapping
                        const status = row.Status || row.status || 'new';
                        // Validate status against enum
                        const validStatus = Constants.public.Enums.lead_status.includes(status.toLowerCase())
                            ? status.toLowerCase()
                            : 'new';

                        return {
                            name: row.Name || row.name,
                            email: row.Email || row.email || null,
                            phone: row.Phone || row.phone || null,
                            college: row.College || row.college || null,
                            status: validStatus,
                            created_by_id: user.id,
                            sales_owner_id: user.id,
                        };
                    }).filter(lead => lead.name); // Ensure name exists

                    if (leads.length === 0) {
                        toast.error('No valid leads found in CSV');
                        setUploading(false);
                        return;
                    }

                    await createLeads.mutateAsync(leads as any);
                    toast.success(`${leads.length} leads uploaded successfully`);
                    setOpen(false);
                    setFile(null);
                } catch (error) {
                    console.error('Upload error:', error);
                    toast.error('Failed to upload leads');
                } finally {
                    setUploading(false);
                }
            },
            error: (error) => {
                console.error('CSV Parse error:', error);
                toast.error('Failed to parse CSV file');
                setUploading(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload Leads CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with columns: Name, Email, Phone, College, Status.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                    </div>
                    {file && (
                        <div className="text-sm text-muted-foreground">
                            Selected: {file.name}
                        </div>
                    )}
                    <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
                        {uploading ? (
                            <>
                                <FileUp className="mr-2 h-4 w-4 animate-bounce" />
                                Uploading...
                            </>
                        ) : (
                            'Upload Leads'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
