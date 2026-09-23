// ============================================================================
// REFERRAL PARTNER SYSTEM - COMMISSION CALCULATION (Phase 5)
// ============================================================================
// Wired into deal completion (src/app/api/deals/[id]/approve/route.ts): when
// a referred creator's deal completes, this creates a pending commission for
// their referring partner. Every failure mode here is silent/non-throwing on
// purpose — most creators were never referred, and commission calculation
// must never block a deal from completing.

import type { SupabaseClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'
import { formatCents } from '@/lib/referral'

interface CalculateCommissionParams {
  dealId: string
  creatorId: string
  dealAmountCents: number
}

interface CommissionResult {
  created: boolean
  commissionId?: string
  partnerId?: string
  commissionAmountCents?: number
  error?: string
}

// Infoishai's cut of the deal amount. Partner commission is a percentage of
// THIS, not of the full deal amount — a partner's "20% commission rate"
// means 20% of what the platform actually earns, not 20% of the deal.
const PLATFORM_FEE_RATE = 0.05 // 5% platform fee

const STATUS_RANK: Record<string, number> = {
  signed_up: 0,
  profile_complete: 1,
  first_deal: 2,
  active: 3,
}

/**
 * Advances a referral_signups row's status, refusing to move it backwards.
 * signed_up -> profile_complete -> first_deal -> active
 */
export async function updateReferralSignupStatus(
  supabase: SupabaseClient,
  signupId: string,
  newStatus: 'first_deal' | 'active'
): Promise<void> {
  const { data: signup } = await supabase
    .from('referral_signups')
    .select('status')
    .eq('id', signupId)
    .single()

  if (!signup) {return}

  const currentRank = STATUS_RANK[signup.status] ?? 0
  const newRank = STATUS_RANK[newStatus]
  if (newRank <= currentRank) {return}

  await supabase.from('referral_signups').update({ status: newStatus }).eq('id', signupId)
}

/**
 * Creates a pending commission for a completed deal, if (and only if) the
 * creator on that deal was referred by an active partner and this deal
 * hasn't already been paid a commission. Never throws — every "no
 * commission" case (not referred, partner paused, duplicate, free deal) is
 * a normal outcome, not an error, and is reported as `{ created: false }`.
 * Only unexpected DB failures populate `error`.
 */
export async function calculateReferralCommission(
  supabase: SupabaseClient,
  params: CalculateCommissionParams
): Promise<CommissionResult> {
  const { dealId, creatorId, dealAmountCents } = params

  try {
    // Edge case: free deal, nothing to take a commission from.
    if (!dealAmountCents || dealAmountCents <= 0) {
      return { created: false }
    }

    // 1-2. Was this creator referred? Most creators weren't — that's fine.
    const { data: signup } = await supabase
      .from('referral_signups')
      .select('id, partner_id, status')
      .eq('referred_creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!signup) {
      return { created: false }
    }

    // 3-4. Partner must exist and be active (paused/deactivated partners don't earn).
    const { data: partner } = await supabase
      .from('referral_partners')
      .select('id, user_id, commission_rate, status')
      .eq('id', signup.partner_id)
      .single()

    if (!partner || partner.status !== 'active') {
      return { created: false }
    }

    // 5. Duplicate guard: one commission per deal, ever.
    const { data: existingCommission } = await supabase
      .from('referral_commissions')
      .select('id')
      .eq('deal_id', dealId)
      .single()

    if (existingCommission) {
      return { created: false }
    }

    // 6. Calculate commission — as a percentage of the platform fee, not of
    // the full deal amount (a partner's rate applies to Infoishai's cut).
    const commissionRate = Number(partner.commission_rate)
    const platformFeeCents = Math.round(dealAmountCents * PLATFORM_FEE_RATE)
    const commissionAmountCents = Math.round(platformFeeCents * (commissionRate / 100))

    // 7. Create the commission record.
    const { data: commission, error: commissionError } = await supabase
      .from('referral_commissions')
      .insert({
        partner_id: partner.id,
        referral_signup_id: signup.id,
        deal_id: dealId,
        deal_amount_cents: dealAmountCents,
        platform_fee_cents: platformFeeCents,
        commission_rate: commissionRate,
        commission_amount_cents: commissionAmountCents,
        status: 'pending',
      })
      .select()
      .single()

    if (commissionError || !commission) {
      console.error('Error creating referral commission:', commissionError)
      return { created: false, error: commissionError?.message ?? 'Failed to create commission' }
    }

    // 8. Advance the signup's status. A second (or later) completed deal
    // means they're an established earner, not a first-timer anymore.
    const targetStatus = signup.status === 'first_deal' || signup.status === 'active' ? 'active' : 'first_deal'
    await updateReferralSignupStatus(supabase, signup.id, targetStatus)

    // Notify the partner (best-effort — never fails commission creation)
    if (partner.user_id) {
      let creatorName = 'a referred creator'
      const { data: creator } = await supabase.from('creators').select('display_name').eq('id', creatorId).single()
      if (creator?.display_name) {creatorName = creator.display_name}

      await createNotification(supabase, {
        userId: partner.user_id,
        type: 'referral_commission_earned',
        title: 'You earned a commission!',
        message: `You earned ${formatCents(commissionAmountCents)} commission from ${creatorName}'s deal.`,
        link: '/dashboard/partner',
      })
    }

    // 9. Done.
    return {
      created: true,
      commissionId: commission.id,
      partnerId: partner.id,
      commissionAmountCents,
    }
  } catch (error) {
    console.error('calculateReferralCommission unexpected error:', error)
    return { created: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
