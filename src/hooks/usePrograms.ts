import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Program {
    id: string;
    name: string;
    price: number;
}

export function usePrograms() {
    return useQuery({
        queryKey: ['programs'],
        queryFn: async (): Promise<Program[]> => {
            const { data, error } = await supabase
                .from('programs')
                .select('id, name, price')
                .order('price', { ascending: true });

            if (error) throw error;
            return (data || []) as Program[];
        },
    });
}
