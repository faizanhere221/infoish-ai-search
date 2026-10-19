import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'
import { CAMPAIGN_CREATOR_STATUSES } from '@/types/campaigns'
import { refreshDuePayments } from '@/lib/payments/engine'
import { expireStaleOffers } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromCreator } from '@/lib/notifications'
import { isCreatorPublic } from '@/lib/creators/visibility'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

const STATUS_VALUES = CAMPAIGN_CREATOR_STATUSES as unknown as [string, ...string[]]

const AddCreatorSchema = z.object({
  creator_id: z.string().min(1),
  status: z.enum(STATUS_VALUES).optional(),
  planned_date: z.string().optional().nullable(),
  payout_amount: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  charge_amount: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  currency: z.string().min(3).max(10).optional(),
  brand_notes: z.string().max(2000).optional().nullable(),
})

type CreatorSummaryRow = {
  id: string
  username: string
  display_name: string
  profile_photo_url: string | null
  total_followers: number
}

// Attaches `creator` (avatar/name/primary platform) and `campaign` (title,
// client_name) joins to a list of campaign_creators rows. `includeClientName`
// is false for creator-facing responses — client_name must never reach a
// creator even nested inside a joined campaign object.
async function attachJoins(
  supabase: ReturnType<typeof createServerSupabase>,
  rows: { creator_id: string }[],
  campaign: { id: string; title: string; client_name?: string | null },
  includeClientName: boolean
) {
  const creatorIds = [...new Set(rows.map((r) => r.creator_id))]
  let creators: CreatorSummaryRow[] = []
  let platformByCreator: Record<string, string> = {}

  if (creatorIds.length > 0) {
    const { data } = await supabase
      .from('creators')
      .select('id, username, display_name, profile_photo_url, total_followers')
      .in('id', creatorIds)
    creators = data || []

    const { data: platformRows } = await supabase
      .from('creator_platforms')
      .select('creator_id, platform, followers')
      .in('creator_id', creatorIds)
    type PlatformRow = { creator_id: string; platform: string; followers: number | null }
    platformByCreator = ((platformRows || []) as PlatformRow[]).reduce<Record<string, string>>((acc, row) => {
      const currentPlatform = acc[row.creator_id]
      if (!currentPlatform) {
        acc[row.creator_id] = row.platform
      } else {
        const currentFollowers = (platformRows as PlatformRow[]).find(
          (r) => r.creator_id === row.creator_id && r.platform === currentPlatform
        )?.followers ?? 0
        if ((row.followers ?? 0) > currentFollowers) {acc[row.creator_id] = row.platform}
      }
      return acc
    }, {})
  }

  const campaignSummary = includeClientName
    ? { id: campaign.id, title: campaign.title, client_name: campaign.client_name ?? null }
    : { id: campaign.id, title: campaign.title }

  return { creators, platformByCreator, campaignSummary }
}

