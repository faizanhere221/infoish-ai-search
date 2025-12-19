import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_TOKEN
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    
    console.log('🔍 Checking for expired subscriptions...')

    // Find expired subscriptions ✅
    const { data: expiredUsers, error } = await supabase
      .from('users')
      .select('id, email, tool_subscriptions, subscription_end_date')
      .eq('subscription_status', 'active')
      .lte('subscription_end_date', now.toISOString())

    if (error) {
      throw error
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('✅ No expired subscriptions found')
      return NextResponse.json({
        success: true,
        message: 'No expired subscriptions',
        expired_count: 0
      })
    }

    console.log(`⚠️ Found ${expiredUsers.length} expired subscriptions`)

    let processedCount = 0

    for (const user of expiredUsers) {
      try {
        // Reset to free tier ✅
        const updatedSubscriptions = {
          ...user.tool_subscriptions,
          ai_humanizer: 'free',
          infoishai_search: 'free'
        }

        await supabase
          .from('users')
          .update({
            tool_subscriptions: updatedSubscriptions,
            subscription_status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        // Log to history ✅
        await supabase
          .from('subscription_history')
          .insert({
            user_id: user.id,
            user_email: user.email,
            product_slug: 'all',
            plan: 'free',
            action: 'expired',
            previous_plan: 'starter/pro',
            notes: `Subscription expired on ${user.subscription_end_date}`
          })

        console.log(`✅ Downgraded ${user.email} to free (expired)`)
        processedCount++

        // TODO: Send expiry email notification

      } catch (userError) {
        console.error(`❌ Failed to process ${user.email}:`, userError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} expired subscriptions`,
      expired_count: expiredUsers.length,
      processed_count: processedCount
    })

  } catch (error) {
    console.error('❌ Cron job error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Cron job failed', details: errorMessage },
      { status: 500 }
    )
  }
}