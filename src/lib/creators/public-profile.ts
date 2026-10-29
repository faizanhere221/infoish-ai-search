import { cache } from 'react'
import { createServerSupabase } from '@/lib/db'
import { isCreatorPublic } from '@/lib/creators/visibility'

// Server-side loader for the public profile page (/creators/[username]).
// Everything returned here is serialized into the page's HTML, which is
// ISR-cached and served to everyone, so the column lists are explicit:
// only fields the profile UI renders, never a `select('*')`.

export interface PublicCreatorPlatform {
  id: string
  platform: string
  platform_username: string | null
  platform_url: string | null
  followers: number
}

export interface PublicCreatorService {
  id: string
  title: string
  description: string | null
  content_type: string
  platform: string
  price: number
  delivery_days: number
  revisions_included: number
  is_active: boolean
}

export interface PublicCreatorProfile {
  id: string
  user_id: string
  username: string
  display_name: string
  bio: string | null
  profile_photo_url: string | null
  country: string | null
  city: string | null
  niches: string[]
  languages: string[]
  verification_status: string
  total_followers: number
  completed_deals: number
  total_reviews: number
  avg_rating: number | null
  is_available: boolean
  min_budget: number | null
  response_time: string | null
  created_at: string
  creator_platforms: PublicCreatorPlatform[]
  creator_services: PublicCreatorService[]
}

const CREATOR_COLUMNS =
  'id, user_id, username, display_name, bio, profile_photo_url, country, city, niches, languages, verification_status, total_followers, completed_deals, total_reviews, avg_rating, is_available, min_budget, response_time, created_at, hidden_from_marketplace'

// Returns null for a missing username AND for a creator who is deleted,
// suspended, or admin-hidden (isCreatorPublic) — callers turn both into a
// real 404. cache() dedupes the lookup between generateMetadata, the
// layout's JSON-LD, and the page render.
export const getPublicCreatorProfile = cache(async (username: string): Promise<PublicCreatorProfile | null> => {
  const supabase = createServerSupabase()
  const { data: creator } = await supabase
    .from('creators')
    .select(CREATOR_COLUMNS)
    .eq('username', username.toLowerCase())
    .maybeSingle()
  if (!creator) {return null}

  const { data: ownerUser } = await supabase
    .from('users')
    .select('deleted_at, is_active')
    .eq('id', creator.user_id)
    .maybeSingle()
  if (!isCreatorPublic(ownerUser, creator)) {return null}

  const [{ data: platforms }, { data: services }] = await Promise.all([
    supabase
      .from('creator_platforms')
      .select('id, platform, platform_username, platform_url, followers')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('creator_services')
      .select('id, title, description, content_type, platform, price, delivery_days, revisions_included, is_active')
      .eq('creator_id', creator.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
  ])

  const { hidden_from_marketplace: _hidden, ...profile } = creator
  return {
    ...profile,
    niches: profile.niches ?? [],
    languages: profile.languages ?? [],
    creator_platforms: platforms ?? [],
    creator_services: services ?? [],
  } as PublicCreatorProfile
})
