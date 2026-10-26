import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow } from '@/lib/campaign-creator-auth'
import { logCampaignCreatorEvent } from '@/lib/campaign-creator-events'
import { buildRenderedBody } from '@/lib/contracts/render'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string }
}

const CreateContractSchema = z.object({
  special_terms: z.string().max(4000).optional().nullable(),
  payment_terms_days: z.number().int().min(1).max(365).optional(),
  kill_fee_percent: z.number().min(0).max(100).optional(),
})

// Explicit field list — a contract never carries charge_amount, brand_notes,
// or client_name, so there's nothing to strip for the creator, but this
// keeps the shape predictable for both parties either way.
function toPublicContract(row: Record<string, unknown>) {
  return {
    id: row.id,
    campaign_creator_id: row.campaign_creator_id,
    offer_id: row.offer_id,
    version: row.version,
    status: row.status,
    special_terms: row.special_terms,
    payment_terms_days: row.payment_terms_days,
    kill_fee_percent: row.kill_fee_percent,
    body_snapshot: row.body_snapshot,
    body_hash: row.body_hash,
    brand_signer_name: row.brand_signer_name,
    brand_signed_at: row.brand_signed_at,
    creator_signer_name: row.creator_signer_name,
    creator_signed_at: row.creator_signed_at,
    voided_reason: row.voided_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
    sent_at: row.sent_at,
  }
}

// GET /api/campaign-creators/[id]/contracts — either party. Returns the
// current (non-void) contract if any, plus prior voided versions for
// history. For a 'draft' contract, body_preview is rendered live from
// current data so the brand can see what sending will produce — the real
// body_snapshot is only written (and frozen) at send time.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: contracts, error } = await supabase
      .from('campaign_contracts')
      .select('*')
      .eq('campaign_creator_id', id)
      .order('version', { ascending: false })

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators/[id]/contracts' })
      return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
    }

    const current = (contracts || []).find((c) => c.status !== 'void') || null
    const history = (contracts || []).filter((c) => c.status === 'void')

    let bodyPreview: string | null = null
    if (current && current.status === 'draft') {
      bodyPreview = await buildRenderedBody(supabase, id, current)
    }

    return NextResponse.json({
      contract: current ? { ...toPublicContract(current), body_preview: bodyPreview } : null,
      history: history.map(toPublicContract),
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/[id]/contracts' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaign-creators/[id]/contracts — brand owner only. Creates a
// new draft, pre-filled with the campaign's default payment terms / kill
// fee. Only one non-void contract can exist per row at a time (DB partial
// unique index) — a brand must void or wait for the current one to resolve
// before starting another.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json().catch(() => ({}))
    const parsed = CreateContractSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can create a contract' }, { status: 403 })
    }

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('default_payment_terms_days, default_kill_fee_percent')
      .eq('id', authorized.row.campaign_id)
      .single()

    const { data: latestOffer } = await supabase
      .from('campaign_offers')
      .select('id')
      .eq('campaign_creator_id', id)
      .eq('status', 'accepted')
      .order('responded_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: existingVersions } = await supabase
      .from('campaign_contracts')
      .select('version')
      .eq('campaign_creator_id', id)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = existingVersions && existingVersions.length > 0 ? existingVersions[0].version + 1 : 1

    const { data: created, error } = await supabase
      .from('campaign_contracts')
      .insert({
        campaign_creator_id: id,
        offer_id: latestOffer?.id ?? null,
        version: nextVersion,
        status: 'draft',
        special_terms: parsed.data.special_terms || null,
        payment_terms_days: parsed.data.payment_terms_days ?? campaign?.default_payment_terms_days ?? 14,
        kill_fee_percent: parsed.data.kill_fee_percent ?? campaign?.default_kill_fee_percent ?? 50,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A contract already exists for this row' }, { status: 409 })
      }
      captureError(error, { route: 'POST /api/campaign-creators/[id]/contracts' })
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
    }

    await logCampaignCreatorEvent(supabase, {
      campaignCreatorId: id,
      actorUserId: callerUserId,
      actorType: 'brand',
      eventType: 'contract_drafted',
      payload: { contract_id: created.id, version: created.version },
    })

    const bodyPreview = await buildRenderedBody(supabase, id, created)

    return NextResponse.json(
      { message: 'Contract drafted', contract: { ...toPublicContract(created), body_preview: bodyPreview } },
      { status: 201 }
    )
  } catch (error) {
    captureError(error, { route: 'POST /api/campaign-creators/[id]/contracts' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
