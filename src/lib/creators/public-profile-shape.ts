import { isSupportedPlatform, NICHES } from '@/utils/constants'
import { safeExternalHref } from '@/lib/creators/platform-input'
import type {
  PublicCreatorPlatform, PublicCreatorProfile, PublicCreatorService,
} from '@/lib/creators/public-profile'

// Turns raw creators / creator_platforms / creator_services rows into the
// shape the public profile renders, so no stored value can crash the page.
// Old rows, removed platforms, test scripts and hand edits leave nulls,
// strings where numbers belong and odd URLs behind:
//   unknown platform     → the platform row or service is skipped
//   bad or unsafe URL    → no link (null), never a javascript: href
//   photo on a host next/image doesn't allow → no photo (initial shown)
//   unknown niche        → "Other" (same rule as the rest of the app)
//   missing or bad field → null / 0 / [], and the UI hides it

// Must match images.remotePatterns in next.config.js: next/image throws
// (a 500 for the whole page) on any other host.
const IMAGE_HOSTS = ['ypdspiwxsojwjzbagaip.supabase.co', 'lh3.googleusercontent.com']

type Row = Record<string, unknown>

function text(v: unknown): string | null {
  if (typeof v !== 'string') {return null}
  const s = v.trim()
  return s === '' ? null : s
}

// A finite number >= 0, or null. Numeric strings ("4.50") count.
function count(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) && n >= 0 ? n : null
}

function stringList(v: unknown): string[] {
  if (!Array.isArray(v)) {return []}
  return [...new Set(v.map(text).filter((s): s is string => s !== null))]
}

export function safeImageUrl(v: unknown): string | null {
  const s = text(v)
  if (!s) {return null}
  try {
    const u = new URL(s)
    return u.protocol === 'https:' && IMAGE_HOSTS.includes(u.hostname) ? s : null
  } catch {
    return null
  }
}

function toPlatform(p: Row): PublicCreatorPlatform | null {
  const id = text(p.id)
  if (!id || !isSupportedPlatform(p.platform)) {return null}
  return {
    id,
    platform: p.platform,
    platform_username: text(p.platform_username),
    platform_url: safeExternalHref(text(p.platform_url)),
    followers: count(p.followers) ?? 0,
  }
}

function toService(s: Row): PublicCreatorService | null {
  const id = text(s.id)
  const title = text(s.title)
  if (!id || !title || s.is_active === false) {return null}
  // A service on a platform we dropped is skipped; no platform is fine.
  if (s.platform !== null && s.platform !== undefined && s.platform !== '' && !isSupportedPlatform(s.platform)) {return null}
  return {
    id,
    title,
    description: text(s.description),
    content_type: text(s.content_type) ?? '',
    platform: isSupportedPlatform(s.platform) ? s.platform : '',
    price: count(s.price),
    delivery_days: count(s.delivery_days),
    revisions_included: count(s.revisions_included),
    is_active: true,
  }
}

export function toPublicProfile(creator: Row, platforms: unknown, services: unknown): PublicCreatorProfile {
  const username = text(creator.username) ?? ''
  const niches = [...new Set(stringList(creator.niches).map((n) => ((NICHES as readonly string[]).includes(n) ? n : 'Other')))]
  const rating = count(creator.avg_rating)
  const platformRows = Array.isArray(platforms) ? (platforms as Row[]) : []
  const serviceRows = Array.isArray(services) ? (services as Row[]) : []
  const seen = new Set<string>()

  return {
    id: String(creator.id ?? ''),
    user_id: String(creator.user_id ?? ''),
    username,
    display_name: text(creator.display_name) ?? username,
    bio: text(creator.bio),
    profile_photo_url: safeImageUrl(creator.profile_photo_url),
    country: text(creator.country),
    city: text(creator.city),
    niches,
    languages: stringList(creator.languages),
    verification_status: text(creator.verification_status) ?? 'pending',
    total_followers: count(creator.total_followers) ?? 0,
    completed_deals: count(creator.completed_deals) ?? 0,
    total_reviews: count(creator.total_reviews) ?? 0,
    avg_rating: rating && rating > 0 ? Math.min(rating, 5) : null,
    is_available: creator.is_available === true,
    min_budget: count(creator.min_budget),
    response_time: text(creator.response_time),
    created_at: text(creator.created_at) ?? '',
    // Duplicate ids would only break React keys; drop them too.
    creator_platforms: platformRows.map(toPlatform).filter((p): p is PublicCreatorPlatform => !!p && !seen.has(p.id) && !!seen.add(p.id)),
    creator_services: serviceRows.map(toService).filter((s): s is PublicCreatorService => s !== null),
  }
}
