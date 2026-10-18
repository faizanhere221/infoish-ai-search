import type { SupabaseClient } from '@supabase/supabase-js'

export type PaymentType = 'full' | 'upfront' | 'milestone' | 'final' | 'kill_fee'
export type PaymentStatus = 'scheduled' | 'due' | 'marked_paid' | 'confirmed' | 'disputed' | 'cancelled'
export type PayoutMethodType = 'wise' | 'payoneer' | 'bank_transfer' | 'paypal' | 'other'

export interface PaymentRecord {
  id: string
  campaign_creator_id: string
  contract_id: string | null
  amount: number
  currency: string
  type: PaymentType
  status: PaymentStatus
  due_date: string | null
  deliverable_ids: string[] | null
  method: PayoutMethodType | null
  reference: string | null
  proof_path: string | null
  marked_paid_at: string | null
  confirmed_at: string | null
  dispute_reason: string | null
  cancelled_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Returned by every state-transition method: `applied` tells the caller
// whether THIS call was the one that made the change, or whether it lost a
// race to a concurrent call that got there first (or the record had
// already moved on for an unrelated reason). `record` is always the
// current, correct row either way — callers use `applied` to decide
// whether to run side effects (event log, system message, notification),
// never to decide whether to report success, since the end state is
// correct regardless of who got there first.
export interface TransitionResult {
  record: PaymentRecord
  applied: boolean
}

export interface CreatePaymentRecordParams {
  campaignCreatorId: string
  contractId: string | null
  amount: number
  currency: string
  type: PaymentType
  status: PaymentStatus
  dueDate?: string | null
  deliverableIds?: string[] | null
}

export interface MarkPaidParams {
  paymentId: string
  method: PayoutMethodType
  reference: string
  proofPath?: string | null
}

export interface ConfirmReceivedParams {
  paymentId: string
}

export interface DisputeParams {
  paymentId: string
  reason: string
}

export interface CancelParams {
  paymentId: string
  reason: string
}

export interface AdminResolveDisputeParams {
  paymentId: string
  resolution: 'marked_paid' | 'confirmed'
}

export interface AdminCancelParams {
  paymentId: string
  reason: string
}

// The seam between "how a payment record's state changes" and "how money
// actually moved." Every route goes through this interface, never touching
// `creator_payments` directly, so a future 'stripe' implementation can slot
// in without any route or UI change — only this file (and the engine that
// calls it) would need to change. See docs/PAYMENTS.md.
//
// Every transition method is a single conditional UPDATE — `WHERE id = ...
// AND status IN (<valid "from" statuses>)` — not a read-then-write. Under
// concurrent calls, Postgres only lets one UPDATE actually match and change
// the row; the loser's UPDATE matches zero rows, which this provider
// reports as `applied: false` rather than throwing, so the caller can
// treat it as "someone already did this" instead of a real error.
export interface PaymentProvider {
  createPaymentRecord(supabase: SupabaseClient, params: CreatePaymentRecordParams): Promise<PaymentRecord>
  markPaid(supabase: SupabaseClient, params: MarkPaidParams): Promise<TransitionResult>
  confirmReceived(supabase: SupabaseClient, params: ConfirmReceivedParams): Promise<TransitionResult>
  dispute(supabase: SupabaseClient, params: DisputeParams): Promise<TransitionResult>
  cancel(supabase: SupabaseClient, params: CancelParams): Promise<TransitionResult>
  // Admin-only overrides (src/app/api/admin/payments/[id]/*) — same
  // conditional-UPDATE race safety as every transition above, just a
  // different "from" status set reachable only by an admin action.
  adminResolveDispute(supabase: SupabaseClient, params: AdminResolveDisputeParams): Promise<TransitionResult>
  adminCancel(supabase: SupabaseClient, params: AdminCancelParams): Promise<TransitionResult>
}

async function fetchCurrent(supabase: SupabaseClient, paymentId: string): Promise<PaymentRecord> {
  const { data, error } = await supabase.from('creator_payments').select('*').eq('id', paymentId).single()
  if (error) {throw error}
  return data as PaymentRecord
}

// Manual provider: money moves outside Infoishai (Wise, Payoneer, bank
// transfer, PayPal, other). Every method here is a plain state change on
// `creator_payments` — no external API call, no money movement, nothing
// held. The brand and creator attest to what happened; this is a shared
// record of that, not a payment processor.
class ManualPaymentProvider implements PaymentProvider {
  async createPaymentRecord(supabase: SupabaseClient, params: CreatePaymentRecordParams): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from('creator_payments')
      .insert({
        campaign_creator_id: params.campaignCreatorId,
        contract_id: params.contractId,
        amount: params.amount,
        currency: params.currency,
        type: params.type,
        status: params.status,
        due_date: params.dueDate ?? null,
        deliverable_ids: params.deliverableIds ?? null,
      })
      .select()
      .single()

