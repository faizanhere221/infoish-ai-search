import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
// import Stripe from 'stripe'

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

// POST /api/stripe/connect - Create Stripe Connect account for creator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { creator_id } = body
    
    if (!creator_id) {
      return NextResponse.json(
        { error: 'creator_id is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabase()
    
    // Get creator profile
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('id', creator_id)
      .single()
    
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }
    
    // Check if already has Stripe account
    if (creator.stripe_account_id) {
      // Return link to existing account dashboard
      // const loginLink = await stripe.accounts.createLoginLink(creator.stripe_account_id)
      return NextResponse.json({
        message: 'Stripe account already exists',
        // url: loginLink.url,
        url: 'https://dashboard.stripe.com/', // Placeholder
      })
    }
    
    // TODO: Create Stripe Connect account
    // const account = await stripe.accounts.create({
    //   type: 'express',
    //   country: creator.country,
    //   email: creator.email,
    //   capabilities: {
    //     card_payments: { requested: true },
    //     transfers: { requested: true },
    //   },
    //   business_type: 'individual',
    //   business_profile: {
    //     name: creator.display_name,
    //     url: `https://infoishai.com/creators/${creator.username}`,
    //   },
    // })
    
    // Placeholder account ID for development
    const accountId = `acct_${Date.now()}`
    
    // Save Stripe account ID
    await supabase
      .from('creator_profiles')
      .update({ stripe_account_id: accountId })
      .eq('id', creator_id)
    
    // TODO: Create onboarding link
    // const accountLink = await stripe.accountLinks.create({
    //   account: account.id,
    //   refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/creator/payments?refresh=true`,
    //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/creator/payments?success=true`,
    //   type: 'account_onboarding',
    // })
    
    return NextResponse.json({
      message: 'Stripe account created',
      accountId,
      // url: accountLink.url,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/creator/payments?setup=pending`,
    })
    
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe account' },
      { status: 500 }
    )
  }
}

// GET /api/stripe/connect - Check Stripe account status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creator_id')
    
    if (!creatorId) {
      return NextResponse.json(
        { error: 'creator_id is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabase()
    
    const { data: creator } = await supabase
      .from('creator_profiles')
      .select('stripe_account_id, stripe_onboarded')
      .eq('id', creatorId)
      .single()
    
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }
    
    if (!creator.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        onboarded: false,
      })
    }
    
    // TODO: Check account status with Stripe
    // const account = await stripe.accounts.retrieve(creator.stripe_account_id)
    // const isOnboarded = account.details_submitted && account.charges_enabled
    
    // For development, assume onboarded if account exists
    const isOnboarded = creator.stripe_onboarded
    
    // Update onboarded status if changed
    if (isOnboarded && !creator.stripe_onboarded) {
      await supabase
        .from('creator_profiles')
        .update({ stripe_onboarded: true })
        .eq('id', creatorId)
    }
    
    return NextResponse.json({
      connected: true,
      onboarded: isOnboarded,
      accountId: creator.stripe_account_id,
    })
    
  } catch (error) {
    console.error('Error checking Stripe status:', error)
    return NextResponse.json(
      { error: 'Failed to check Stripe status' },
      { status: 500 }
    )
  }
}