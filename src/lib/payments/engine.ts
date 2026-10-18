import type { SupabaseClient } from '@supabase/supabase-js'
import { paymentProvider, type PaymentRecord } from '@/lib/payments/provider'
import type { MarkPaidParams, PayoutMethodType } from '@/lib/payments/provider'
import { recordCampaignCreatorAction, logCampaignCreatorEvent } from '@/lib/campaign-creator-events'
import { emitEvent } from '@/lib/events/emit'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { formatMoney } from '@/components/campaigns/utils'

interface RowContext {
  campaignCreatorId: string
  creatorId: string
  brandId: string
}

// Returned by every brand/creator-initiated transition below, mirroring
// the provider's TransitionResult: `applied` tells the ROUTE whether this
// call was the one that made the change (so it knows whether the HTTP
// response represents a fresh transition or an idempotent no-op from a
// lost race). Side effects (event/message/notification) only ever fire
// when `applied` is true — a losing concurrent call produces none of them,
// which is what keeps "two calls at once" from double-firing anything.
export interface EngineResult {
  record: PaymentRecord
  applied: boolean
}

// Postgres code for a unique-constraint violation.
const UNIQUE_VIOLATION = '23505'

// Called from the contract sign route the moment a contract becomes
// fully_signed. Creates the single 'full' payment record the brand can
// later split. Status starts 'scheduled' — it only becomes 'due' once all
// deliverables are completed (see refreshDuePayments).
//
// Backed by a DB-level guard (idx_creator_payments_one_full, a partial
// unique index on (campaign_creator_id) WHERE type='full' AND status <>
// 'cancelled') so that even if the sign route's own conditional UPDATE
// guard were somehow bypassed, two concurrent inserts can still never both
// succeed — the loser hits a unique violation here and is treated as "the
// payment already exists," not a hard failure.
export async function createInitialPaymentOnSign(
  supabase: SupabaseClient,
  params: RowContext & { contractId: string; amount: number; currency: string; actorUserId: string }
): Promise<EngineResult> {
  try {
    const record = await paymentProvider.createPaymentRecord(supabase, {
      campaignCreatorId: params.campaignCreatorId,
      contractId: params.contractId,
      amount: params.amount,
      currency: params.currency,
      type: 'full',
      status: 'scheduled',
    })

    await logCampaignCreatorEvent(supabase, {
      campaignCreatorId: params.campaignCreatorId,
      actorUserId: params.actorUserId,
      actorType: 'brand',
      eventType: 'payment_created',
      payload: { payment_id: record.id, amount: record.amount, currency: record.currency, type: record.type },
    })

    return { record, applied: true }
  } catch (error) {
    const pgError = error as { code?: string }
    if (pgError.code === UNIQUE_VIOLATION) {
      const { data: existing } = await supabase
        .from('creator_payments')
        .select('*')
        .eq('campaign_creator_id', params.campaignCreatorId)
        .eq('type', 'full')
        .neq('status', 'cancelled')
        .single()
      return { record: existing as PaymentRecord, applied: false }
    }
    throw error
  }
}

