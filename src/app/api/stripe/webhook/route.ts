import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
// import Stripe from 'stripe'

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// POST /api/stripe/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }
    
    // TODO: Verify webhook signature
    // let event: Stripe.Event
    // try {
    //   event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    // } catch (err) {
    //   console.error('Webhook signature verification failed:', err)
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    // }
    
    // For development, parse JSON directly
    const event = JSON.parse(body)
    
    const supabase = createServerSupabase()
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const dealId = session.metadata?.deal_id
        
        if (dealId) {
          // Update deal with payment info
          await supabase
            .from('deals')
            .update({
              stripe_payment_intent_id: session.payment_intent,
              status: 'accepted',
              accepted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', dealId)
          
          console.log(`Deal ${dealId} payment completed`)
        }
        break
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const dealId = paymentIntent.metadata?.deal_id
        
        if (dealId) {
          console.log(`Payment intent succeeded for deal ${dealId}`)
        }
        break
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const dealId = paymentIntent.metadata?.deal_id
        
        if (dealId) {
          console.error(`Payment failed for deal ${dealId}`)
          // Could notify the brand here
        }
        break
      }
      
      case 'transfer.created': {
        const transfer = event.data.object
        const dealId = transfer.transfer_group
        
        if (dealId) {
          // Update deal with transfer info
          await supabase
            .from('deals')
            .update({
              stripe_transfer_id: transfer.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', dealId)
          
          console.log(`Transfer created for deal ${dealId}`)
        }
        break
      }
      
      case 'account.updated': {
        const account = event.data.object
        
        // Check if onboarding is complete
        if (account.details_submitted && account.charges_enabled) {
          // Find creator by Stripe account ID and mark as onboarded
          await supabase
            .from('creator_profiles')
            .update({ stripe_onboarded: true })
            .eq('stripe_account_id', account.id)
          
          console.log(`Creator with Stripe account ${account.id} completed onboarding`)
        }
        break
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Disable body parsing for webhook (needed for signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
}