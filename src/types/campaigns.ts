// src/types/campaigns.ts
//
// Types for the Campaign Marketplace feature (campaigns, campaign_deliverables,
// campaign_applications — see supabase/campaigns_migration.sql).
//
// Note: `Campaign.brand_id` / `CampaignApplication.creator_id` reference the
// `brands.id` / `creators.id` profile rows (not `users.id`), matching the
// existing `deals` / `conversations` convention in src/types/marketplace.ts.

import { PLATFORMS as BASE_PLATFORMS, type PlatformId } from '@/utils/constants'

export type CampaignStatus = 'draft' | 'published' | 'closed' | 'completed' | 'cancelled'
export type CampaignVisibility = 'public' | 'private'
export type BudgetType = 'fixed' | 'range' | 'negotiable'

export type CampaignCreatorStatus =
  | 'shortlisted'
  | 'contacted'
  | 'negotiating'
  | 'confirmed'
  | 'drafting'
  | 'draft_review'
  | 'scheduled'
  | 'posted'
  | 'completed'
  | 'dropped'

// Phase 3 — negotiations, deliverables + approvals, scheduling
// (see supabase/phase3_workflow_migration.sql). Built on campaign_creators,
// not the legacy deals table.

export type OfferParty = 'brand' | 'creator'
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'withdrawn' | 'expired'

export interface CampaignOffer {
  id: string
  campaign_creator_id: string
  from_party: OfferParty
  amount: number
  currency: string
  deliverables_summary: string | null
  publish_by: string | null
  revisions_included: number
  usage_rights: string | null
  message: string | null
  status: OfferStatus
  expires_at: string | null
  created_at: string
  responded_at: string | null
}

export type DeliverableStatus = 'pending' | 'draft_submitted' | 'changes_requested' | 'approved' | 'posted' | 'completed'
export type DeliverableFormat = 'video' | 'post' | 'thread' | 'story' | 'other'

export interface CreatorDeliverable {
  id: string
  campaign_creator_id: string
  title: string
  platform: string | null
  // Older rows can hold a format we dropped (newsletter, podcast), so this
  // is a plain string. Show it with deliverableFormatLabel().
  format: string | null
  draft_due: string | null
  publish_due: string | null
  status: DeliverableStatus
  draft_url: string | null
  draft_attachment_path: string | null
  posted_url: string | null
  revisions_used: number
  revisions_allowed: number
  latest_feedback: string | null
  created_at: string
  updated_at: string
}

export interface CampaignCreatorEvent {
  id: string
  campaign_creator_id: string
  actor_user_id: string
  actor_type: OfferParty
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export type CreatorAvailabilityStatus = 'open' | 'limited' | 'booked'

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

export type Platform = PlatformId

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
  // Internal label for which client this campaign is run on behalf of.
  // Brand-only — never present in a response to a creator or the share link.
  client_name?: string | null
  applications_count: number
  hired_count: number
  created_at: string
  updated_at: string
  published_at: string | null
  // Joined data
  brand?: CampaignBrandSummary
  deliverables?: CampaignDeliverable[]
}

// Subset of the `creators` row + platform summary the tracker joins in.
export interface TrackerCreatorSummary {
  id: string
  username: string
  display_name: string
  profile_photo_url: string | null
  primary_platform: string | null
  total_followers: number
}

// Full shape — only ever returned to the owning brand. Creator-facing and
// share-link responses use the narrower types below instead of this one.
export interface CampaignCreator {
  id: string
  campaign_id: string
  creator_id: string
  status: CampaignCreatorStatus
  planned_date: string | null
  posted_at: string | null
  posted_url: string | null
  payout_amount: number | null
  charge_amount: number | null
  currency: string
  brand_notes: string | null
  deal_id: string | null
  application_id: string | null
  created_at: string
  updated_at: string
  status_locked?: boolean
  // Server-computed from creator_deliverables (brand-owner view only)
  deliverables_pending_review?: number
  deliverables_overdue?: number
  // Server-computed from the active (non-void) campaign_contracts row
  // (brand-owner view only); null if no contract has been drafted yet.
  contract_status?: string | null
  // Server-computed from this row's non-cancelled creator_payments rows
  // (brand-owner view only); null if no payment record exists yet.
  payment_status?: string | null
  payment_overdue?: boolean
  // Server-computed — feeds the shared "next step" guidance helper
  // (src/lib/campaign-creator-next-step.ts).
  pending_offer_from?: 'brand' | 'creator' | null
  deliverable_statuses?: string[]
  // Joined data
  creator?: TrackerCreatorSummary
  campaign?: Pick<Campaign, 'id' | 'title' | 'client_name'>
}

