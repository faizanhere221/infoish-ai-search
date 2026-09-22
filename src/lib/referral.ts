// ============================================================================
// REFERRAL PARTNER SYSTEM - UTILITIES (Phase 1: Foundation, Phase 2: Tracking)
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

export const REFERRAL_COOKIE_NAME = 'infoishai_ref'
export const REFERRAL_COOKIE_DAYS = 30

const REFERRAL_CODE_PATTERN = /^[a-z0-9-]{5,30}$/

/** 5-30 chars, lowercase alphanumeric + hyphens only. */
export function isValidReferralCode(code: string): boolean {
  return REFERRAL_CODE_PATTERN.test(code)
}

/** Builds a URL-safe referral code from a partner's name plus a short random suffix to avoid collisions. */
export function generateReferralCode(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20)

  const suffix = Math.random().toString(36).slice(2, 6)
  const code = `${slug || 'partner'}-${suffix}`

  return code.slice(0, 30)
}

/** Formats a smallest-currency-unit integer (cents) as a "$X.XX" string. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Links a referral_signups row to the creator profile once it's created, and
 * advances its status past the initial 'signed_up' state. Best-effort: a
 * missing signup (the user wasn't referred) is not an error, it's the common
 * case, so this resolves silently rather than throwing. Callers should treat
 * this as non-fatal to profile creation.
 */
export async function updateReferralOnProfileComplete(
  supabase: SupabaseClient,
  userId: string,
  creatorId: string
): Promise<void> {
  const { data: signup } = await supabase
    .from('referral_signups')
    .select('id')
    .eq('referred_user_id', userId)
    .is('referred_creator_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!signup) {return}

  await supabase
    .from('referral_signups')
    .update({ referred_creator_id: creatorId, status: 'profile_complete' })
    .eq('id', signup.id)
}
