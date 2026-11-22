import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { roundRobin } from '@/lib/outreach/rules'
import { NEEDS_ASSIGNMENT_MIGRATION, outreachFeatures } from '@/lib/outreach/schema'
import {
  adminOnly, assignLeads, fetchAllRows, getOutreachCaller, leadListQuery, leadTypeFromSegment, loadTeam, mapDbError,
  parseLeadFilters, unauthorized,
} from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string } }

const SPLIT_MAX = 10_000

const schema = z.discriminatedUnion('mode', [
  // Assign (or unassign with null) the given leads: one row, the checked rows,
  // or a batch of "all N matching" ids fetched by the table.
  z.object({
    mode: z.literal('ids'),
    lead_ids: z.array(z.string().min(1).max(255)).min(1).max(1000),
    owner_user_id: z.string().min(1).max(255).nullable(),
    reason: z.string().trim().max(500).optional(),
  }),
  // Auto-split: the UNASSIGNED leads matching `filter` (the table's query
  // string), dealt round-robin to member_ids in lead id order.
  // commit false = preview (writes nothing).
  z.object({
    mode: z.literal('split'),
    filter: z.string().max(4000),
    member_ids: z.array(z.string().min(1).max(255)).min(1).max(20),
    commit: z.boolean(),
    reason: z.string().trim().max(500).optional(),
  }),
])

// POST /api/admin/outreach/leads/creators|brands/assign (admins).
// Every change goes through outreach_assign_leads(): one owner_changed
// activity row per lead (who, old owner, new owner, when).
export async function POST(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const body = parsed.data
    const supabase = createServerSupabase()
    if (!(await outreachFeatures(supabase)).assignment) {return NextResponse.json(NEEDS_ASSIGNMENT_MIGRATION, { status: 409 })}

    const team = await loadTeam(supabase)
    const active = new Map(team.filter((t) => t.is_active).map((t) => [t.user_id, t.display_name]))

    if (body.mode === 'ids') {
      if (body.owner_user_id && !active.has(body.owner_user_id)) {
        return NextResponse.json({ error: 'Pick an active team member.' }, { status: 400 })
      }
      const { updated } = await assignLeads(supabase, leadType, body.lead_ids, body.owner_user_id, caller.userId)
      logAdminAction({
        request, adminId: caller.userId, action: 'outreach_leads_assigned', targetType: `outreach_${leadType}`,
        targetId: `${updated} leads`, reason: body.reason || 'assign leads', before: null,
        after: { owner_user_id: body.owner_user_id, lead_ids: body.lead_ids },
      })
      const to = body.owner_user_id ? active.get(body.owner_user_id) : 'nobody (unassigned)'
      return NextResponse.json({ message: `${updated} leads assigned to ${to}`, updated })
    }

    // Auto-split.
    const members = [...new Set(body.member_ids)]
    const unknown = members.find((m) => !active.has(m))
    if (unknown) {return NextResponse.json({ error: 'Pick active team members only.' }, { status: 400 })}

    const filters = {
      ...parseLeadFilters(leadType, new URLSearchParams(body.filter), caller.userId),
      owner: 'none', deleted: false, sort: 'lead_id', dir: 'asc' as const,
    }
    const rows = await fetchAllRows<{ lead_id: string }>(
      (from, to) => leadListQuery(supabase, leadType, filters, 'ids').range(from, to),
      SPLIT_MAX,
    )
    const ids = rows.map((r) => r.lead_id)
    const split = roundRobin(ids, members)
    const summary = members.map((m) => ({ user_id: m, display_name: active.get(m) ?? m, count: split.get(m)?.length ?? 0 }))

    if (!body.commit) {
      return NextResponse.json({ preview: true, total: ids.length, capped: ids.length >= SPLIT_MAX, split: summary })
    }

    let updated = 0
    for (const m of members) {
      updated += (await assignLeads(supabase, leadType, split.get(m) ?? [], m, caller.userId)).updated
    }
    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_leads_auto_split', targetType: `outreach_${leadType}`,
      targetId: `${updated} leads`, reason: body.reason || 'auto-split unassigned leads', before: null,
      after: { filter: body.filter, split: summary },
    })
    return NextResponse.json({
      message: `${updated} leads split between ${summary.map((s) => `${s.display_name} (${s.count})`).join(', ')}`,
      updated, total: ids.length, split: summary,
    })
  } catch (err) {
    const mapped = mapDbError(err as { message?: string; code?: string })
    if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
    captureError(err, { route: 'POST /api/admin/outreach/leads/assign' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
