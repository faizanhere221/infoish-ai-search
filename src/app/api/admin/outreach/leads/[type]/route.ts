import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { leadKeys, validateLeadUpdates } from '@/lib/outreach/rules'
import {
  adminOnly, fetchAllRows, filterValues, findDuplicates, getOutreachCaller, leadListQuery, leadTable, leadTypeFromSegment,
  loadTeam, mapDbError, parseLeadFilters, unauthorized, withDncFlags,
} from '@/lib/outreach/server'
import type { OutreachLead } from '@/lib/outreach/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string } }

const MAX_IDS = 50_000

// GET /api/admin/outreach/leads/creators|brands
// Filters: owner (user id | me | none), status (comma list), country, niche,
// platform, channel, missing=email, q, deleted=1 (admins: deleted leads only;
// otherwise deleted leads are hidden). Sort: sort + dir. Paging: limit (max
// 200) + offset. meta=1 adds the filter dropdown values. ids=1 (admins)
// returns every matching lead id instead, for "select all N matching".
export async function GET(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const sp = request.nextUrl.searchParams
    const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '50', 10) || 50, 1), 200)
    const offset = Math.max(parseInt(sp.get('offset') ?? '0', 10) || 0, 0)
    const filters = parseLeadFilters(leadType, sp, caller.userId)
    if (filters.deleted && !caller.isAdmin) {return adminOnly()}

    const supabase = createServerSupabase()

    if (sp.get('ids') === '1') {
      if (!caller.isAdmin) {return adminOnly()}
      const rows = await fetchAllRows<{ lead_id: string }>(
        (from, to) => leadListQuery(supabase, leadType, filters, 'ids').range(from, to),
        MAX_IDS,
      )
      return NextResponse.json({ ids: rows.map((r) => r.lead_id), total: rows.length, capped: rows.length >= MAX_IDS })
    }

    const { data, error, count } = await leadListQuery(supabase, leadType, filters, true).range(offset, offset + limit - 1)
    if (error) {
      captureError(error, { route: 'GET /api/admin/outreach/leads' })
      return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 })
    }

    const leads = await withDncFlags(supabase, (data ?? []) as OutreachLead[])
    const meta = sp.get('meta') === '1' ? await filterValues(supabase, leadType) : undefined

    // "N leads without email" under the same filters, for the quick filter.
    const { count: missingEmailCount } = await leadListQuery(supabase, leadType, { ...filters, missingEmail: true }, 'head')

    return NextResponse.json({ leads, total: count ?? 0, limit, offset, filterValues: meta, missingEmailCount: missingEmailCount ?? 0 })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/leads' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/outreach/leads/creators|brands: add one lead by hand.
// 409 with `duplicates` when the email/URL/domain already exists.
export async function POST(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Send the lead fields' }, { status: 400 })
    }
    // Same per-field rules as edits (email format, https:// added to URLs,
    // numbers >= 0). Empty fields are left out of the insert.
    const { values, errors } = validateLeadUpdates(leadType, body as Record<string, unknown>)
    const errorFields = Object.keys(errors)
    if (errorFields.length > 0) {
      return NextResponse.json(
        { error: errors[errorFields[0]], fields: Object.fromEntries(errorFields.map((f) => [f, [errors[f]]])) },
        { status: 400 },
      )
    }
    const fields = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null)) as Record<string, unknown>
    // Members add leads for themselves; only admins pick another owner.
    if (!caller.isAdmin) {fields.owner_user_id = caller.userId}

    const keys = leadKeys(leadType, fields)
    if (keys.length === 0) {
      const need = leadType === 'creator' ? 'a profile URL or email' : 'a domain, website or email'
      return NextResponse.json({ error: `Add ${need} so duplicates are caught.` }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const team = await loadTeam(supabase)
    if (fields.owner_user_id && !team.some((t) => t.user_id === fields.owner_user_id)) {
      return NextResponse.json({ error: 'Owner must be a team member' }, { status: 400 })
    }

    const duplicates = await findDuplicates(supabase, keys)
    if (duplicates.size > 0) {
      const list = [...duplicates.values()]
      const deleted = list.find((d) => d.deleted)
      return NextResponse.json(
        { error: deleted ? `Previously deleted: ${deleted.lead_id}` : 'Already exists', duplicates: list },
        { status: 409 },
      )
    }

    const { data, error } = await supabase
      .from(leadTable(leadType))
      .insert({ ...fields, owner_user_id: fields.owner_user_id ?? caller.userId, source: fields.source ?? 'manual' })
      .select('*')
      .single()

    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {
        const dupes = mapped.code === 'outreach_duplicate' ? [...(await findDuplicates(supabase, keys)).values()] : undefined
        return NextResponse.json({ error: mapped.message, duplicates: dupes }, { status: mapped.status })
      }
      captureError(error, { route: 'POST /api/admin/outreach/leads' })
      return NextResponse.json({ error: 'Failed to add lead' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Lead added', lead: data }, { status: 201 })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/leads' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
