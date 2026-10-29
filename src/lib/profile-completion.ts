// The one definition of a "complete" creator profile. The sitemap lists a
// creator only when every REQUIRED item is done; the dashboard checklist,
// the settings share section, and the profile reminder email all read the
// same result, so "complete" means the same thing everywhere.

export type CompletenessItemId = 'bio' | 'identity' | 'platform_handle' | 'services' | 'niches' | 'country'

export interface CompletenessItem {
  id: CompletenessItemId
  label: string
  description: string
  // Required items decide sitemap listing and unlock the share badge.
  // Recommended items only raise the percentage.
  required: boolean
  isComplete: boolean
  // Settings tab that fixes this item.
  link: string
}

/** Minimal shape needed to score completeness: a subset of the creators row plus its joined relations. */
export interface CompletenessCreator {
  bio?: string | null
  display_name?: string | null
  profile_photo_url?: string | null
  niches?: string[] | null
  country?: string | null
  creator_platforms?: { platform_username?: string | null }[] | null
  creator_services?: { price?: number | null; is_active?: boolean | null }[] | null
}

export interface ProfileCompleteness {
  percentage: number
  // Every required item is done (the sitemap rule).
  isComplete: boolean
  // Every item, required and recommended, is done.
  isFullyComplete: boolean
  items: CompletenessItem[]
  missing: CompletenessItem[]
}

export const hasText = (value: string | null | undefined): boolean => !!value && value.trim().length > 0

export function getProfileCompleteness(creator: CompletenessCreator): ProfileCompleteness {
  const platforms = creator.creator_platforms ?? []
  const services = creator.creator_services ?? []

  const items: CompletenessItem[] = [
    {
      id: 'bio',
      label: 'Write your bio',
      description: 'Tell brands who you are and what you create.',
      required: true,
      isComplete: hasText(creator.bio),
      link: '/settings?tab=profile',
    },
    {
      id: 'identity',
      label: 'Add a profile photo or display name',
      description: 'Brands want to see who they are working with.',
      required: true,
      isComplete: hasText(creator.profile_photo_url) || hasText(creator.display_name),
      link: '/settings?tab=profile',
    },
    {
      id: 'platform_handle',
      label: 'Add a platform with your handle',
      description: 'Show at least one channel, with your username, so brands see your content for themselves.',
      required: true,
      isComplete: platforms.some((p) => hasText(p.platform_username)),
      link: '/settings?tab=platforms',
    },
    {
      id: 'services',
      label: 'Add a service with a price',
      description: 'Brands reply faster when your rates are on your profile.',
      required: false,
      isComplete: services.some((s) => s.is_active !== false && typeof s.price === 'number' && s.price > 0),
      link: '/settings?tab=services',
    },
    {
      id: 'niches',
      label: 'Pick your niches',
      description: 'Brands search by niche, so this puts you in front of the right ones.',
      required: false,
      isComplete: Array.isArray(creator.niches) && creator.niches.length > 0,
      link: '/settings?tab=profile',
    },
    {
      id: 'country',
      label: 'Add your country',
      description: 'Brands often look for creators in a specific market.',
      required: false,
      isComplete: hasText(creator.country),
      link: '/settings?tab=profile',
    },
  ]

  const missing = items.filter((i) => !i.isComplete)
  return {
    percentage: Math.round(((items.length - missing.length) / items.length) * 100),
    isComplete: !missing.some((i) => i.required),
    isFullyComplete: missing.length === 0,
    items,
    missing,
  }
}
