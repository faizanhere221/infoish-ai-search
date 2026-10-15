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

export interface CreatePaymentRecordParams {
  campaignCreatorId: string
  contractId: string | null
  amount: number
  currency: string
  type: PaymentType
  status: PaymentStatus
  dueDate?: string | null
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

// The seam between "how a payment record's state changes" and "how money
// actually moved." Every route goes through this interface, never touching
// `creator_payments` directly, so a future 'stripe' implementation can slot
// in without any route or UI change — only this file (and the engine that
// calls it) would need to change. See docs/PAYMENTS.md.
export interface PaymentProvider {
  createPaymentRecord(supabase: SupabaseClient, params: CreatePaymentRecordParams): Promise<PaymentRecord>
  markPaid(supabase: SupabaseClient, params: MarkPaidParams): Promise<PaymentRecord>
  confirmReceived(supabase: SupabaseClient, params: ConfirmReceivedParams): Promise<PaymentRecord>
  dispute(supabase: SupabaseClient, params: DisputeParams): Promise<PaymentRecord>
  cancel(supabase: SupabaseClient, params: CancelParams): Promise<PaymentRecord>
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
      })
      .select()
      .single()

    if (error) {throw error}
    return data as PaymentRecord
  }

  async markPaid(supabase: SupabaseClient, params: MarkPaidParams): Promise<PaymentRecord> {
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
      .select()
      .single()

    if (error) {throw error}
    return data as PaymentRecord
  }

  async confirmReceived(supabase: SupabaseClient, params: ConfirmReceivedParams): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from('creator_payments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', params.paymentId)
      .select()
      .single()

    if (error) {throw error}
    return data as PaymentRecord
  }

  async dispute(supabase: SupabaseClient, params: DisputeParams): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from('creator_payments')
      .update({ status: 'disputed', dispute_reason: params.reason })
      .eq('id', params.paymentId)
      .select()
      .single()

    if (error) {throw error}
    return data as PaymentRecord
  }

  async cancel(supabase: SupabaseClient, params: CancelParams): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from('creator_payments')
      .update({ status: 'cancelled', cancelled_reason: params.reason })
      .eq('id', params.paymentId)
      .select()
      .single()

    if (error) {throw error}
    return data as PaymentRecord
  }
}

export const paymentProvider: PaymentProvider = new ManualPaymentProvider()
