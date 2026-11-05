import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import {
  brandDbFilters, creatorDbFilters, DB_PLATFORM_LABELS, RATE_FORMAT_LABELS, type DbPlatform, type RateFormat,
} from '@/lib/outreach/database'
import { searchBrandDb, searchCreatorDb } from '@/lib/outreach/database-server'
import { karachiToday, primaryLink, toCsv } from '@/lib/outreach/rules'
import { getOutreachCaller, leadTypeFromSegment, loadTeam, teamNameMap, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string } }

const MAX_ROWS = 10_000

const CREATOR_COLUMNS = [
  'lead_id', 'name', 'link', 'platforms', 'total_followers', 'niche', 'country', 'availability', 'next_available_date',
  'min_lead_days', 'cheapest', 'typical', 'rate_currency', 'last_quoted_at', 'rates', 'payment_methods', 'upfront_pct',
  'audience_countries', 'audience_languages', 'past_collabs', 'tags', 'owner', 'on_infoishai', 'notes',
]

const BRAND_COLUMNS = [
  'lead_id', 'company', 'link', 'country', 'stage', 'promotes', 'contact_name', 'role', 'email', 'target_countries',
  'niches', 'platforms', 'budget_min', 'budget_max', 'budget_currency', 'creator_sizes', 'start_date', 'campaigns_count',
  'last_campaign_date', 'payment_terms', 'owner', 'notes',
]

const list = (v: unknown) => (Array.isArray(v) ? v.join('; ') : '')

// GET /api/admin/outreach/database/creators|brands/export: CSV of every
// entry matching the same filters as the table. Internal data: admin
// section only. The quality rating column is there for admins only.
export async function GET(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const sp = request.nextUrl.searchParams
    const supabase = createServerSupabase()
    const names = teamNameMap(await loadTeam(supabase))
    const owner = (id: string | null) => (id ? names.get(id) ?? id : '')

    let headers: string[]
    let rows: Record<string, unknown>[]
    if (leadType === 'creator') {
      const { rows: entries } = await searchCreatorDb(supabase, caller, creatorDbFilters(sp, { isAdmin: caller.isAdmin, callerId: caller.userId }), MAX_ROWS, 0)
      headers = caller.isAdmin ? [...CREATOR_COLUMNS.slice(0, -1), 'quality_rating', 'notes'] : CREATOR_COLUMNS
      rows = entries.map((e) => ({
        ...e,
        link: primaryLink('creator', e as unknown as Record<string, unknown>)?.url ?? '',
        platforms: e.all_platforms.map((p) => DB_PLATFORM_LABELS[p as DbPlatform] ?? p).join('; '),
        rates: e.rates.map((r) =>
          `${DB_PLATFORM_LABELS[r.platform as DbPlatform] ?? r.platform} ${RATE_FORMAT_LABELS[r.format as RateFormat] ?? r.format}: ${r.price} ${r.currency}${r.usage_rights ? ' (usage rights)' : ''}${r.quoted_at ? ` [${r.quoted_at}]` : ''}`,
        ).join('; '),
        payment_methods: list(e.payment_methods),
        audience_countries: list(e.audience_countries),
        audience_languages: list(e.audience_languages),
        past_collabs: list(e.past_collabs),
        tags: list(e.tags),
        owner: owner(e.owner_user_id),
        on_infoishai: e.on_infoishai ? `https://infoishai.com/creators/${e.on_infoishai}` : '',
        notes: e.db_notes ?? '',
      }))
    } else {
      const { rows: entries } = await searchBrandDb(supabase, brandDbFilters(sp, { callerId: caller.userId }), MAX_ROWS, 0)
      headers = BRAND_COLUMNS
      rows = entries.map((e) => ({
        ...e,
        link: primaryLink('brand', e as unknown as Record<string, unknown>)?.url ?? '',
        target_countries: list(e.target_countries),
        niches: list(e.niches),
        platforms: e.platforms.map((p) => DB_PLATFORM_LABELS[p as DbPlatform] ?? p).join('; '),
        creator_sizes: list(e.creator_sizes),
        owner: owner(e.owner_user_id),
        notes: e.db_notes ?? '',
      }))
    }

    const file = `${leadType === 'creator' ? 'creator' : 'client'}_database_${karachiToday()}.csv`
    // UTF-8 BOM so Excel opens non-ASCII names correctly.
    return new NextResponse(String.fromCharCode(0xfeff) + toCsv(headers, rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${file}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/database/export' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
