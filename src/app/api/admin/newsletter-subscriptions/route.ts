import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET() {
  try {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, subscribed_at, is_active, source')
      .order('subscribed_at', { ascending: false })

    if (error) { throw error }

    const subscriptions = (data ?? []).map(sub => ({
      id: sub.id,
      email: sub.email,
      date: sub.subscribed_at,
      source: sub.source ?? 'landing_page',
      status: sub.is_active ? 'active' : 'unsubscribed',
    }))

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Admin newsletter-subscriptions error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}