// Brand splits the single 'full' record into 'upfront' + 'final'. Atomic
// via the split_payment() Postgres function (SELECT ... FOR UPDATE, same
// row-locking pattern as accept_campaign_offer) — a concurrent second call
// blocks on the lock, then finds the original no longer 'scheduled' and
// raises, which this function catches and reports as applied: false rather
// than creating a second, duplicate split.
export async function splitPayment(
  supabase: SupabaseClient,
  params: RowContext & {
    originalPaymentId: string
    upfrontAmount: number
    finalAmount: number
    paymentTermsDays: number
    actorUserId: string
  }
): Promise<EngineResult & { upfront?: PaymentRecord; final?: PaymentRecord }> {
  const dueDate = new Date(Date.now() + params.paymentTermsDays * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .rpc('split_payment', {
      p_original_payment_id: params.originalPaymentId,
      p_upfront_amount: params.upfrontAmount,
      p_final_amount: params.finalAmount,
      p_due_date: dueDate.toISOString().slice(0, 10),
    })
    .single<{ upfront_id: string; final_id: string }>()

  if (error) {
    // Another request already split this payment (or it was never
    // eligible) — not a hard failure, just nothing new to do.
    const { record: current } = await fetchPaymentOrThrow(supabase, params.originalPaymentId)
    return { record: current, applied: false }
  }

  const { data: upfront } = await supabase.from('creator_payments').select('*').eq('id', data.upfront_id).single()
  const { data: final } = await supabase.from('creator_payments').select('*').eq('id', data.final_id).single()

  const recipientUserId = await getUserIdFromCreator(supabase, params.creatorId)
  await recordCampaignCreatorAction(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    creatorId: params.creatorId,
    brandId: params.brandId,
    actorUserId: params.actorUserId,
    actorType: 'brand',
    eventType: 'payment_split',
    payload: { original_payment_id: params.originalPaymentId, upfront_id: data.upfront_id, final_id: data.final_id },
    systemMessage: `💳 Payment split into an upfront of ${formatMoney(upfront.amount, upfront.currency)} and a final of ${formatMoney(final.amount, final.currency)}.`,
    notification: {
      recipientUserId,
      type: 'payment_due',
      title: 'Payment schedule updated',
      content: `An upfront payment of ${formatMoney(upfront.amount, upfront.currency)} is now due`,
    },
  })

  return { record: upfront as PaymentRecord, applied: true, upfront: upfront as PaymentRecord, final: final as PaymentRecord }
}

async function fetchPaymentOrThrow(supabase: SupabaseClient, paymentId: string): Promise<{ record: PaymentRecord }> {
  const { data, error } = await supabase.from('creator_payments').select('*').eq('id', paymentId).single()
  if (error) {throw error}
  return { record: data as PaymentRecord }
}

// Brand adds a milestone payment tied to specific deliverables. Rejecting
// an empty deliverable_ids list is enforced in the route (so the error
// shows up as a clean 400 before anything is created); this just persists
// and logs.
export async function createMilestonePayment(
  supabase: SupabaseClient,
  params: RowContext & { contractId: string | null; amount: number; currency: string; deliverableIds: string[]; actorUserId: string }
): Promise<PaymentRecord> {
  const record = await paymentProvider.createPaymentRecord(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    contractId: params.contractId,
    amount: params.amount,
    currency: params.currency,
    type: 'milestone',
    status: 'scheduled',
    deliverableIds: params.deliverableIds,
  })

  await logCampaignCreatorEvent(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    actorUserId: params.actorUserId,
    actorType: 'brand',
    eventType: 'payment_created',
    payload: { payment_id: record.id, amount: record.amount, currency: record.currency, type: 'milestone', deliverable_ids: params.deliverableIds },
  })

  return record
}