// What a creator is allowed to see about their own row — no charge_amount,
// no brand_notes, no client_name. Stripped server-side, never just hidden
// in the UI (see GET /api/campaigns/[id]/creators with x-user-type=creator).
export interface CampaignCreatorForCreator {
  id: string
  campaign_id: string
  status: CampaignCreatorStatus
  planned_date: string | null
  posted_at: string | null
  posted_url: string | null
  payout_amount: number | null
  currency: string
  campaign?: Pick<Campaign, 'id' | 'title'>
  brand?: CampaignBrandSummary
  contract_status?: string | null
  payment_status?: string | null
  payment_overdue?: boolean
  pending_offer_from?: 'brand' | 'creator' | null
  deliverable_statuses?: string[]
}

// What the public share link is allowed to show — no payout_amount, no
// brand_notes, no client_name, and charge_amount only if the link owner
// opted in (show_charge). See GET /api/share/[token].
export interface CampaignCreatorForShare {
  id: string
  status: CampaignCreatorStatus
  planned_date: string | null
  posted_at: string | null
  posted_url: string | null
  charge_amount?: number | null
  currency: string
  creator: TrackerCreatorSummary
}

export interface CampaignShareLink {
  id: string
  campaign_id: string
  token: string
  show_charge: boolean
  show_results: boolean
  revoked_at: string | null
  last_viewed_at: string | null
  created_at: string
}

// A brand's reusable creator roster (extends `saved_creators`).
export interface RosterEntry {
  id: string
  brand_id: string
  creator_id: string
  notes: string | null
  typical_payout: number | null
  typical_charge: number | null
  currency: string
  tags: string[]
  created_at: string
  // Joined data
  creator?: TrackerCreatorSummary & {
    avg_engagement_rate: number | null
    avg_views: number | null
  }
  // Server-computed from this brand's own campaign_creators/results history
  // with this creator — never across other brands.
  performance?: {
    campaigns_done: number
    avg_views: number | null
    avg_cpm: number | null
    on_time_pct: number | null
  }
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

// Same list as src/utils/constants.ts, in the { value, label } shape the
// campaign forms use.
export const PLATFORMS: { value: Platform; label: string }[] = BASE_PLATFORMS.map((p) => ({
  value: p.id,
  label: p.name,
}))

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

export const CAMPAIGN_CREATOR_STATUSES: CampaignCreatorStatus[] = [
  'shortlisted', 'contacted', 'negotiating', 'confirmed', 'drafting',
  'draft_review', 'scheduled', 'posted', 'completed', 'dropped',
]

export const CAMPAIGN_CREATOR_STATUS_LABELS: Record<CampaignCreatorStatus, string> = {
  shortlisted: 'Shortlisted',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed',
  drafting: 'Drafting',
  draft_review: 'Draft review',
  scheduled: 'Scheduled',
  posted: 'Posted',
  completed: 'Completed',
  dropped: 'Dropped',
}

export const OFFER_STATUSES: OfferStatus[] = ['pending', 'accepted', 'declined', 'countered', 'withdrawn', 'expired']

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  countered: 'Countered',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
}

export const DELIVERABLE_STATUSES: DeliverableStatus[] = [
  'pending', 'draft_submitted', 'changes_requested', 'approved', 'posted', 'completed',
]

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  pending: 'Not started',
  draft_submitted: 'Draft submitted',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  posted: 'Posted',
  completed: 'Completed',
}

export const DELIVERABLE_FORMATS: { value: DeliverableFormat; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'post', label: 'Post' },
  { value: 'thread', label: 'Thread' },
  { value: 'story', label: 'Story' },
  { value: 'other', label: 'Other' },
]

export function isDeliverableFormat(value: unknown): value is DeliverableFormat {
  return DELIVERABLE_FORMATS.some((f) => f.value === value)
}

export function deliverableFormatLabel(value: string | null | undefined): string {
  return DELIVERABLE_FORMATS.find((f) => f.value === value)?.label ?? 'Other'
}

export const CREATOR_AVAILABILITY_LABELS: Record<CreatorAvailabilityStatus, string> = {
  open: 'Open for new campaigns',
  limited: 'Limited availability',
  booked: 'Fully booked',
}
