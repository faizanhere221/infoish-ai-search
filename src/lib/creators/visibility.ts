import type { createServerSupabase } from '@/lib/db'

type Supabase = ReturnType<typeof createServerSupabase>

// A creator must never appear on a public-facing surface (marketplace
// listing/search, profile page, sitemap, featured lists, campaign
// discovery, roster) if their account is soft-deleted or suspended, or an
// admin has explicitly hidden them (creators.hidden_from_marketplace — for
// internal test accounts). Brand-side records that already reflect a real
// engagement (campaign tracker rows, contracts, payments, chat) are NOT
// public surfaces in this sense and must keep showing the row as-is
// ("Deleted user") — do not apply this filter to those.

// User ids excluded from every public creator surface, as a ready-to-use
// Postgrest "in" list literal for `.not('user_id', 'in', <this>)`. An
// empty result comes back as the impossible literal '(null)' so callers
// never need a separate length check before using it.
export async function getExcludedCreatorUserIdsList(supabase: Supabase): Promise<string> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .or('deleted_at.not.is.null,is_active.eq.false')
  const ids = (data ?? []).map((u) => u.id)
  return `(${ids.length > 0 ? ids.join(',') : 'null'})`
}

// Single-row check for profile pages / detail lookups: fetch the creator's
// owning user row (deleted_at, is_active) once, then ask this.
export function isCreatorPublic(
  user: { deleted_at: string | null; is_active: boolean } | null,
  creator: { hidden_from_marketplace: boolean } | null
): boolean {
  if (!user || !creator) {return false}
  return user.deleted_at === null && user.is_active === true && !creator.hidden_from_marketplace
}
