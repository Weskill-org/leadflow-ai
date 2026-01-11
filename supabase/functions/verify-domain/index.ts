import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DnsRecord {
  type: string;
  name: string;
  data: string;
}

async function checkDnsRecords(domain: string): Promise<{ valid: boolean; records: DnsRecord[]; error?: string }> {
  try {
    // Use Cloudflare's DNS-over-HTTPS API to check CNAME records
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('DNS lookup failed');
    }

    const data = await response.json();
    console.log(`DNS lookup for ${domain}:`, JSON.stringify(data, null, 2));

    const records: DnsRecord[] = [];
    
    if (data.Answer && Array.isArray(data.Answer)) {
      for (const answer of data.Answer) {
        records.push({
          type: 'CNAME',
          name: answer.name,
          data: answer.data?.replace(/\.$/, '') || '', // Remove trailing dot
        });
      }
    }

    // Check if any CNAME points to dns.fastestcrm.com
    const validTargets = ['dns.fastestcrm.com'];
    const isValid = records.some(record => 
      validTargets.some(target => 
        record.data.toLowerCase() === target.toLowerCase() ||
        record.data.toLowerCase().endsWith('.' + target.toLowerCase())
      )
    );

    // If no CNAME found, also check A records (in case they pointed directly)
    if (records.length === 0) {
      const aResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
        {
          headers: {
            'Accept': 'application/dns-json',
          },
        }
      );

      if (aResponse.ok) {
        const aData = await aResponse.json();
        console.log(`A record lookup for ${domain}:`, JSON.stringify(aData, null, 2));
        
        if (aData.Answer && Array.isArray(aData.Answer)) {
          for (const answer of aData.Answer) {
            records.push({
              type: 'A',
              name: answer.name,
              data: answer.data || '',
            });
          }
        }
      }
    }

    return { valid: isValid, records };
  } catch (error) {
    console.error('DNS check error:', error);
    return { 
      valid: false, 
      records: [], 
      error: error instanceof Error ? error.message : 'DNS lookup failed' 
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, domain, company_id } = await req.json();
    console.log(`Verify domain action: ${action}, domain: ${domain}, company_id: ${company_id}`);

    // Verify user owns this company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, admin_id, custom_domain, domain_status')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (company.admin_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You are not authorized to manage this company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check') {
      // Check DNS records for the domain
      if (!domain) {
        return new Response(
          JSON.stringify({ error: 'Domain is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const dnsResult = await checkDnsRecords(domain);
      
      // Update domain status based on DNS check
      const newStatus = dnsResult.valid ? 'active' : 'pending';
      
      if (company.custom_domain === domain) {
        await supabase
          .from('companies')
          .update({ domain_status: newStatus })
          .eq('id', company_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          domain,
          valid: dnsResult.valid,
          records: dnsResult.records,
          status: newStatus,
          error: dnsResult.error,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'save') {
      // Save custom domain and set to pending
      if (!domain) {
        // Removing custom domain
        const { error: updateError } = await supabase
          .from('companies')
          .update({ 
            custom_domain: null, 
            domain_status: null 
          })
          .eq('id', company_id);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ success: true, message: 'Custom domain removed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate domain format
      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return new Response(
          JSON.stringify({ error: 'Invalid domain format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if domain is already in use by another company
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('custom_domain', domain)
        .neq('id', company_id)
        .maybeSingle();

      if (existingCompany) {
        return new Response(
          JSON.stringify({ error: 'This domain is already in use by another company' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check DNS immediately
      const dnsResult = await checkDnsRecords(domain);
      const initialStatus = dnsResult.valid ? 'active' : 'pending';

      // Save the domain
      const { error: updateError } = await supabase
        .from('companies')
        .update({ 
          custom_domain: domain.toLowerCase(), 
          domain_status: initialStatus 
        })
        .eq('id', company_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: dnsResult.valid 
            ? 'Domain verified and activated!' 
            : 'Domain saved. Please configure DNS.',
          status: initialStatus,
          dnsValid: dnsResult.valid,
          records: dnsResult.records,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'remove') {
      // Remove custom domain
      const { error: updateError } = await supabase
        .from('companies')
        .update({ 
          custom_domain: null, 
          domain_status: null 
        })
        .eq('id', company_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, message: 'Custom domain removed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verify domain error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
