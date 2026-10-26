import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const VALID_STATUS = new Set(['open', 'reviewing', 'resolved', 'dismissed'])

// GET /api/admin/reports — the moderation queue. Filter by status.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20))
    const status = searchParams.get('status') ?? ''

    const supabase = createServerSupabase()

    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status && VALID_STATUS.has(status)) {query = query.eq('status', status)}

    const { data: reports, count, error } = await query
    if (error) {throw error}

    const userIds = [...new Set((reports ?? []).flatMap((r) => [r.reporter_user_id, r.reported_user_id]))]
    const { data: users } = userIds.length > 0
      ? await supabase.from('users').select('id, email, user_type').in('id', userIds)
      : { data: [] }
    const userById = new Map((users ?? []).map((u) => [u.id, u]))

    const enriched = (reports ?? []).map((r) => ({
      ...r,
      reporter_email: userById.get(r.reporter_user_id)?.email ?? null,
      reported_email: userById.get(r.reported_user_id)?.email ?? null,
      reported_user_type: userById.get(r.reported_user_id)?.user_type ?? null,
    }))

    return NextResponse.json({ reports: enriched, total: count ?? 0, page, limit })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/reports' })
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