// Lazy "becomes due" evaluation — no cron, same pattern as offer expiry.
// Called at the top of every payments GET for a row.
//  - 'upfront': due the moment it exists (its trigger, contract signing,
//    already happened).
//  - 'final': due once every deliverable ON THE ROW is 'completed'.
//  - 'milestone': due once every deliverable IN ITS OWN deliverable_ids is
//    'completed' — a milestone tied to deliverables A and B doesn't care
//    whether the row has a C that's still in progress.
// 'kill_fee' is created directly as 'due' and never passes through here.
export async function refreshDuePayments(supabase: SupabaseClient, campaignCreatorId: string): Promise<void> {
  const { data: scheduled } = await supabase
    .from('creator_payments')
    .select('id, type, contract_id, deliverable_ids, amount, currency')
    .eq('campaign_creator_id', campaignCreatorId)
    .eq('status', 'scheduled')

  if (!scheduled || scheduled.length === 0) {return}

  const contractIds = [...new Set(scheduled.map((p) => p.contract_id).filter(Boolean))]
  const { data: contracts } = contractIds.length > 0
    ? await supabase.from('campaign_contracts').select('id, payment_terms_days').in('id', contractIds)
    : { data: [] }
  const termsByContract: Record<string, number> = {}
  for (const c of contracts || []) {termsByContract[c.id] = c.payment_terms_days}

  const upfront = scheduled.filter((p) => p.type === 'upfront')
  const final = scheduled.filter((p) => p.type === 'final')
  const milestones = scheduled.filter((p) => p.type === 'milestone')

  // Payments that actually transitioned on THIS call — a payment already
  // 'due' from a previous call never re-notifies. One notification covers
  // every payment that became due in this pass, not one per payment.
  const newlyDue: { id: string; amount: number; currency: string }[] = []

  for (const p of upfront) {
    const termsDays = (p.contract_id && termsByContract[p.contract_id]) ?? 14
    const dueDate = new Date(Date.now() + termsDays * 24 * 60 * 60 * 1000)
    const { data: updated } = await supabase
      .from('creator_payments')
      .update({ status: 'due', due_date: dueDate.toISOString().slice(0, 10) })
      .eq('id', p.id)
      .eq('status', 'scheduled') // guard against a concurrent change
      .select('id')
    if (updated && updated.length > 0) {newlyDue.push({ id: p.id, amount: p.amount, currency: p.currency })}
  }

  if (final.length > 0) {
    const { data: deliverables } = await supabase
      .from('creator_deliverables')
      .select('status, updated_at')
      .eq('campaign_creator_id', campaignCreatorId)

    const allCompleted = (deliverables || []).length > 0 && (deliverables || []).every((d) => d.status === 'completed')
    if (allCompleted) {
      const latestCompletion = (deliverables || []).reduce(
        (latest, d) => (new Date(d.updated_at) > latest ? new Date(d.updated_at) : latest),
        new Date(0)
      )
      for (const p of final) {
        const termsDays = (p.contract_id && termsByContract[p.contract_id]) ?? 14
        const dueDate = new Date(latestCompletion.getTime() + termsDays * 24 * 60 * 60 * 1000)
        const { data: updated } = await supabase
          .from('creator_payments')
          .update({ status: 'due', due_date: dueDate.toISOString().slice(0, 10) })
          .eq('id', p.id)
          .eq('status', 'scheduled')
          .select('id')
        if (updated && updated.length > 0) {newlyDue.push({ id: p.id, amount: p.amount, currency: p.currency })}
      }
    }
  }

  if (milestones.length > 0) {
    const allDeliverableIds = [...new Set(milestones.flatMap((p) => p.deliverable_ids || []))]
    const { data: linkedDeliverables } = allDeliverableIds.length > 0
      ? await supabase.from('creator_deliverables').select('id, status, updated_at').in('id', allDeliverableIds)
      : { data: [] }

    const deliverableById = new Map((linkedDeliverables || []).map((d) => [d.id, d]))

    for (const p of milestones) {
      const ids = p.deliverable_ids || []
      if (ids.length === 0) {continue} // can't happen (creation rejects it), but never auto-due an unlinked milestone
      const linked = ids.map((id: string) => deliverableById.get(id)).filter(Boolean) as { status: string; updated_at: string }[]
      const allLinkedCompleted = linked.length === ids.length && linked.every((d) => d.status === 'completed')
      if (!allLinkedCompleted) {continue}

      const latestCompletion = linked.reduce(
        (latest, d) => (new Date(d.updated_at) > latest ? new Date(d.updated_at) : latest),
        new Date(0)
      )
      const termsDays = (p.contract_id && termsByContract[p.contract_id]) ?? 14
      const dueDate = new Date(latestCompletion.getTime() + termsDays * 24 * 60 * 60 * 1000)
      const { data: updated } = await supabase
        .from('creator_payments')
        .update({ status: 'due', due_date: dueDate.toISOString().slice(0, 10) })
        .eq('id', p.id)
        .eq('status', 'scheduled')
        .select('id')
      if (updated && updated.length > 0) {newlyDue.push({ id: p.id, amount: p.amount, currency: p.currency })}
    }
  }

  if (newlyDue.length === 0) {return}

  const { data: row } = await supabase
    .from('campaign_creators')
    .select('creator_id, campaign_id')
    .eq('id', campaignCreatorId)
    .single()
  if (!row) {return}
  const { data: campaign } = await supabase.from('campaigns').select('brand_id').eq('id', row.campaign_id).single()
  if (!campaign) {return}

  const brandUserId = await getUserIdFromBrand(supabase, campaign.brand_id)
  const creatorUserId = await getUserIdFromCreator(supabase, row.creator_id)

  // The brand owes the money — they're the one with something to do.
  // Billed under whichever single payment is largest so the system
  // message/notification reads naturally even when several became due in
  // the same pass (rare, but milestones can land together).
  const biggest = newlyDue.reduce((a, b) => (b.amount > a.amount ? b : a))
  await recordCampaignCreatorAction(supabase, {
    campaignCreatorId,
    creatorId: row.creator_id,
    brandId: campaign.brand_id,
    actorUserId: creatorUserId ?? brandUserId ?? '',
    actorType: 'creator',
    eventType: 'payment_due',
    payload: { payment_ids: newlyDue.map((p) => p.id), amount: biggest.amount, currency: biggest.currency },
    systemMessage: `💰 A payment of ${formatMoney(biggest.amount, biggest.currency)} is now due.`,
    notification: { recipientUserId: brandUserId },
  })
}

