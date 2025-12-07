import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, description, customer, reference_id } = await req.json()

        const RZP_KEY_ID = Deno.env.get('RZP_KEY_ID')
        const RZP_KEY_SECRET = Deno.env.get('RZP_KEY_SECRET')

        if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
            throw new Error('Razorpay keys are not configured')
        }

        // Create the Basic Auth header
        const authHeader = `Basic ${btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)}`

        const response = await fetch('https://api.razorpay.com/v1/payment_links', {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount, // Amount in paise
                currency: "INR",
                accept_partial: true,
                first_min_partial_amount: 100, // Minimum 1 INR
                description: description,
                customer: {
                    name: customer.name,
                    email: customer.email,
                    contact: customer.phone
                },
                notify: {
                    sms: true,
                    email: true
                },
                reminder_enable: true,
                notes: {
                    lead_id: reference_id
                },
                reference_id: reference_id
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Razorpay Error:', data)
            throw new Error(data.error?.description || 'Failed to create payment link')
        }

        return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Edge Function Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
