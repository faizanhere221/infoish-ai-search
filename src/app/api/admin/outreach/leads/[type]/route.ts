import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { withContactSummaries } from '@/lib/outreach/contacts'
import { createLead } from '@/lib/outreach/create'
import { outreachFeatures } from '@/lib/outreach/schema'
import { withDbFlags } from '@/lib/outreach/database-server'
import {
  adminOnly, fetchAllRows, filterValues, getOutreachCaller, leadListQuery, leadTypeFromSegment,
  parseLeadFilters, unauthorized, withDncFlags,
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
// list (after the contacts/lists migration; ignored before it). Brand rows
// carry contacts {count, primary}; `features` says what the database has.
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
    // Lists and contacts exist once outreach_contacts_lists_migration.sql ran.
    const features = await outreachFeatures(supabase)
    if (!features.lists) {filters.list = null}

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

    const flagged = await withDbFlags(supabase, leadType, await withDncFlags(supabase, (data ?? []) as OutreachLead[]))
    const leads = leadType === 'brand' && features.contacts ? await withContactSummaries(supabase, flagged) : flagged
    const meta = sp.get('meta') === '1' ? await filterValues(supabase, leadType) : undefined

    // "N leads without email" under the same filters, for the quick filter.
    const { count: missingEmailCount } = await leadListQuery(supabase, leadType, { ...filters, missingEmail: true }, 'head')

    return NextResponse.json({ leads, total: count ?? 0, limit, offset, filterValues: meta, missingEmailCount: missingEmailCount ?? 0, features })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/leads' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/outreach/leads/creators|brands: add one lead by hand.
// 409 with `duplicates` when the email/URL/domain already exists (createLead).
export async function POST(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const body = await request.json().catch(() => null)
    const supabase = createServerSupabase()
    const outcome = await createLead(supabase, caller, leadType, body, 'POST /api/admin/outreach/leads')
    if (!outcome.ok) {return NextResponse.json(outcome.body, { status: outcome.status })}
    return NextResponse.json({ message: 'Lead added', lead: outcome.lead }, { status: 201 })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/leads' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
