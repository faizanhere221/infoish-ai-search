import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateUserSubscription } from '@/utils/admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Verify admin token
    const authHeader = req.headers.get('authorization')
    const adminToken = process.env.ADMIN_TOKEN
    
    if (authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { user_email, product_slug, tier, payment_reference } = await req.json()

    // Validate inputs
    if (!user_email || !product_slug || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: user_email, product_slug, tier' },
        { status: 400 }
      )
    }

    // Update subscription
    await updateUserSubscription(user_email, product_slug, tier)

    // Update submission status in database ✅
    if (payment_reference) {
      const { error: updateError } = await supabase
        .from('payment_submissions')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: 'admin'
        })
        .eq('payment_reference', payment_reference)

      if (updateError) {
        console.error('Failed to update submission status:', updateError)
      } else {
        console.log(`✅ Updated submission status for ${payment_reference}`)
      }
    }

    console.log(`✅ Activated ${tier} for ${user_email} (${product_slug})`)

    return NextResponse.json({
      success: true,
      message: `Successfully activated ${tier} tier for ${user_email}`,
      user_email,
      product_slug,
      tier
    })

  } catch (error) {
    console.error('❌ Activation error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Activation failed',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}