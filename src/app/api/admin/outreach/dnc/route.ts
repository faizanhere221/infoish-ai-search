import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { normalizeDncValue } from '@/lib/outreach/rules'
import { dncCreateSchema } from '@/lib/outreach/schemas'
import { adminOnly, getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET: the do-not-contact list (everyone on the team sees it).
// q searches the value, reason filters, limit/offset page it.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const sp = request.nextUrl.searchParams
    const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '50', 10) || 50, 1), 200)
    const offset = Math.max(parseInt(sp.get('offset') ?? '0', 10) || 0, 0)
    const q = (sp.get('q') ?? '').replace(/[%*\\]/g, '').trim().toLowerCase()
    const reason = sp.get('reason')

    const supabase = createServerSupabase()
    let query = supabase.from('outreach_dnc').select('*', { count: 'exact' })
    if (q) {query = query.ilike('key_value', `%${q}%`)}
    if (reason) {query = query.eq('reason', reason)}
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    if (error) {
      captureError(error, { route: 'GET /api/admin/outreach/dnc' })
      return NextResponse.json({ error: 'Failed to load the list' }, { status: 500 })
    }
    return NextResponse.json({ entries: data ?? [], total: count ?? 0, limit, offset })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/dnc' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST (admin): add an email, domain or profile URL. Stored normalised.
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}

  try {
    const parsed = dncCreateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { key_type, value, reason, note } = parsed.data
    const key_value = normalizeDncValue(key_type, value)
    if (!key_value) {return NextResponse.json({ error: 'Enter a value' }, { status: 400 })}

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('outreach_dnc')
      .insert({ key_type, key_value, reason, note: note ?? null, created_by: caller.userId })
      .select('*')
      .single()
    if (error) {
      if (error.code === '23505') {return NextResponse.json({ error: 'Already on the list' }, { status: 409 })}
      captureError(error, { route: 'POST /api/admin/outreach/dnc' })
      return NextResponse.json({ error: 'Failed to add entry' }, { status: 500 })
    }

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_dnc_added', targetType: 'outreach_dnc',
      targetId: data.id, reason, after: { key_type, key_value },
    })
    return NextResponse.json({ message: 'Added to the do-not-contact list', entry: data }, { status: 201 })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/dnc' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