// brand: due|disputed -> marked_paid
export async function markPaymentPaid(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; method: PayoutMethodType; reference: string; proofPath?: string | null; actorUserId: string }
): Promise<EngineResult> {
  const markPaidParams: MarkPaidParams = {
    paymentId: params.paymentId,
    method: params.method,
    reference: params.reference,
    proofPath: params.proofPath,
  }
  const { record, applied } = await paymentProvider.markPaid(supabase, markPaidParams)
  if (!applied) {return { record, applied }}

  const recipientUserId = await getUserIdFromCreator(supabase, params.creatorId)
  await recordCampaignCreatorAction(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    creatorId: params.creatorId,
    brandId: params.brandId,
    actorUserId: params.actorUserId,
    actorType: 'brand',
    eventType: 'payment_marked_paid',
    payload: { payment_id: record.id, amount: record.amount, currency: record.currency, method: record.method },
    systemMessage: `💸 Marked ${formatMoney(record.amount, record.currency)} as paid via ${record.method}. Please confirm you received it.`,
    notification: {
      recipientUserId,
      type: 'payment_marked_paid',
      title: 'Payment marked as paid',
      content: `${formatMoney(record.amount, record.currency)} was marked paid — please confirm you received it`,
    },
  })

  return { record, applied }
}

// creator: marked_paid -> confirmed
export async function confirmPaymentReceived(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; actorUserId: string }
): Promise<EngineResult> {
  const { record, applied } = await paymentProvider.confirmReceived(supabase, { paymentId: params.paymentId })
  if (!applied) {return { record, applied }}

  const recipientUserId = await getUserIdFromBrand(supabase, params.brandId)
  await recordCampaignCreatorAction(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    creatorId: params.creatorId,
    brandId: params.brandId,
    actorUserId: params.actorUserId,
    actorType: 'creator',
    eventType: 'payment_confirmed',
    payload: { payment_id: record.id, amount: record.amount, currency: record.currency },
    systemMessage: `✅ Confirmed receipt of ${formatMoney(record.amount, record.currency)}.`,
    notification: {
      recipientUserId,
      type: 'payment_confirmed',
      title: 'Payment confirmed',
      content: `The creator confirmed receiving ${formatMoney(record.amount, record.currency)}`,
    },
  })

  return { record, applied }
}

