import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
// import Stripe from 'stripe'

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

// POST /api/stripe/checkout - Create checkout session for deal payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deal_id, brand_id } = body
    
    if (!deal_id || !brand_id) {
      return NextResponse.json(
        { error: 'deal_id and brand_id are required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabase()
    
    // Get deal
    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', deal_id)
      .single()
    
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }
    
    // Verify brand owns this deal
    if (deal.brand_id !== brand_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Verify deal is in correct status
    if (deal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Deal has already been paid or is not in pending status' },
        { status: 400 }
      )
    }
    
    // Get creator for Stripe account
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, display_name')
      .eq('id', deal.creator_id)
      .single()
    
    if (!creator?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Creator has not set up payments yet' },
        { status: 400 }
      )
    }
    
    // Get brand for customer
    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('email, company_name, stripe_customer_id')
      .eq('id', brand_id)
      .single()
    
    // TODO: Create or get Stripe customer
    // let customerId = brand?.stripe_customer_id
    // if (!customerId) {
    //   const customer = await stripe.customers.create({
    //     email: brand?.email,
    //     name: brand?.company_name,
    //     metadata: { brand_id },
    //   })
    //   customerId = customer.id
    //   await supabase.from('brand_profiles').update({ stripe_customer_id: customerId }).eq('id', brand_id)
    // }
    
    // TODO: Create checkout session with escrow (hold funds)
    // const session = await stripe.checkout.sessions.create({
    //   customer: customerId,
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price_data: {
    //       currency: 'usd',
    //       product_data: {
    //         name: deal.title,
    //         description: `Deal with ${creator.display_name}`,
    //       },
    //       unit_amount: deal.amount_cents,
    //     },
    //     quantity: 1,
    //   }],
    //   mode: 'payment',
    //   payment_intent_data: {
    //     capture_method: 'manual', // Hold funds, release on approval
    //     transfer_group: deal_id,
    //     metadata: {
    //       deal_id,
    //       creator_id: deal.creator_id,
    //       brand_id,
    //     },
    //   },
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/deals/${deal_id}?payment=success`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/deals/${deal_id}?payment=cancelled`,
    //   metadata: {
    //     deal_id,
    //   },
    // })
    
    // Placeholder for development
    const sessionId = `cs_${Date.now()}`
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/deals/${deal_id}?payment=demo`
    
    return NextResponse.json({
      sessionId,
      url: checkoutUrl,
    })
    
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}