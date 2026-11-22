import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { CLAIM_MAX_PER_REQUEST, listsFor, STALE_STATUSES, type LeadType } from '@/lib/outreach/rules'
import { NEEDS_CLAIM_MIGRATION, outreachFeatures } from '@/lib/outreach/schema'
import { getOutreachCaller, leadTable, mapDbError, parseLeadType, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Supabase = ReturnType<typeof createServerSupabase>

const claimSchema = z.object({
  lead_type: z.enum(['creator', 'brand']),
  count: z.number().int().min(1).max(CLAIM_MAX_PER_REQUEST),
  list: z.string().max(30).nullable().optional(),
})

function validList(leadType: LeadType, list: string | null | undefined): string | null | false {
  if (!list) {return null}
  return (listsFor(leadType) as readonly string[]).includes(list) ? list : false
}

async function claimStatus(supabase: Supabase, userId: string) {
  const [cap, used] = await Promise.all([
    supabase.rpc('outreach_claim_daily_cap'),
    supabase.rpc('outreach_claimed_today', { p_user_id: userId }),
  ])
  if (cap.error) {throw cap.error}
  if (used.error) {throw used.error}
  return { cap: Number(cap.data ?? 0), claimedToday: Number(used.data ?? 0) }
}

// GET /api/admin/outreach/claim?type=creator|brand&list=
// How many leads are up for claiming, and the caller's daily allowance.
// A COUNT only: members never see the unassigned pool itself.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = parseLeadType(request.nextUrl.searchParams.get('type'))
  if (!leadType) {return NextResponse.json({ error: 'Pick creator or brand' }, { status: 400 })}
  const list = validList(leadType, request.nextUrl.searchParams.get('list'))
  if (list === false) {return NextResponse.json({ error: 'Unknown list' }, { status: 400 })}

  try {
    const supabase = createServerSupabase()
    if (!(await outreachFeatures(supabase)).claim) {return NextResponse.json({ ...NEEDS_CLAIM_MIGRATION, enabled: false }, { status: 409 })}

    let q = supabase.from(leadTable(leadType)).select('lead_id', { count: 'exact', head: true })
      .is('owner_user_id', null).is('deleted_at', null).in('status', [...STALE_STATUSES])
    if (list) {q = q.eq('list', list)}
    const [{ count, error }, status] = await Promise.all([q, claimStatus(supabase, caller.userId)])
    if (error) {throw error}

    return NextResponse.json({
      enabled: true,
      available: count ?? 0,
      cap: status.cap,
      claimed_today: status.claimedToday,
      remaining_today: Math.max(0, status.cap - status.claimedToday),
      max_per_claim: CLAIM_MAX_PER_REQUEST,
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/claim' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/outreach/claim (outreach members): { lead_type, count
// 1..25, list? }. outreach_claim_leads() gives the caller the next `count`
// unassigned open leads, oldest first (FOR UPDATE SKIP LOCKED: two members
// never get the same lead), within the daily cap, and logs each as
// owner_changed (rule 'claim', assigned_by = the member). Admins assign
// leads directly instead.
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (caller.isAdmin) {
    return NextResponse.json({ error: 'Admins assign leads from the table instead of claiming them.' }, { status: 403 })
  }

  try {
    const parsed = claimSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: `Claim 1 to ${CLAIM_MAX_PER_REQUEST} leads at a time.`, fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { lead_type, count } = parsed.data
    const list = validList(lead_type, parsed.data.list)
    if (list === false) {return NextResponse.json({ error: 'Unknown list', fields: { list: ['Unknown list'] } }, { status: 400 })}

    const supabase = createServerSupabase()
    if (!(await outreachFeatures(supabase)).claim) {return NextResponse.json(NEEDS_CLAIM_MIGRATION, { status: 409 })}

    const { data, error } = await supabase.rpc('outreach_claim_leads', {
      p_lead_type: lead_type, p_user_id: caller.userId, p_count: count, p_list: list,
    })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {
        const [used, cap] = (mapped.detail ?? '').split('/').map(Number)
        const message = mapped.code === 'outreach_claim_cap' && cap
          ? `You claimed ${used} of ${cap} leads today, the daily limit. Claim again tomorrow or ask an admin.`
          : mapped.message
        return NextResponse.json({ error: message, code: mapped.code }, { status: mapped.status })
      }
      captureError(error, { route: 'POST /api/admin/outreach/claim' })
      return NextResponse.json({ error: 'Failed to claim leads' }, { status: 500 })
    }

    const r = (data ?? {}) as { claimed: number; lead_ids: string[]; claimed_today: number; cap: number }
    const word = lead_type === 'creator' ? 'creator' : 'brand'
    const message = r.claimed === 0
      ? `No unassigned ${word} leads left to claim${list ? ' in this list' : ''}.`
      : `${r.claimed} ${word} lead${r.claimed === 1 ? '' : 's'} claimed. ${r.claimed_today} of ${r.cap} today.`
    return NextResponse.json({ message, claimed: r.claimed, lead_ids: r.lead_ids, claimed_today: r.claimed_today, cap: r.cap })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/claim' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
