import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

type ActivityItem = {
  id: string
  type: 'registration' | 'deal' | 'message'
  message: string
  detail: string
  timestamp: string
}

export async function GET() {
  try {
    const supabase = createServerSupabase()

    const [usersRes, dealsRes, messagesRes] = await Promise.all([
      supabase
        .from('users')
        .select('id, email, user_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('deals')
        .select('id, title, status, amount, currency, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('deal_messages')
        .select('id, content, created_at, deal_id')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const activities: ActivityItem[] = []

    for (const u of (usersRes.data ?? [])) {
      activities.push({
        id: `user-${u.id}`,
        type: 'registration',
        message: `New ${u.user_type} registered`,
        detail: u.email,
        timestamp: u.created_at,
      })
    }

    for (const d of (dealsRes.data ?? [])) {
      const statusLabel = (d.status as string).replace('_', ' ')
      activities.push({
        id: `deal-${d.id}-${d.status}`,
        type: 'deal',
        message: `Deal ${statusLabel}`,
        detail: `${d.title} · $${Number(d.amount || 0).toFixed(2)} ${d.currency ?? 'USD'}`,
        timestamp: d.updated_at ?? d.created_at,
      })
    }

    for (const m of (messagesRes.data ?? [])) {
      const preview = (m.content as string)?.slice(0, 60)
      activities.push({
        id: `msg-${m.id}`,
        type: 'message',
        message: 'Message sent',
        detail: preview + ((m.content as string)?.length > 60 ? '…' : ''),
        timestamp: m.created_at,
      })
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ activities: activities.slice(0, 20) })
  } catch (err) {
    console.error('Admin activity error:', err)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
