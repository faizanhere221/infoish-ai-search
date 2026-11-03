import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { karachiToday } from '@/lib/outreach/rules'
import { mailboxCreateSchema } from '@/lib/outreach/schemas'
import { adminOnly, getOutreachCaller, loadTeam, unauthorized } from '@/lib/outreach/server'
import { capacitySummary, loadMailboxesWithUsage, loadUserStats, memberPaces } from '@/lib/outreach/stats'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET: every mailbox with today's limit and sends, plus total capacity vs
// what the monthly targets need. Everyone on the team sees it.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const supabase = createServerSupabase()
    const today = karachiToday()
    const [mailboxes, team, stats] = await Promise.all([
      loadMailboxesWithUsage(supabase, today),
      loadTeam(supabase),
      loadUserStats(supabase, today),
    ])
    const capacity = capacitySummary(mailboxes, memberPaces(team, stats, today))
    return NextResponse.json({ mailboxes, capacity, today })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/mailboxes' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST (admin): add a mailbox.
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}

  try {
    const parsed = mailboxCreateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase.from('outreach_mailboxes').insert(parsed.data).select('*').single()
    if (error) {
      if (error.code === '23505') {return NextResponse.json({ error: 'This mailbox already exists' }, { status: 409 })}
      if (error.code === '23503') {return NextResponse.json({ error: 'Owner not found' }, { status: 400 })}
      captureError(error, { route: 'POST /api/admin/outreach/mailboxes' })
      return NextResponse.json({ error: 'Failed to add mailbox' }, { status: 500 })
    }

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_mailbox_added', targetType: 'outreach_mailbox',
      targetId: data.id, reason: 'mailbox added', after: parsed.data,
    })
    return NextResponse.json({ message: 'Mailbox added', mailbox: data }, { status: 201 })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/mailboxes' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
