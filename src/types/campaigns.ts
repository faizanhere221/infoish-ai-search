// src/types/campaigns.ts
//
// Types for the Campaign Marketplace feature (campaigns, campaign_deliverables,
// campaign_applications — see supabase/campaigns_migration.sql).
//
// Note: `Campaign.brand_id` / `CampaignApplication.creator_id` reference the
// `brands.id` / `creators.id` profile rows (not `users.id`), matching the
// existing `deals` / `conversations` convention in src/types/marketplace.ts.

export type CampaignStatus = 'draft' | 'published' | 'closed' | 'completed' | 'cancelled'
export type CampaignVisibility = 'public' | 'private'
export type BudgetType = 'fixed' | 'range' | 'negotiable'

export type CampaignObjective =
  | 'brand_awareness'
  | 'product_review'
  | 'sponsored_content'
  | 'tutorial'
  | 'product_launch'
  | 'other'

export type CampaignCategory =
  | 'ai'
  | 'saas'
  | 'devtools'
  | 'cloud'
  | 'devops'
  | 'startup'
  | 'fintech'
  | 'cybersecurity'
  | 'productivity'
  | 'marketing'
  | 'ecommerce'
  | 'other'

export type Platform =
  | 'youtube'
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'tiktok'
  | 'newsletter'
  | 'podcast'
  | 'blog'
  | 'github'

export type ApplicationStatus =
  | 'submitted'
  | 'viewed'
  | 'shortlisted'
  | 'rejected'
  | 'hired'

export type DeliverableType =
  | 'dedicated_video'
  | 'integration'
  | 'post'
  | 'story'
  | 'thread'
  | 'review'
  | 'mention'
  | 'tutorial'
  | 'other'

// Subset of the `brands` row the campaigns API actually selects for joins.
export interface CampaignBrandSummary {
  id: string
  company_name: string
  logo_url: string | null
  contact_name: string | null
  industry: string | null
}

// Subset of the `creators` row (+ creator_platforms) the campaigns API
// actually selects for joins on applications.
export interface CampaignCreatorSummary {
  id: string
  username: string
  display_name: string
  profile_photo_url: string | null
  bio: string | null
  country: string | null
  niches: string[]
  total_followers: number
  platforms: { platform: string; followers: number }[]
}

export interface Campaign {
  id: string
  brand_id: string
  title: string
  description: string | null
  objective: CampaignObjective | null
  category: CampaignCategory | null
  budget_min: number | null
  budget_max: number | null
  budget_type: BudgetType
  currency: string
  platforms: Platform[]
  creator_categories: string[]
  min_followers: number
  target_countries: string[]
  application_deadline: string | null
  campaign_start_date: string | null
  campaign_end_date: string | null
  status: CampaignStatus
  visibility: CampaignVisibility
  applications_count: number
  hired_count: number
  created_at: string
  updated_at: string
  published_at: string | null
  // Joined data
  brand?: CampaignBrandSummary
  deliverables?: CampaignDeliverable[]
}

export interface CampaignDeliverable {
  id: string
  campaign_id: string
  platform: Platform
  deliverable_type: DeliverableType
  quantity: number
  description: string | null
  deadline: string | null
}

export interface CampaignApplication {
  id: string
  campaign_id: string
  creator_id: string
  proposed_rate: number | null
  cover_message: string | null
  pitch: string | null
  status: ApplicationStatus
  created_at: string
  updated_at: string
  // Joined data
  creator?: CampaignCreatorSummary
  campaign?: Campaign
}

// Constants for dropdowns
export const CAMPAIGN_OBJECTIVES: { value: CampaignObjective; label: string }[] = [
  { value: 'brand_awareness', label: 'Brand Awareness' },
  { value: 'product_review', label: 'Product Review' },
  { value: 'sponsored_content', label: 'Sponsored Content' },
  { value: 'tutorial', label: 'Tutorial / How-to' },
  { value: 'product_launch', label: 'Product Launch' },
  { value: 'other', label: 'Other' },
]

export const CAMPAIGN_CATEGORIES: { value: CampaignCategory; label: string }[] = [
  { value: 'ai', label: 'AI & Machine Learning' },
  { value: 'saas', label: 'SaaS' },
  { value: 'devtools', label: 'Developer Tools' },
  { value: 'cloud', label: 'Cloud & Infrastructure' },
  { value: 'devops', label: 'DevOps' },
  { value: 'startup', label: 'Startups' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'marketing', label: 'Marketing Tech' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'other', label: 'Other' },
]

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'blog', label: 'Blog' },
  { value: 'github', label: 'GitHub' },
]

export const DELIVERABLE_TYPES: { value: DeliverableType; label: string }[] = [
  { value: 'dedicated_video', label: 'Dedicated Video' },
  { value: 'integration', label: 'Integration/Mention' },
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' },
  { value: 'thread', label: 'Thread' },
  { value: 'review', label: 'Review' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'other', label: 'Other' },
]

export const CAMPAIGN_STATUSES: CampaignStatus[] = ['draft', 'published', 'closed', 'completed', 'cancelled']
export const APPLICATION_STATUSES: ApplicationStatus[] = ['submitted', 'viewed', 'shortlisted', 'rejected', 'hired']