// creator: marked_paid -> disputed
export async function disputePayment(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; reason: string; actorUserId: string }
): Promise<EngineResult> {
  const { record, applied } = await paymentProvider.dispute(supabase, { paymentId: params.paymentId, reason: params.reason })
  if (!applied) {return { record, applied }}

  const recipientUserId = await getUserIdFromBrand(supabase, params.brandId)
  await recordCampaignCreatorAction(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    creatorId: params.creatorId,
    brandId: params.brandId,
    actorUserId: params.actorUserId,
    actorType: 'creator',
    eventType: 'payment_disputed',
    payload: { payment_id: record.id, reason: params.reason },
    systemMessage: `⚠️ Disputed payment of ${formatMoney(record.amount, record.currency)}: ${params.reason}`,
    notification: {
      recipientUserId,
      type: 'payment_disputed',
      title: 'Payment disputed',
      content: `The creator disputed a payment of ${formatMoney(record.amount, record.currency)}: ${params.reason}`,
    },
  })

  return { record, applied }
}

// brand: scheduled|due -> cancelled. Only ever allowed once the row itself
// is dropped (enforced by the caller route, not here).
export async function cancelPayment(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; reason: string; actorUserId: string }
): Promise<EngineResult> {
  const { record, applied } = await paymentProvider.cancel(supabase, { paymentId: params.paymentId, reason: params.reason })
  if (!applied) {return { record, applied }}

  const recipientUserId = await getUserIdFromCreator(supabase, params.creatorId)
  await recordCampaignCreatorAction(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    creatorId: params.creatorId,
    brandId: params.brandId,
    actorUserId: params.actorUserId,
    actorType: 'brand',
    eventType: 'payment_cancelled',
    payload: { payment_id: record.id, reason: params.reason },
    systemMessage: `🚫 Payment of ${formatMoney(record.amount, record.currency)} cancelled: ${params.reason}`,
    notification: {
      recipientUserId,
      type: 'payment_cancelled',
      title: 'Payment cancelled',
      content: `A payment of ${formatMoney(record.amount, record.currency)} was cancelled: ${params.reason}`,
    },
  })

  return { record, applied }
}

// Admin resolves a dispute (POST /api/admin/payments/[id]/resolve-dispute).
// Unlike every brand/creator transition above, this notifies BOTH parties
// via emitEvent directly (actorType: 'admin') rather than
// recordCampaignCreatorAction — an admin decision doesn't need a chat
// system message, just the notification + campaign_creator_events row.
export async function adminResolveDispute(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; resolution: 'marked_paid' | 'confirmed'; resolutionNote: string; actorUserId: string }
): Promise<EngineResult> {
  const { record, applied } = await paymentProvider.adminResolveDispute(supabase, {
    paymentId: params.paymentId,
    resolution: params.resolution,
  })
  if (!applied) {return { record, applied }}

  const [brandUserId, creatorUserId] = await Promise.all([
    getUserIdFromBrand(supabase, params.brandId),
    getUserIdFromCreator(supabase, params.creatorId),
  ])

  await emitEvent(supabase, {
    type: 'payment_dispute_resolved',
    actorUserId: params.actorUserId,
    actorType: 'admin',
    campaignCreatorId: params.campaignCreatorId,
    recipientUserIds: [brandUserId, creatorUserId],
    data: { payment_id: record.id, amount: record.amount, currency: record.currency, resolution: params.resolution, resolutionNote: params.resolutionNote },
  })

  return { record, applied }
}

