import { useCompany } from './useCompany';

export function useLeadsTable() {
    const { company, loading } = useCompany();

    // Default to 'leads' if no custom table is set or if loading
    const tableName = company?.custom_leads_table || 'leads';

    console.log('[useLeadsTable] Resolved table name:', {
        customTable: company?.custom_leads_table,
        finalTable: tableName,
        companyId: company?.id,
        loading
    });

    return {
        tableName,
        companyId: company?.id,
        loading
    };
}
