// Parsing/validation for creator platform and service input, shared by the
// API routes (source of truth) and the settings page / onboarding wizard
// (so the creator sees the same error before saving). Pure functions only,
// safe to import on the client.

const MAX_FOLLOWERS = 1_000_000_000
const MAX_PRICE = 1_000_000

const SUFFIX_MULTIPLIER: Record<string, number> = { k: 1_000, m: 1_000_000, b: 1_000_000_000 }

/**
 * Follower counts as creators actually type them: 5076, "5076", "5,076",
 * "5 076", "5k", "5.2K", "1.2m". Returns a whole number, or null if the input
 * isn't a count at all. Empty input means 0 (the field is optional).
 */
export function parseFollowerCount(input: unknown): number | null {
  if (input === null || input === undefined) {return 0}
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 && input <= MAX_FOLLOWERS ? Math.round(input) : null
  }
  if (typeof input !== 'string') {return null}

  const spaced = input.trim().toLowerCase().replace(/[\s_]/g, '')
  if (spaced === '') {return 0}
  // Commas must group thousands ("5,076"), so a typo like "1,2,3" is
  // rejected instead of quietly becoming 123.
  if (spaced.includes(',') && !/^\d{1,3}(,\d{3})+(\.\d+)?[kmb]?\+?$/.test(spaced)) {return null}
  const cleaned = spaced.replace(/,/g, '')

  const match = /^(\d+(?:\.\d+)?)([kmb])?\+?$/.exec(cleaned)
  if (!match) {return null}
  // A decimal only makes sense with a suffix ("5.2k"); "5.5" followers is a typo.
  if (match[1].includes('.') && !match[2]) {return null}

  const value = parseFloat(match[1]) * (match[2] ? SUFFIX_MULTIPLIER[match[2]] : 1)
  if (!Number.isFinite(value) || value > MAX_FOLLOWERS) {return null}
  return Math.round(value)
}

/** Prices like 100, "100", "100.50", "$1,000", "1000 USD". Null if not a price. */
export function parsePrice(input: unknown): number | null {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 && input <= MAX_PRICE ? Math.round(input * 100) / 100 : null
  }
  if (typeof input !== 'string') {return null}
  const cleaned = input.trim().toLowerCase().replace(/[$,\s]/g, '').replace(/usd$/, '')
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) {return null}
  const value = parseFloat(cleaned)
  return value <= MAX_PRICE ? value : null
}

export type UrlResult = { ok: true; url: string | null } | { ok: false; error: string }

/**
 * Profile URLs. Empty → null (optional). A missing scheme gets https://
 * ("x.com/handle", "www.linkedin.com/in/name"), otherwise a stored
 * "www.linkedin.com/..." renders as a broken relative link. Anything that
 * isn't http(s) is rejected, so a javascript: URL can never reach an href.
 * The URL is otherwise kept exactly as typed (no rewriting x.com ↔
 * twitter.com, no trailing-slash changes).
 */
export function normalizeProfileUrl(input: unknown): UrlResult {
  if (input === null || input === undefined) {return { ok: true, url: null }}
  if (typeof input !== 'string') {return { ok: false, error: 'Profile URL must be text' }}

  const trimmed = input.trim()
  if (trimmed === '') {return { ok: true, url: null }}

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  const candidate = hasScheme ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return { ok: false, error: `"${trimmed}" is not a valid URL` }
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'Profile URL must start with http:// or https://' }
  }
  if (!parsed.hostname.includes('.')) {
    return { ok: false, error: `"${trimmed}" is not a valid URL` }
  }
  if (candidate.length > 2000) {
    return { ok: false, error: 'Profile URL is too long' }
  }
  return { ok: true, url: candidate }
}

/** For rendering stored URLs (including legacy rows saved before validation). */
export function safeExternalHref(url: string | null | undefined): string | null {
  const result = normalizeProfileUrl(url)
  return result.ok ? result.url : null
}
