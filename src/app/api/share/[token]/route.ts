import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { rateLimit } from '@/lib/rate-limit'

interface RouteParams {
  params: { token: string }
}

type CreatorSummaryRow = {
  id: string
  username: string
  display_name: string
  profile_photo_url: string | null
  total_followers: number
}

// GET /api/share/[token] — public, no auth. Returns a client-safe view of a
// campaign's tracker: never payout_amount, brand_notes, or client_name, and
// charge_amount only if the link's show_charge flag is on. Listed in
// middleware.ts's public route list (the only entry added there for Phase 2).
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { allowed, retryAfterMs } = await rateLimit(`share-view:${ip}`, 60, 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const { token } = params
    const supabase = createServerSupabase()

    const { data: link } = await supabase
      .from('campaign_share_links')
      .select('id, campaign_id, show_charge, revoked_at')
      .eq('token', token)
      .single()

    if (!link || link.revoked_at) {
      return NextResponse.json({ error: 'This link is invalid or no longer active' }, { status: 404 })
    }

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, title, status')
      .eq('id', link.campaign_id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'This link is invalid or no longer active' }, { status: 404 })
    }

    // Best-effort view tracking — never blocks the response
    supabase
      .from('campaign_share_links')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', link.id)
      .then(({ error }) => {
        if (error) {captureError(error, { route: 'GET /api/share/[token]', context: 'last_viewed_at update' })}
      })

    const { data: rows, error } = await supabase
      .from('campaign_creators')
      .select('id, creator_id, status, planned_date, posted_at, posted_url, charge_amount, currency')
      .eq('campaign_id', link.campaign_id)
      .order('created_at', { ascending: true })

    if (error) {
      captureError(error, { route: 'GET /api/share/[token]' })
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const creatorIds = [...new Set((rows || []).map((r) => r.creator_id))]
    let creators: CreatorSummaryRow[] = []
    let platformByCreator: Record<string, string> = {}

    if (creatorIds.length > 0) {
      const { data: creatorRows } = await supabase
        .from('creators')
        .select('id, username, display_name, profile_photo_url, total_followers')
        .in('id', creatorIds)
      creators = creatorRows || []

      type PlatformRow = { creator_id: string; platform: string; followers: number | null }
      const { data: platformRows } = await supabase
        .from('creator_platforms')
        .select('creator_id, platform, followers')
        .in('creator_id', creatorIds)
      platformByCreator = ((platformRows || []) as PlatformRow[]).reduce<Record<string, string>>((acc, row) => {
        const current = acc[row.creator_id]
        if (!current) {
          acc[row.creator_id] = row.platform
        } else {
          const currentFollowers = (platformRows as PlatformRow[]).find(
            (r) => r.creator_id === row.creator_id && r.platform === current
          )?.followers ?? 0
          if ((row.followers ?? 0) > currentFollowers) {acc[row.creator_id] = row.platform}
        }
        return acc
      }, {})
    }

    // Explicit field list — never spread the raw row, so payout_amount/
    // brand_notes can never leak here even if a future column is added.
    const creatorRows = (rows || []).map((row) => {
      const creator = creators.find((c) => c.id === row.creator_id) || null
      return {
        id: row.id,
        status: row.status,
        planned_date: row.planned_date,
        posted_at: row.posted_at,
        posted_url: row.posted_url,
        currency: row.currency,
        ...(link.show_charge ? { charge_amount: row.charge_amount } : {}),
        creator: creator ? {
          id: creator.id,
          username: creator.username,
          display_name: creator.display_name,
          profile_photo_url: creator.profile_photo_url,
          total_followers: creator.total_followers,
          primary_platform: platformByCreator[creator.id] ?? null,
        } : null,
      }
    })

    const totals = {
      total_creators: creatorRows.length,
      posted_count: creatorRows.filter((r) => r.status === 'posted' || r.status === 'completed').length,
      completed_count: creatorRows.filter((r) => r.status === 'completed').length,
      ...(link.show_charge
        ? { total_charge: creatorRows.reduce((sum, r) => sum + (('charge_amount' in r ? r.charge_amount : 0) || 0), 0) }
        : {}),
    }

    return NextResponse.json({
      campaign: { title: campaign.title, status: campaign.status },
      creators: creatorRows,
      totals,
      show_charge: link.show_charge,
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/share/[token]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
