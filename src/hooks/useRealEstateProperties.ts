import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/hooks/useCompany";

export interface RealEstateProperty {
    id: string;
    company_id: string;
    category: string;
    name: string;
    sq_ft: number | null;
    cost: number | null;
    available_units: number | null;
    location: string | null;
    state: string | null;
    country: string | null;
    created_at: string;
    updated_at: string;
}

export type PropertyFormData = Omit<RealEstateProperty, 'id' | 'company_id' | 'created_at' | 'updated_at'>;

export function useRealEstateProperties() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { company } = useCompany();

    const { data: properties, isLoading } = useQuery({
        queryKey: ['real-estate-properties', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];

            const { data, error } = await supabase
                .from('real_estate_properties')
                .select('*')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) {
                toast({
                    title: "Error fetching properties",
                    description: error.message,
                    variant: "destructive",
                });
                throw error;
            }

            return data as RealEstateProperty[];
        },
        enabled: !!company?.id,
    });

    const createProperty = useMutation({
        mutationFn: async (newProperty: PropertyFormData) => {
            if (!company?.id) throw new Error("No company ID");

            const { data, error } = await supabase
                .from('real_estate_properties')
                .insert([{ ...newProperty, company_id: company.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['real-estate-properties'] });
            toast({
                title: "Property added",
                description: "New property has been successfully added.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error adding property",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateProperty = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<PropertyFormData> & { id: string }) => {
            const { data, error } = await supabase
                .from('real_estate_properties')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['real-estate-properties'] });
            toast({
                title: "Property updated",
                description: "Property details have been updated.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error updating property",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteProperty = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('real_estate_properties')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['real-estate-properties'] });
            toast({
                title: "Property deleted",
                description: "Property has been removed.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error deleting property",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        properties,
        isLoading,
        createProperty,
        updateProperty,
        deleteProperty,
    };
}
