import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { leadKeys } from '@/lib/outreach/rules'
import { brandFieldsSchema, creatorFieldsSchema } from '@/lib/outreach/schemas'
import {
  filterValues, findDuplicates, getOutreachCaller, leadListQuery, leadTable, leadTypeFromSegment,
  loadTeam, mapDbError, parseLeadFilters, unauthorized, withDncFlags,
} from '@/lib/outreach/server'
import type { OutreachLead } from '@/lib/outreach/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string } }

// GET /api/admin/outreach/leads/creators|brands
// Filters: owner (user id | me | none), status (comma list), country, niche,
// platform, channel, q. Sort: sort + dir. Paging: limit (max 200) + offset.
// meta=1 adds the filter dropdown values.
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

    const supabase = createServerSupabase()
    const { data, error, count } = await leadListQuery(supabase, leadType, filters, true).range(offset, offset + limit - 1)
    if (error) {
      captureError(error, { route: 'GET /api/admin/outreach/leads' })
      return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 })
    }

    const leads = await withDncFlags(supabase, (data ?? []) as OutreachLead[])
    const meta = sp.get('meta') === '1' ? await filterValues(supabase, leadType) : undefined

    return NextResponse.json({ leads, total: count ?? 0, limit, offset, filterValues: meta })
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
    const schema = leadType === 'creator' ? creatorFieldsSchema : brandFieldsSchema
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const fields = parsed.data as Record<string, unknown>

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
      return NextResponse.json({ error: 'Already exists', duplicates: [...duplicates.values()] }, { status: 409 })
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
