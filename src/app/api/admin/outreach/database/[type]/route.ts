import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { createLead } from '@/lib/outreach/create'
import { brandDbFilters, creatorDbFilters } from '@/lib/outreach/database'
import { creatorDbTags, searchBrandDb, searchCreatorDb } from '@/lib/outreach/database-server'
import { filterValues, getOutreachCaller, leadTypeFromSegment, mapDbError, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string } }

// GET /api/admin/outreach/database/creators|brands
// Creators: q, niche, country, platform, format, availability, tag (comma
// lists), max_price + currency, min_rating (admins), owner (id | me |
// none), sort (added|name|price|followers|rating|rate_date) + dir.
// Brands: q, stage, country, niche, platform, min_budget + currency, owner,
// sort (added|company|budget|start_date) + dir.
// Paging: limit (max 200) + offset. meta=1 adds filter dropdown values.
export async function GET(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const sp = request.nextUrl.searchParams
    const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '50', 10) || 50, 1), 200)
    const offset = Math.max(parseInt(sp.get('offset') ?? '0', 10) || 0, 0)
    const supabase = createServerSupabase()

    const result = leadType === 'creator'
      ? await searchCreatorDb(supabase, caller, creatorDbFilters(sp, { isAdmin: caller.isAdmin, callerId: caller.userId }), limit, offset)
      : await searchBrandDb(supabase, brandDbFilters(sp, { callerId: caller.userId }), limit, offset)

    let meta: Record<string, string[]> | undefined
    if (sp.get('meta') === '1') {
      // Creator niches/countries for both: a client's target countries are
      // matched against creators, so the same names help on both pages.
      const [values, brandValues, tags] = await Promise.all([
        filterValues(supabase, 'creator'),
        leadType === 'brand' ? filterValues(supabase, 'brand') : Promise.resolve(null),
        leadType === 'creator' ? creatorDbTags(supabase) : Promise.resolve([] as string[]),
      ])
      const countries = [...new Set([...values.countries, ...(brandValues?.countries ?? [])])].sort((a, b) => a.localeCompare(b))
      meta = { countries, niches: values.niches, tags }
    }

    return NextResponse.json({ rows: result.rows, total: result.total, limit, offset, filterValues: meta })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/database' })
    return NextResponse.json({ error: 'Failed to load the Database' }, { status: 500 })
  }
}

const DIRECT_STATUS: Record<'creator' | 'brand', string[]> = {
  creator: ['replied'],
  brand: ['replied', 'call_booked', 'won'],
}

// POST /api/admin/outreach/database/creators|brands
//   { lead_id }                 add an existing lead (or restore a removed entry)
//   { lead: {...}, status? }    add directly: creates the lead with the usual
//                               duplicate/DNC rules (409 + duplicates, so the
//                               UI offers "add C-0123 instead"), then adds it.
//                               Creators get status replied; brands replied
//                               (default), call_booked or won.
export async function POST(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Send lead_id or lead' }, { status: 400 })
    }
    const supabase = createServerSupabase()

    let leadId: string
    let status: string | null = null
    let created = false
    if (typeof body.lead_id === 'string' && body.lead_id.trim()) {
      leadId = body.lead_id.trim().slice(0, 255)
    } else if (body.lead && typeof body.lead === 'object') {
      status = typeof body.status === 'string' ? body.status : 'replied'
      if (!DIRECT_STATUS[leadType].includes(status)) {
        return NextResponse.json({ error: 'Pick a status: ' + DIRECT_STATUS[leadType].join(', '), fields: { status: ['Invalid status'] } }, { status: 400 })
      }
      const outcome = await createLead(supabase, caller, leadType, body.lead, 'POST /api/admin/outreach/database')
      if (!outcome.ok) {return NextResponse.json(outcome.body, { status: outcome.status })}
      leadId = outcome.lead.lead_id
      created = true
    } else {
      return NextResponse.json({ error: 'Send lead_id or lead' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('outreach_db_add', {
      p_lead_type: leadType, p_lead_id: leadId, p_user_id: caller.userId, p_status: status,
    })
    if (error) {
      if (created) {
        captureError(error, { route: 'POST /api/admin/outreach/database', leadId })
        return NextResponse.json(
          { error: `${leadId} was added as a lead, but adding it to the Database failed. Use "Add to DB" on the lead.`, lead_id: leadId },
          { status: 500 },
        )
      }
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
      captureError(error, { route: 'POST /api/admin/outreach/database' })
      return NextResponse.json({ error: 'Failed to add to the Database' }, { status: 500 })
    }

    const r = (data ?? {}) as { added?: boolean; restored?: boolean; already?: boolean }
    const message = r.already ? `${leadId} is already in the Database` : r.restored ? `${leadId} is back in the Database` : `${leadId} added to the Database`
    return NextResponse.json({ message, lead_id: leadId, created, ...r }, { status: r.already ? 200 : 201 })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/database' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
