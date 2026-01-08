import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('x-razorpay-signature')
    const webhookSecret = Deno.env.get('RZP_WEBHOOK_SECRET')

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    if (!signature) {
      throw new Error('No signature provided')
    }

    // Get raw body for signature verification
    const body = await req.text()

    // Verify signature
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body)
    )
    const signatureHex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (signatureHex !== signature) {
      throw new Error('Invalid signature')
    }

    const payload = JSON.parse(body)
    console.log('License webhook received:', payload.event)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle order.paid event
    if (payload.event === 'order.paid') {
      const order = payload.payload.order.entity
      const payment = payload.payload.payment.entity
      
      console.log('Processing order.paid:', {
        orderId: order.id,
        notes: order.notes
      })

      if (order.notes?.type === 'license_purchase') {
        const companyId = order.notes.company_id
        const quantity = parseInt(order.notes.quantity) || 0

        if (companyId && quantity > 0) {
          // Update license record
          const { error: updateError } = await supabase
            .from('company_licenses')
            .update({
              status: 'completed',
              payment_id: payment.id
            })
            .eq('razorpay_order_id', order.id)

          if (updateError) {
            console.error('Error updating license record:', updateError)
          }

          // Add licenses to company using the database function
          const { data, error: addError } = await supabase
            .rpc('add_company_licenses', {
              _company_id: companyId,
              _quantity: quantity
            })

          if (addError) {
            console.error('Error adding licenses:', addError)
            throw addError
          }

          console.log(`Added ${quantity} licenses to company ${companyId}`)
        }
      }
    }

    // Handle payment.captured for payment link purchases
    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity
      
      if (payment.notes?.type === 'license_purchase') {
        const companyId = payment.notes.company_id
        const quantity = parseInt(payment.notes.quantity) || 0

        if (companyId && quantity > 0) {
          // Add licenses to company
          const { error: addError } = await supabase
            .rpc('add_company_licenses', {
              _company_id: companyId,
              _quantity: quantity
            })

          if (addError) {
            console.error('Error adding licenses:', addError)
          } else {
            console.log(`Added ${quantity} licenses to company ${companyId}`)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('License webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
