import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Calculate subscription end date
function calculateEndDate(billingCycle: 'monthly' | 'yearly' = 'monthly'): Date {
  const now = new Date()
  if (billingCycle === 'yearly') {
    now.setFullYear(now.getFullYear() + 1)
  } else {
    now.setMonth(now.getMonth() + 1)
  }
  return now
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin token
    const authHeader = req.headers.get('authorization')
    const adminToken = process.env.ADMIN_TOKEN
    
    if (authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user_email, product_slug, tier, payment_reference, billing_cycle = 'monthly', amount } = await req.json()

    // Validate inputs
    if (!user_email || !product_slug || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: user_email, product_slug, tier' },
        { status: 400 }
      )
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, tool_subscriptions')
      .eq('email', user_email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: `User not found: ${user_email}` },
        { status: 404 }
      )
    }

    // Calculate dates ✅
    const startDate = new Date()
    const endDate = calculateEndDate(billing_cycle as 'monthly' | 'yearly')
    
    // Update tool_subscriptions
    const updatedSubscriptions = {
      ...(user.tool_subscriptions || {}),
      [product_slug]: tier
    }

    // Update user with subscription info ✅
    const { error: updateError } = await supabase
      .from('users')
      .update({
        tool_subscriptions: updatedSubscriptions,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        subscription_status: 'active',
        last_payment_date: startDate.toISOString(),
        next_billing_date: endDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', user_email)

    if (updateError) {
      throw updateError
    }

    // Log to subscription history ✅
    await supabase
      .from('subscription_history')
      .insert({
        user_id: user.id,
        user_email: user_email,
        product_slug: product_slug,
        plan: tier,
        action: 'activated',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_reference: payment_reference,
        amount: amount,
        notes: `Activated via admin panel`
      })

    // Update payment submission status
    if (payment_reference) {
      await supabase
        .from('payment_submissions')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: 'admin'
        })
        .eq('payment_reference', payment_reference)
    }

    console.log(`✅ Activated ${tier} for ${user_email} (${product_slug})`)
    console.log(`   Start: ${startDate.toISOString()}`)
    console.log(`   End: ${endDate.toISOString()}`)

    return NextResponse.json({
      success: true,
      message: `Successfully activated ${tier} tier for ${user_email}`,
      user_email,
      product_slug,
      tier,
      subscription_start: startDate.toISOString(),
      subscription_end: endDate.toISOString(),
      billing_cycle
    })

  } catch (error) {
    console.error('❌ Activation error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Activation failed', details: errorMessage },
      { status: 500 }
    )
  }
}