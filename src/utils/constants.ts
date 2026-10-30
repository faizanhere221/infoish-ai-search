// Niches. The only list of niches: creator profiles, marketplace search,
// campaign categories, admin filters, and marketing counts all read it.
// Stored as these exact strings (creators.niches, campaigns.category).
export const NICHES = [
  'AI & Machine Learning',
  'Generative AI & LLMs',
  'AI Tools & Automation',
  'SaaS & Software',
  'Developer Tools',
  'Cloud & DevOps',
  'Cybersecurity',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'No-Code & Low-Code',
  'Startup & Entrepreneurship',
  'Product Management',
  'Tech News & Reviews',
  'Programming Tutorials',
  'Consumer Tech & Gadgets',
  'PC Hardware & Gaming Tech',
  'Blockchain & Web3',
  'Fintech',
  'UI/UX & Product Design',
  'Open Source',
  'Tech Careers & Education',
  'Robotics & IoT',
  'E-commerce Tech',
] as const

export type Niche = (typeof NICHES)[number]

export function isNiche(value: unknown): value is Niche {
  return typeof value === 'string' && (NICHES as readonly string[]).includes(value)
}

// Keeps only current niches, de-duplicated, in the order given.
export function cleanNiches(values: unknown): Niche[] {
  return Array.isArray(values) ? [...new Set(values.filter(isNiche))] : []
}

// Platforms. The only list of supported platforms: every form, filter,
// badge, icon map, and API validator reads it.
export const PLATFORMS = [
  { id: 'youtube', name: 'YouTube' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'twitter', name: 'Twitter/X' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'instagram', name: 'Instagram' },
] as const

export type PlatformId = (typeof PLATFORMS)[number]['id']

export const PLATFORM_IDS = PLATFORMS.map((p) => p.id) as [PlatformId, ...PlatformId[]]

export function isSupportedPlatform(id: unknown): id is PlatformId {
  return typeof id === 'string' && PLATFORMS.some((p) => p.id === id)
}

// Old deals, campaigns, and deliverables can still name a platform we
// dropped (github, podcast, ...). They get a neutral label, not the raw id.
export function platformName(id: string | null | undefined): string {
  return PLATFORMS.find((p) => p.id === id)?.name ?? 'Other platform'
}

// Emoji badges, for compact spots (creator cards, conversation list).
const PLATFORM_EMOJI: Record<PlatformId, string> = {
  youtube: '📺',
  linkedin: '💼',
  twitter: '𝕏',
  tiktok: '🎵',
  instagram: '📸',
}

export function platformEmoji(id: string | null | undefined): string {
  return isSupportedPlatform(id) ? PLATFORM_EMOJI[id] : '🌐'
}

// How many platforms we support, for display. Every stat and
// piece of copy that shows the count reads this, so they always agree.
export const PLATFORM_COUNT = PLATFORMS.length

// Service (content) types by platform
export const SERVICE_TYPES: Record<PlatformId, Array<{ id: string; name: string; defaultRate: number }>> = {
  youtube: [
    { id: 'integration', name: 'Integration (60-90s)', defaultRate: 2500 },
    { id: 'dedicated', name: 'Dedicated Video', defaultRate: 5000 },
    { id: 'short', name: 'YouTube Short', defaultRate: 500 },
  ],
  linkedin: [
    { id: 'post', name: 'LinkedIn Post', defaultRate: 400 },
    { id: 'article', name: 'LinkedIn Article', defaultRate: 800 },
    { id: 'video', name: 'LinkedIn Video', defaultRate: 600 },
  ],
  twitter: [
    { id: 'thread', name: 'Twitter Thread', defaultRate: 300 },
    { id: 'post', name: 'Single Post', defaultRate: 100 },
    { id: 'space', name: 'Twitter Space Mention', defaultRate: 500 },
  ],
  tiktok: [
    { id: 'video', name: 'TikTok Video', defaultRate: 300 },
  ],
  instagram: [
    { id: 'post', name: 'Instagram Post', defaultRate: 400 },
    { id: 'story', name: 'Instagram Story', defaultRate: 200 },
    { id: 'reel', name: 'Instagram Reel', defaultRate: 600 },
  ],
}

export function serviceTypesFor(platform: string | null | undefined) {
  return isSupportedPlatform(platform) ? SERVICE_TYPES[platform] : []
}

// Content-type label for a service, or a neutral one for a type we no
// longer offer.
export function serviceTypeName(platform: string | null | undefined, contentType: string | null | undefined): string {
  if (!contentType) {return ''}
  return serviceTypesFor(platform).find((t) => t.id === contentType)?.name ?? 'Other content'
}

// Countries (Phase 1)
export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'SG', name: 'Singapore' },
] as const

// Country landing pages (/influencers/[country]) — used by header nav and footer
export const COUNTRY_LANDING_PAGES = [
  { name: 'United States', flag: '🇺🇸', href: '/influencers/usa' },
  { name: 'United Kingdom', flag: '🇬🇧', href: '/influencers/uk' },
  { name: 'Canada', flag: '🇨🇦', href: '/influencers/canada' },
  { name: 'India', flag: '🇮🇳', href: '/influencers/india' },
  { name: 'Australia', flag: '🇦🇺', href: '/influencers/australia' },
  { name: 'Pakistan', flag: '🇵🇰', href: '/influencers/pakistan' },
  { name: 'Germany', flag: '🇩🇪', href: '/influencers/germany' },
  { name: 'Netherlands', flag: '🇳🇱', href: '/influencers/netherlands' },
  { name: 'Singapore', flag: '🇸🇬', href: '/influencers/singapore' },
] as const

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' },
] as const

// Company sizes
export const COMPANY_SIZES = [
  { id: '1-10', name: '1-10 employees' },
  { id: '11-50', name: '11-50 employees' },
  { id: '51-200', name: '51-200 employees' },
  { id: '201-500', name: '201-500 employees' },
  { id: '500+', name: '500+ employees' },
] as const

// Industries
export const INDUSTRIES = [
  'SaaS', 'Developer Tools', 'AI/ML', 'Cybersecurity',
  'Cloud Infrastructure', 'Fintech', 'E-commerce',
  'Marketing Tech', 'HR Tech', 'Healthcare Tech', 'EdTech', 'Other',
] as const

// Deal statuses
export const DEAL_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  accepted: { label: 'Accepted', color: 'text-blue-700', bg: 'bg-blue-100' },
  declined: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-100' },
  delivered: { label: 'Delivered', color: 'text-purple-700', bg: 'bg-purple-100' },
  revision: { label: 'Revision', color: 'text-orange-700', bg: 'bg-orange-100' },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100' },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100' },
  disputed: { label: 'Disputed', color: 'text-red-700', bg: 'bg-red-100' },
  refunded: { label: 'Refunded', color: 'text-gray-700', bg: 'bg-gray-100' },
}

// Platform fee on legacy deals. Infoishai is free for brands and creators,
// so this is 0: the creator receives the full deal amount. Historical deals
// rows keep the 10% fee they were created with; don't backfill them.
export const PLATFORM_FEE_PERCENTAGE = 0

// Limits
export const MIN_FOLLOWERS = 3000
export const MAX_NICHES = 3
export const MAX_SERVICES = 10
export const MAX_PORTFOLIO_ITEMS = 10