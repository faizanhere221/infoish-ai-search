// ============================================================================
// REFERRAL PARTNER SYSTEM - CLIENT-SIDE TRACKING (Phase 2)
// ============================================================================
// Cookie/localStorage helpers for persisting a visitor's referral code
// across the landing-page-to-signup journey. Client-only (reads/writes
// `document`/`localStorage`) — never import this from a server component.

import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_DAYS } from './referral'

/** Set referral code in cookie and localStorage. */
export function setReferralCode(code: string): void {
  const expires = new Date()
  expires.setDate(expires.getDate() + REFERRAL_COOKIE_DAYS)
  document.cookie = `${REFERRAL_COOKIE_NAME}=${code};expires=${expires.toUTCString()};path=/`

  // Backup in localStorage in case cookies are blocked/cleared
  localStorage.setItem(REFERRAL_COOKIE_NAME, code)
}

/** Get referral code from cookie, falling back to localStorage. */
export function getReferralCode(): string | null {
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === REFERRAL_COOKIE_NAME) {
      return value
    }
  }
  return localStorage.getItem(REFERRAL_COOKIE_NAME)
}

/** Clear referral code after successful tracking, to prevent double-tracking. */
export function clearReferralCode(): void {
  document.cookie = `${REFERRAL_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  localStorage.removeItem(REFERRAL_COOKIE_NAME)
}