// GET /api/campaigns/[id]/creators
// Brand owner: every row, full fields (incl. charge_amount, brand_notes,
// client_name via the joined campaign). A creator: only their own row, with
// charge_amount/brand_notes/client_name stripped server-side — never relies
// on the frontend to hide them.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id, title, client_name')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const isOwner = callerUserType === 'brand' && callerProfileId === campaign.brand_id

    if (isOwner) {
      const { data: rows, error } = await supabase
        .from('campaign_creators')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: true })

      if (error) {
        captureError(error, { route: 'GET /api/campaigns/[id]/creators' })
        return NextResponse.json({ error: 'Failed to fetch campaign creators' }, { status: 500 })
      }

      const { creators, platformByCreator, campaignSummary } = await attachJoins(supabase, rows || [], campaign, true)

      // Deliverable counts per row, for the "N drafts waiting for review"
      // banner and overdue indicators — one extra query, not N+1.
      const rowIds = (rows || []).map((r) => r.id)
      type DeliverableCountRow = { campaign_creator_id: string; status: string; draft_due: string | null; publish_due: string | null }
      const { data: deliverableRows } = rowIds.length > 0
        ? await supabase
            .from('creator_deliverables')
            .select('campaign_creator_id, status, draft_due, publish_due')
            .in('campaign_creator_id', rowIds)
        : { data: [] as DeliverableCountRow[] }

      const now = new Date()
      const countsByRow: Record<string, { pendingReview: number; overdue: number }> = {}
      let totalPendingReview = 0
      for (const d of (deliverableRows || []) as DeliverableCountRow[]) {
        const counts = countsByRow[d.campaign_creator_id] || { pendingReview: 0, overdue: 0 }
        if (d.status === 'draft_submitted') {
          counts.pendingReview += 1
          totalPendingReview += 1
        }
        const isActive = d.status !== 'posted' && d.status !== 'completed'
        const dueDate = d.draft_due || d.publish_due
        if (isActive && dueDate && new Date(dueDate) < now) {
          counts.overdue += 1
        }
        countsByRow[d.campaign_creator_id] = counts
      }

      // Contract status per row, for the tracker's "Contract" badge — one
      // extra query, not N+1. Only the active (non-void) contract matters
      // here, so the most recent version wins.
      type ContractStatusRow = { campaign_creator_id: string; status: string; version: number }
      const { data: contractRows } = rowIds.length > 0
        ? await supabase
            .from('campaign_contracts')
            .select('campaign_creator_id, status, version')
            .in('campaign_creator_id', rowIds)
            .neq('status', 'void')
        : { data: [] as ContractStatusRow[] }

      const contractStatusByRow: Record<string, string> = {}
      for (const c of (contractRows || []) as ContractStatusRow[]) {
        contractStatusByRow[c.campaign_creator_id] = c.status
      }

      // Payment status per row, for the tracker's payment column and
      // "overdue payments" badge. "Worst" active status wins — a creator
      // waiting on an overdue payment matters more than a different, paid
      // record on the same row. Lazy due-transition first (no cron), same
      // as every other payment-reading GET — otherwise a payment that
      // should already show 'due' keeps showing 'scheduled' here until
      // someone happens to open that row's own Payments tab.
      if (rowIds.length > 0) {
        await Promise.all(rowIds.map((rowId) => refreshDuePayments(supabase, rowId)))
      }

      type PaymentStatusRow = { campaign_creator_id: string; status: string; due_date: string | null }
      const { data: paymentRows } = rowIds.length > 0
        ? await supabase
            .from('creator_payments')
            .select('campaign_creator_id, status, due_date')
            .in('campaign_creator_id', rowIds)
            .neq('status', 'cancelled')
        : { data: [] as PaymentStatusRow[] }

      const paymentCheckNow = new Date()
      const PAYMENT_STATUS_RANK: Record<string, number> = {
        disputed: 5, due: 4, marked_paid: 3, scheduled: 2, confirmed: 1,
      }
      const paymentSummaryByRow: Record<string, { status: string; overdue: boolean }> = {}
      let totalOverduePayments = 0
      const overdueRowIds = new Set<string>()
      for (const p of (paymentRows || []) as PaymentStatusRow[]) {
        const overdue = p.status === 'due' && !!p.due_date && new Date(p.due_date) < paymentCheckNow
        if (overdue && !overdueRowIds.has(p.campaign_creator_id)) {
          overdueRowIds.add(p.campaign_creator_id)
          totalOverduePayments += 1
        }
        const current = paymentSummaryByRow[p.campaign_creator_id]
        const rank = PAYMENT_STATUS_RANK[p.status] ?? 0
        if (!current || rank > (PAYMENT_STATUS_RANK[current.status] ?? 0)) {
          paymentSummaryByRow[p.campaign_creator_id] = { status: p.status, overdue }
        } else if (overdue) {
          current.overdue = true
        }
      }

      // Pending offer per row (who sent it), for the "next step" guidance
      // helper — same lazy-expiry-then-read pattern used everywhere else
      // offers are read.
      await Promise.all(rowIds.map((rowId) => expireStaleOffers(supabase, rowId)))
      const { data: offerRows } = rowIds.length > 0
        ? await supabase.from('campaign_offers').select('campaign_creator_id, from_party').in('campaign_creator_id', rowIds).eq('status', 'pending')
        : { data: [] }
      const pendingOfferByRow: Record<string, 'brand' | 'creator'> = {}
      for (const o of offerRows || []) {pendingOfferByRow[o.campaign_creator_id] = o.from_party}

      const deliverableStatusesByRow: Record<string, string[]> = {}
      for (const d of (deliverableRows || []) as DeliverableCountRow[]) {
        const list = deliverableStatusesByRow[d.campaign_creator_id] || []
        list.push(d.status)
        deliverableStatusesByRow[d.campaign_creator_id] = list
      }

      const withRelations = (rows || []).map((row) => {
        const creator = creators.find((c) => c.id === row.creator_id) || null
        const counts = countsByRow[row.id] || { pendingReview: 0, overdue: 0 }
        return {
          ...row,
          creator: creator ? { ...creator, primary_platform: platformByCreator[creator.id] ?? null } : null,
          campaign: campaignSummary,
          deliverables_pending_review: counts.pendingReview,
          deliverables_overdue: counts.overdue,
          contract_status: contractStatusByRow[row.id] ?? null,
          payment_status: paymentSummaryByRow[row.id]?.status ?? null,
          payment_overdue: paymentSummaryByRow[row.id]?.overdue ?? false,
          pending_offer_from: pendingOfferByRow[row.id] ?? null,
          deliverable_statuses: deliverableStatusesByRow[row.id] ?? [],
        }
      })

      return NextResponse.json({
        campaign_creators: withRelations,
        pending_review_count: totalPendingReview,
        overdue_payments_count: totalOverduePayments,
      })
    }

    if (callerUserType === 'creator' && callerProfileId) {
      const { data: rows, error } = await supabase
        .from('campaign_creators')
        .select('id, campaign_id, status, planned_date, posted_at, posted_url, payout_amount, currency, creator_id')
        .eq('campaign_id', id)
        .eq('creator_id', callerProfileId)

      if (error) {
        captureError(error, { route: 'GET /api/campaigns/[id]/creators' })
        return NextResponse.json({ error: 'Failed to fetch campaign creators' }, { status: 500 })
      }

      const { campaignSummary } = await attachJoins(supabase, rows || [], campaign, false)

      const { data: brand } = await supabase
        .from('brands')
        .select('id, company_name, logo_url, contact_name, industry')
        .eq('id', campaign.brand_id)
        .single()

      // Explicit field list (not a spread of `row`) so a future column added
      // to campaign_creators can't silently leak to creators by default.
      const withRelations = (rows || []).map((row) => ({
        id: row.id,
        campaign_id: row.campaign_id,
        status: row.status,
        planned_date: row.planned_date,
        posted_at: row.posted_at,
        posted_url: row.posted_url,
        payout_amount: row.payout_amount,
        currency: row.currency,
        campaign: campaignSummary,
        brand: brand || null,
      }))

      return NextResponse.json({ campaign_creators: withRelations })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaigns/[id]/creators' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaigns/[id]/creators — add a creator directly to the tracker
// (brand owner only). Prefills nothing itself; the frontend fills
// payout/charge from the roster's typical rates before submitting.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = AddCreatorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id, title')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to manage this campaign' }, { status: 403 })
    }

    const { data: creator } = await supabase
      .from('creators')
      .select('id, user_id, hidden_from_marketplace')
      .eq('id', parsed.data.creator_id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Attaching a creator to a campaign is a new, forward-looking
    // discovery action — a deleted/suspended/admin-hidden creator can't be
    // added going forward, same rule as everywhere else a brand discovers
    // creators. A row already on the tracker from before deletion is a
    // different thing (an existing engagement record) and is untouched by
    // this check — see GET above, which never filters existing rows.
    const { data: ownerUser } = await supabase.from('users').select('deleted_at, is_active').eq('id', creator.user_id).single()
    if (!isCreatorPublic(ownerUser, creator)) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const { data: row, error } = await supabase
      .from('campaign_creators')
      .insert({
        campaign_id: id,
        creator_id: parsed.data.creator_id,
        status: parsed.data.status || 'shortlisted',
        planned_date: parsed.data.planned_date || null,
        payout_amount: parsed.data.payout_amount ?? null,
        charge_amount: parsed.data.charge_amount ?? null,
        currency: parsed.data.currency || 'USD',
        brand_notes: parsed.data.brand_notes || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This creator is already on the tracker for this campaign' }, { status: 409 })
      }
      captureError(error, { route: 'POST /api/campaigns/[id]/creators' })
      return NextResponse.json({ error: 'Failed to add creator' }, { status: 500 })
    }

    const creatorUserId = await getUserIdFromCreator(supabase, parsed.data.creator_id)
    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: row.id,
      creatorId: parsed.data.creator_id,
      brandId: campaign.brand_id,
      actorUserId: request.headers.get('x-user-id') ?? callerProfileId ?? '',
      actorType: 'brand',
      eventType: 'added_to_campaign',
      payload: { campaignTitle: campaign.title },
      systemMessage: `📣 Added to the campaign "${campaign.title}".`,
      notification: { recipientUserId: creatorUserId },
    })

    return NextResponse.json({ message: 'Creator added', campaign_creator: row }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaigns/[id]/creators' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
