import { revalidatePath } from 'next/cache'
import type { createServerSupabase } from '@/lib/db'

type Supabase = ReturnType<typeof createServerSupabase>

const COUNTRY_PAGES = [
  '/influencers/usa', '/influencers/uk', '/influencers/canada', '/influencers/india',
  '/influencers/australia', '/influencers/pakistan', '/influencers/germany',
  '/influencers/netherlands', '/influencers/singapore',
]

// Call after ANY change that could affect whether a creator appears, or
// what they show, on a public surface: hide/unhide, delete, suspend/
// activate, feature, verify, availability, or the creator's own profile
// edit. The /creators listing is ISR (revalidate = 1800) — a 30-minute
// window otherwise, long enough that an admin action looks like it
// silently did nothing. `username` is the creator's CURRENT username —
// fetch it from the DB *after* the write, since e.g. a delete changes it
// to `deleted-<id>`; revalidating the OLD path would miss the page that
// actually needs to flip to a 404.
export function revalidateCreatorPublicSurfaces(username?: string | null): void {
  revalidatePath('/creators')
  if (username) {revalidatePath(`/creators/${username}`)}
  revalidatePath('/sitemap.xml')
  for (const page of COUNTRY_PAGES) {revalidatePath(page)}
}

// Same, but keyed by users.id rather than creators.id — for the admin
// routes that apply to any user type (suspend/activate/delete). Looks up
// whether this user is a creator and, if so, their current username, then
// revalidates; a no-op for a brand user.
export async function revalidatePublicSurfacesForUser(supabase: Supabase, userId: string): Promise<void> {
  const { data: creator } = await supabase.from('creators').select('username').eq('user_id', userId).maybeSingle()
  if (creator) {revalidateCreatorPublicSurfaces(creator.username)}
}