// Admin override cancel (POST /api/admin/payments/[id]/cancel). Same
// both-parties emitEvent pattern as adminResolveDispute above.
export async function adminCancelPayment(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; reason: string; actorUserId: string }
): Promise<EngineResult> {
  const { record, applied } = await paymentProvider.adminCancel(supabase, {
    paymentId: params.paymentId,
    reason: params.reason,
  })
  if (!applied) {return { record, applied }}

  const [brandUserId, creatorUserId] = await Promise.all([
    getUserIdFromBrand(supabase, params.brandId),
    getUserIdFromCreator(supabase, params.creatorId),
  ])

  await emitEvent(supabase, {
    type: 'payment_admin_cancelled',
    actorUserId: params.actorUserId,
    actorType: 'admin',
    campaignCreatorId: params.campaignCreatorId,
    recipientUserIds: [brandUserId, creatorUserId],
    data: { payment_id: record.id, amount: record.amount, currency: record.currency, reason: params.reason },
  })

  return { record, applied }
}

// Called from the campaign_creators PUT route the moment a brand sets a
// row's status to 'dropped'. Creates a 'kill_fee' record (already 'due' —
// there's no scheduling phase for a cancellation fee) only when the
// contract was fully signed AND at least one deliverable had already moved
// past 'pending' (a draft was submitted) — per spec, no kill fee applies to
// a clean drop before any work started.
export async function createKillFeeIfEligible(
  supabase: SupabaseClient,
  params: RowContext & { actorUserId: string; payoutAmount: number | null; currency: string }
): Promise<PaymentRecord | null> {
  const { data: contract } = await supabase
    .from('campaign_contracts')
    .select('id, kill_fee_percent, payment_terms_days, status')
    .eq('campaign_creator_id', params.campaignCreatorId)
    .eq('status', 'fully_signed')
    .maybeSingle()

  if (!contract || !params.payoutAmount) {return null}

  const { data: deliverables } = await supabase
    .from('creator_deliverables')
    .select('status')
    .eq('campaign_creator_id', params.campaignCreatorId)

  const draftWasSubmitted = (deliverables || []).some((d) =>
    ['draft_submitted', 'changes_requested', 'approved', 'posted', 'completed'].includes(d.status)
  )
  if (!draftWasSubmitted) {return null}

  const killFeeAmount = Math.round(params.payoutAmount * (contract.kill_fee_percent / 100) * 100) / 100
  if (killFeeAmount <= 0) {return null}

  const dueDate = new Date(Date.now() + contract.payment_terms_days * 24 * 60 * 60 * 1000)

  // DB-level backstop (idx_creator_payments_one_kill_fee) against billing
  // the same drop twice — the route's own existingRow.status !== 'dropped'
  // guard is the first line of defense, this is the second: if a kill fee
  // already exists for this row (a retry, a race, or a future caller that
  // forgets the status guard), the insert hits a unique violation and this
  // is treated as "already created," not a hard failure or a duplicate.
  let record: PaymentRecord
  try {
    record = await paymentProvider.createPaymentRecord(supabase, {
      campaignCreatorId: params.campaignCreatorId,
      contractId: contract.id,
      amount: killFeeAmount,
      currency: params.currency,
      type: 'kill_fee',
      status: 'due',
      dueDate: dueDate.toISOString().slice(0, 10),
    })
  } catch (error) {
    const pgError = error as { code?: string }
    if (pgError.code === UNIQUE_VIOLATION) {return null}
    throw error
  }

  const recipientUserId = await getUserIdFromCreator(supabase, params.creatorId)
  await recordCampaignCreatorAction(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    creatorId: params.creatorId,
    brandId: params.brandId,
    actorUserId: params.actorUserId,
    actorType: 'brand',
    eventType: 'kill_fee_created',
    payload: { payment_id: record.id, amount: record.amount, currency: record.currency, percent: contract.kill_fee_percent },
    systemMessage: `⚠️ This engagement was dropped after a draft was submitted. A kill fee of ${formatMoney(record.amount, record.currency)} (${contract.kill_fee_percent}%) is due.`,
    notification: {
      recipientUserId,
      type: 'payment_due',
      title: 'Kill fee due',
      content: `A kill fee of ${formatMoney(record.amount, record.currency)} is due`,
    },
  })

  return record
}
