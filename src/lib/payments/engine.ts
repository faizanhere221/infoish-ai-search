import type { SupabaseClient } from '@supabase/supabase-js'
import { paymentProvider, type PaymentRecord, type PayoutMethodType } from '@/lib/payments/provider'
import { recordCampaignCreatorAction, logCampaignCreatorEvent } from '@/lib/campaign-creator-events'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { formatMoney } from '@/components/campaigns/utils'

interface RowContext {
  campaignCreatorId: string
  creatorId: string
  brandId: string
}

// Called from the contract sign route the moment a contract becomes
// fully_signed. Creates the single 'full' payment record the brand can
// later split. Status starts 'scheduled' — it only becomes 'due' once all
// deliverables are completed (see refreshDuePayments).
export async function createInitialPaymentOnSign(
  supabase: SupabaseClient,
  params: RowContext & { contractId: string; amount: number; currency: string; actorUserId: string }
): Promise<PaymentRecord> {
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

  return record
}

// Brand splits the single 'full' record into 'upfront' + 'final'. Only
// while the original is still 'scheduled' (not due/paid yet). The upfront
// portion's trigger (contract signing) has already happened by definition,
// so it starts 'due' immediately rather than waiting for the next lazy
// refresh; the final portion stays 'scheduled' until deliverables complete.
export async function splitPayment(
  supabase: SupabaseClient,
  params: RowContext & {
    originalPaymentId: string
    contractId: string | null
    upfrontAmount: number
    finalAmount: number
    currency: string
    paymentTermsDays: number
    actorUserId: string
  }
): Promise<{ upfront: PaymentRecord; final: PaymentRecord }> {
  const now = new Date()
  const dueDate = new Date(now.getTime() + params.paymentTermsDays * 24 * 60 * 60 * 1000)

  await supabase
    .from('creator_payments')
    .update({ status: 'cancelled', cancelled_reason: 'Split into upfront + final' })
    .eq('id', params.originalPaymentId)

  const upfront = await paymentProvider.createPaymentRecord(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    contractId: params.contractId,
    amount: params.upfrontAmount,
    currency: params.currency,
    type: 'upfront',
    status: 'due',
    dueDate: dueDate.toISOString().slice(0, 10),
  })

  const final = await paymentProvider.createPaymentRecord(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    contractId: params.contractId,
    amount: params.finalAmount,
    currency: params.currency,
    type: 'final',
    status: 'scheduled',
  })

  const recipientUserId = await getUserIdFromCreator(supabase, params.creatorId)
  await recordCampaignCreatorAction(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    creatorId: params.creatorId,
    brandId: params.brandId,
    actorUserId: params.actorUserId,
    actorType: 'brand',
    eventType: 'payment_split',
    payload: { original_payment_id: params.originalPaymentId, upfront_id: upfront.id, final_id: final.id },
    systemMessage: `💳 Payment split into an upfront of ${formatMoney(upfront.amount, upfront.currency)} and a final of ${formatMoney(final.amount, final.currency)}.`,
    notification: {
      recipientUserId,
      type: 'payment_due',
      title: 'Payment schedule updated',
      content: `An upfront payment of ${formatMoney(upfront.amount, upfront.currency)} is now due`,
    },
  })

  return { upfront, final }
}

// Lazy "becomes due" evaluation — no cron, same pattern as offer expiry.
// Called at the top of every payments GET for a row. 'upfront' is due the
// moment it exists (its trigger, contract signing, already happened);
// 'full'/'final'/'milestone' become due once every deliverable on the row
// is 'completed'. 'kill_fee' is created directly as 'due' and never passes
// through here.
export async function refreshDuePayments(supabase: SupabaseClient, campaignCreatorId: string): Promise<void> {
  const { data: scheduled } = await supabase
    .from('creator_payments')
    .select('id, type, contract_id')
    .eq('campaign_creator_id', campaignCreatorId)
    .eq('status', 'scheduled')

  if (!scheduled || scheduled.length === 0) {return}

  const contractIds = [...new Set(scheduled.map((p) => p.contract_id).filter(Boolean))]
  const { data: contracts } = contractIds.length > 0
    ? await supabase.from('campaign_contracts').select('id, payment_terms_days').in('id', contractIds)
    : { data: [] }
  const termsByContract: Record<string, number> = {}
  for (const c of contracts || []) {termsByContract[c.id] = c.payment_terms_days}

  const upfrontIds = scheduled.filter((p) => p.type === 'upfront').map((p) => p.id)
  const otherIds = scheduled.filter((p) => p.type !== 'upfront').map((p) => p.id)

  const now = new Date()

  if (upfrontIds.length > 0) {
    for (const p of scheduled.filter((s) => upfrontIds.includes(s.id))) {
      const termsDays = (p.contract_id && termsByContract[p.contract_id]) ?? 14
      const dueDate = new Date(now.getTime() + termsDays * 24 * 60 * 60 * 1000)
      await supabase
        .from('creator_payments')
        .update({ status: 'due', due_date: dueDate.toISOString().slice(0, 10) })
        .eq('id', p.id)
        .eq('status', 'scheduled') // guard against a concurrent change
    }
  }

  if (otherIds.length > 0) {
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
      for (const p of scheduled.filter((s) => otherIds.includes(s.id))) {
        const termsDays = (p.contract_id && termsByContract[p.contract_id]) ?? 14
        const dueDate = new Date(latestCompletion.getTime() + termsDays * 24 * 60 * 60 * 1000)
        await supabase
          .from('creator_payments')
          .update({ status: 'due', due_date: dueDate.toISOString().slice(0, 10) })
          .eq('id', p.id)
          .eq('status', 'scheduled')
      }
    }
  }
}

// brand: due|disputed -> marked_paid
export async function markPaymentPaid(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; method: PayoutMethodType; reference: string; proofPath?: string | null; actorUserId: string }
): Promise<PaymentRecord> {
  const record = await paymentProvider.markPaid(supabase, {
    paymentId: params.paymentId,
    method: params.method,
    reference: params.reference,
    proofPath: params.proofPath,
  })

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

  return record
}

// creator: marked_paid -> confirmed
export async function confirmPaymentReceived(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; actorUserId: string }
): Promise<PaymentRecord> {
  const record = await paymentProvider.confirmReceived(supabase, { paymentId: params.paymentId })

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

  return record
}

// creator: marked_paid -> disputed
export async function disputePayment(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; reason: string; actorUserId: string }
): Promise<PaymentRecord> {
  const record = await paymentProvider.dispute(supabase, { paymentId: params.paymentId, reason: params.reason })

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

  return record
}

// brand: scheduled|due -> cancelled. Only ever allowed once the row itself
// is dropped (enforced by the caller route, not here).
export async function cancelPayment(
  supabase: SupabaseClient,
  params: RowContext & { paymentId: string; reason: string; actorUserId: string }
): Promise<PaymentRecord> {
  const record = await paymentProvider.cancel(supabase, { paymentId: params.paymentId, reason: params.reason })

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

  return record
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

  const record = await paymentProvider.createPaymentRecord(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    contractId: contract.id,
    amount: killFeeAmount,
    currency: params.currency,
    type: 'kill_fee',
    status: 'due',
    dueDate: dueDate.toISOString().slice(0, 10),
  })

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