    if (error) {throw error}
    return data as PaymentRecord
  }

  async markPaid(supabase: SupabaseClient, params: MarkPaidParams): Promise<TransitionResult> {
    const { data, error } = await supabase
      .from('creator_payments')
      .update({
        status: 'marked_paid',
        method: params.method,
        reference: params.reference,
        proof_path: params.proofPath ?? null,
        marked_paid_at: new Date().toISOString(),
      })
      .eq('id', params.paymentId)
      .in('status', ['due', 'disputed'])
      .select()
      .maybeSingle()

    if (error) {throw error}
    if (data) {return { record: data as PaymentRecord, applied: true }}
    return { record: await fetchCurrent(supabase, params.paymentId), applied: false }
  }

  async confirmReceived(supabase: SupabaseClient, params: ConfirmReceivedParams): Promise<TransitionResult> {
    const { data, error } = await supabase
      .from('creator_payments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', params.paymentId)
      .eq('status', 'marked_paid')
      .select()
      .maybeSingle()

    if (error) {throw error}
    if (data) {return { record: data as PaymentRecord, applied: true }}
    return { record: await fetchCurrent(supabase, params.paymentId), applied: false }
  }

  async dispute(supabase: SupabaseClient, params: DisputeParams): Promise<TransitionResult> {
    const { data, error } = await supabase
      .from('creator_payments')
      .update({ status: 'disputed', dispute_reason: params.reason })
      .eq('id', params.paymentId)
      .eq('status', 'marked_paid')
      .select()
      .maybeSingle()

    if (error) {throw error}
    if (data) {return { record: data as PaymentRecord, applied: true }}
    return { record: await fetchCurrent(supabase, params.paymentId), applied: false }
  }

  async cancel(supabase: SupabaseClient, params: CancelParams): Promise<TransitionResult> {
    const { data, error } = await supabase
      .from('creator_payments')
      .update({ status: 'cancelled', cancelled_reason: params.reason })
      .eq('id', params.paymentId)
      .in('status', ['scheduled', 'due'])
      .select()
      .maybeSingle()

    if (error) {throw error}
    if (data) {return { record: data as PaymentRecord, applied: true }}
    return { record: await fetchCurrent(supabase, params.paymentId), applied: false }
  }

  // Admin resolves a dispute by deciding which way it actually went: the
  // brand's claim was right (back to marked_paid, so the creator confirms
  // again) or the creator's claim was right (straight to confirmed). Only
  // ever moves a payment that's actually 'disputed'.
  async adminResolveDispute(supabase: SupabaseClient, params: AdminResolveDisputeParams): Promise<TransitionResult> {
    const update: Record<string, unknown> = { status: params.resolution, dispute_reason: null }
    if (params.resolution === 'confirmed') {update.confirmed_at = new Date().toISOString()}
    if (params.resolution === 'marked_paid') {update.marked_paid_at = new Date().toISOString()}

    const { data, error } = await supabase
      .from('creator_payments')
      .update(update)
      .eq('id', params.paymentId)
      .eq('status', 'disputed')
      .select()
      .maybeSingle()

    if (error) {throw error}
    if (data) {return { record: data as PaymentRecord, applied: true }}
    return { record: await fetchCurrent(supabase, params.paymentId), applied: false }
  }

  // Admin override cancel — broader "from" set than the brand's own
  // cancel() above (which only applies pre-payment), since an admin may
  // need to cancel a payment that's already marked_paid or disputed as
  // part of resolving an escalation. Never cancels an already-confirmed
  // or already-cancelled payment — those are terminal.
  async adminCancel(supabase: SupabaseClient, params: AdminCancelParams): Promise<TransitionResult> {
    const { data, error } = await supabase
      .from('creator_payments')
      .update({ status: 'cancelled', cancelled_reason: params.reason })
      .eq('id', params.paymentId)
      .in('status', ['scheduled', 'due', 'marked_paid', 'disputed'])
      .select()
      .maybeSingle()

    if (error) {throw error}
    if (data) {return { record: data as PaymentRecord, applied: true }}
    return { record: await fetchCurrent(supabase, params.paymentId), applied: false }
  }
}

export const paymentProvider: PaymentProvider = new ManualPaymentProvider()
