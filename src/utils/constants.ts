// Niches for Tech/AI marketplace
export const NICHES = [
  'AI & Machine Learning',
  'SaaS & Software', 
  'Developer Tools',
  'Cloud & DevOps',
  'Cybersecurity',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'Startup & Entrepreneurship',
  'Product Management',
  'Tech News & Reviews',
  'Programming Tutorials',
] as const

// Platforms
export const PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: 'Twitter' },
  { id: 'youtube', name: 'YouTube', icon: 'Youtube' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'Linkedin' },
  { id: 'tiktok', name: 'TikTok', icon: 'Music2' },
  { id: 'github', name: 'GitHub', icon: 'Github' },
  { id: 'newsletter', name: 'Newsletter', icon: 'Mail' },
  { id: 'podcast', name: 'Podcast', icon: 'Mic' },
] as const

// Service types by platform
export const SERVICE_TYPES: Record<string, Array<{ id: string; name: string; defaultRate: number }>> = {
  twitter: [
    { id: 'thread', name: 'Twitter Thread', defaultRate: 300 },
    { id: 'post', name: 'Single Post', defaultRate: 100 },
    { id: 'space', name: 'Twitter Space Mention', defaultRate: 500 },
  ],
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
  tiktok: [
    { id: 'video', name: 'TikTok Video', defaultRate: 300 },
  ],
  newsletter: [
    { id: 'section', name: 'Sponsored Section', defaultRate: 500 },
    { id: 'dedicated', name: 'Dedicated Issue', defaultRate: 1500 },
  ],
  podcast: [
    { id: 'mention', name: 'Mention (30-60s)', defaultRate: 500 },
    { id: 'segment', name: 'Segment (5-10min)', defaultRate: 1500 },
    { id: 'episode', name: 'Full Episode', defaultRate: 3000 },
  ],
  github: [
    { id: 'tutorial', name: 'Code Tutorial', defaultRate: 1000 },
    { id: 'review', name: 'Tool Review/Demo', defaultRate: 800 },
  ],
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

// Platform fee
export const PLATFORM_FEE_PERCENTAGE = 10

// Limits
export const MIN_FOLLOWERS = 3000
export const MAX_NICHES = 3
export const MAX_SERVICES = 10
export const MAX_PORTFOLIO_ITEMS = 10