import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { karachiToday, toCsv } from '@/lib/outreach/rules'
import {
  fetchAllRows, getOutreachCaller, leadListQuery, leadTypeFromSegment, loadTeam, parseLeadFilters,
  storedLeadDncKeys, teamNameMap, unauthorized,
} from '@/lib/outreach/server'
import type { OutreachLead } from '@/lib/outreach/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const MAX_EXPORT_ROWS = 50_000

const CREATOR_COLUMNS = [
  'lead_id', 'name', 'platform', 'profile_url', 'country', 'niche', 'subscribers', 'avg_views',
  'engagement_pct', 'does_sponsorships', 'sponsor_brands', 'email', 'instagram', 'x', 'linkedin',
  'tiktok', 'website', 'owner', 'mailbox', 'channel', 'status', 'do_not_contact', 'date_contacted',
  'follow_up_date', 'followed_up_date', 'replied_at', 'notes', 'source', 'created_at', 'updated_at',
]
const BRAND_COLUMNS = [
  'lead_id', 'company', 'website', 'domain', 'country', 'product', 'team_size', 'why_them', 'score',
  'contact_name', 'role', 'email', 'linkedin', 'owner', 'mailbox', 'channel', 'status', 'do_not_contact',
  'date_contacted', 'follow_up_date', 'followed_up_date', 'replied_at', 'notes', 'source', 'created_at', 'updated_at',
]

// GET /api/admin/outreach/leads/creators|brands/export: CSV of the table
// with the same filters as the list route (no paging, up to 50,000 rows).
export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const supabase = createServerSupabase()
    const filters = parseLeadFilters(leadType, request.nextUrl.searchParams, caller.userId)
    const leads = await fetchAllRows<OutreachLead>(
      (from, to) => leadListQuery(supabase, leadType, filters, false).range(from, to),
      MAX_EXPORT_ROWS,
    )

    const [team, dncRows, mailboxRows] = await Promise.all([
      loadTeam(supabase),
      fetchAllRows<{ key_type: string; key_value: string }>(
        (from, to) => supabase.from('outreach_dnc').select('key_type, key_value').order('id').range(from, to),
        200_000,
      ),
      supabase.from('outreach_mailboxes').select('id, address'),
    ])
    const names = teamNameMap(team)
    const dnc = new Set(dncRows.map((d) => `${d.key_type}:${d.key_value}`))
    const mailboxes = new Map((mailboxRows.data ?? []).map((m) => [m.id as string, m.address as string]))

    const rows = leads.map((l) => ({
      ...l,
      owner: l.owner_user_id ? names.get(l.owner_user_id) ?? l.owner_user_id : '',
      mailbox: l.mailbox_id ? mailboxes.get(l.mailbox_id) ?? '' : '',
      do_not_contact: storedLeadDncKeys(l).some((k) => dnc.has(`${k.type}:${k.value}`)) ? 'yes' : '',
    }))

    const csv = toCsv(leadType === 'creator' ? CREATOR_COLUMNS : BRAND_COLUMNS, rows)
    const file = `outreach_${leadType}s_${karachiToday()}.csv`
    // UTF-8 BOM so Excel opens non-ASCII names correctly.
    return new NextResponse(String.fromCharCode(0xfeff) + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${file}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/leads/export' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
