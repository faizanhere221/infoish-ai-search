export interface ProfileCompletionItem {
  id: string
  label: string
  description: string
  isComplete: boolean
  link: string
  priority: number
}

/** Minimal shape needed to score completion — matches (a subset of) the Creator row plus its joined relations. */
export interface CompletionCreator {
  profile_photo_url: string | null
  bio: string | null
  niches: string[] | null
  creator_platforms?: { platform: string }[] | null
  creator_services?: { is_active: boolean }[] | null
}

export interface ProfileCompletionResult {
  percentage: number
  items: ProfileCompletionItem[]
  nextStep: ProfileCompletionItem | null
}

export function calculateProfileCompletion(creator: CompletionCreator): ProfileCompletionResult {
  const items: ProfileCompletionItem[] = [
    {
      id: 'avatar',
      label: 'Add a profile picture',
      description: 'Creators with photos get far more inquiries from brands.',
      isComplete: !!creator.profile_photo_url,
      link: '/settings',
      priority: 1,
    },
    {
      id: 'bio',
      label: 'Write your bio',
      description: 'Tell brands about yourself and the content you create.',
      isComplete: !!creator.bio && creator.bio.trim().length > 20,
      link: '/settings',
      priority: 2,
    },
    {
      id: 'platforms',
      label: 'Add your platforms',
      description: 'Show where you create content so brands can find you.',
      isComplete: (creator.creator_platforms?.length ?? 0) > 0,
      link: '/settings?tab=platforms',
      priority: 3,
    },
    {
      id: 'rates',
      label: 'Set your rates',
      description: 'Let brands know your pricing up front.',
      isComplete: (creator.creator_services?.filter((s) => s.is_active).length ?? 0) > 0,
      link: '/settings?tab=services',
      priority: 4,
    },
    {
      id: 'niches',
      label: 'Select your niches',
      description: 'Help brands find you when they search by category.',
      isComplete: (creator.niches?.length ?? 0) > 0,
      link: '/settings',
      priority: 5,
    },
  ]

  const completed = items.filter((i) => i.isComplete).length
  const percentage = Math.round((completed / items.length) * 100)
  const nextStep = [...items].sort((a, b) => a.priority - b.priority).find((i) => !i.isComplete) ?? null

  return { percentage, items, nextStep }
}
