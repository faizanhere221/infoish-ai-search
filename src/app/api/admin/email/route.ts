import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const VALID_STATUS = new Set(['sent', 'skipped', 'failed', 'logged_dev'])
const VALID_CATEGORY = new Set(['messages', 'offers', 'contracts', 'work', 'payments', 'daily_summary', 'security'])

// GET /api/admin/email — email_log list (filters: status, category, user
// by email) + the last 14 days of email_daily_usage for the usage chart.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20))
    const status = searchParams.get('status') ?? ''
    const category = searchParams.get('category') ?? ''
    const userSearch = searchParams.get('user') ?? ''

    const supabase = createServerSupabase()

    let userIds: string[] | null = null
    if (userSearch) {
      const { data: users } = await supabase.from('users').select('id').ilike('email', `%${userSearch}%`)
      userIds = (users ?? []).map((u) => u.id)
      if (userIds.length === 0) {
        return NextResponse.json({ emails: [], total: 0, page, limit, dailyUsage: [] })
      }
    }

    let query = supabase
      .from('email_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status && VALID_STATUS.has(status)) {query = query.eq('status', status)}
    if (category && VALID_CATEGORY.has(category)) {query = query.eq('category', category)}
    if (userIds) {query = query.in('user_id', userIds)}

    const { data: emails, count, error } = await query
    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return NextResponse.json({ emails: [], total: 0, page, limit, dailyUsage: [], missing_table: true })
      }
      throw error
    }

    const emailUserIds = [...new Set((emails ?? []).map((e) => e.user_id).filter(Boolean))]
    const { data: users } = emailUserIds.length > 0
      ? await supabase.from('users').select('id, email').in('id', emailUserIds)
      : { data: [] }
    const emailByUserId = new Map((users ?? []).map((u) => [u.id, u.email]))

    const enriched = (emails ?? []).map((e) => ({ ...e, user_email: e.user_id ? emailByUserId.get(e.user_id) ?? null : null }))

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: usage } = await supabase
      .from('email_daily_usage')
      .select('day, sent_count')
      .gte('day', fourteenDaysAgo)
      .order('day', { ascending: true })

    return NextResponse.json({ emails: enriched, total: count ?? 0, page, limit, dailyUsage: usage ?? [] })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/email' })
    return NextResponse.json({ error: 'Failed to fetch email log' }, { status: 500 })
  }
}
