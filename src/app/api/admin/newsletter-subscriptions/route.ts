import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const adminToken = process.env.ADMIN_TOKEN
    
    if (token !== adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all subscriptions from database
    const { data: subscriptions, error } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .order('subscribed_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Transform data to match expected format
    const transformedSubscriptions = subscriptions?.map(sub => ({
      id: sub.id,
      email: sub.email,
      date: sub.subscribed_at,
      source: sub.source || 'footer',
      ip_address: sub.ip_address || 'unknown',
      user_agent: sub.user_agent || 'unknown',
      status: sub.status as 'active' | 'unsubscribed'
    })) || []

    return NextResponse.json({
      success: true,
      subscriptions: transformedSubscriptions,
      total: transformedSubscriptions.length
    })

  } catch (error) {
    console.error('Error fetching newsletter subscriptions:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions', details: errorMessage },
      { status: 500 }
    )
  }
}