import { useCompany } from './useCompany';

export function useLeadsTable() {
    const { company, loading } = useCompany();

    // Default to 'leads' if no custom table is set or if loading
    let tableName = company?.custom_leads_table || 'leads';

    // Special case for Real Estate industry if no custom table is explicitly set
    if (!company?.custom_leads_table && (company as any)?.industry === 'real_estate') {
        tableName = 'leads_real_estate';
    }



    return {
        tableName,
        companyId: company?.id,
        loading
    };
}
