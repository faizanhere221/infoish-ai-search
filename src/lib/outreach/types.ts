// Row shapes for the outreach tables (supabase/outreach_migration.sql),
// shared by the API routes and the admin UI.

export interface OutreachLeadBase {
  lead_id: string
  email: string | null
  linkedin: string | null
  country: string | null
  owner_user_id: string | null
  mailbox_id: string | null
  channel: string | null
  status: string
  date_contacted: string | null
  follow_up_date: string | null
  followed_up_date: string | null
  replied_at: string | null
  notes: string | null
  source: string | null
  extra: Record<string, string | number | boolean>
  email_norm: string | null
  list?: string // after outreach_contacts_lists_migration.sql
  deleted_at: string | null // soft delete: hidden everywhere, keys still block duplicates
  deleted_by: string | null
  created_at: string
  updated_at: string
}

export interface OutreachCreator extends OutreachLeadBase {
  name: string | null
  platform: string | null
  profile_url: string | null
  niche: string | null
  subscribers: number | null
  avg_views: number | null
  engagement_pct: number | null
  does_sponsorships: boolean | null
  sponsor_brands: string | null
  instagram: string | null
  x: string | null
  tiktok: string | null
  website: string | null
  profile_url_norm: string | null
}

export interface OutreachBrand extends OutreachLeadBase {
  company: string | null
  website: string | null
  domain: string | null
  product: string | null
  team_size: string | null
  why_them: string | null
  score: number | null
  contact_name: string | null
  role: string | null
  domain_norm: string | null
}

export type OutreachLead = OutreachCreator | OutreachBrand

// What list routes return per row: the lead plus computed flags.
// Brand rows: their contacts, once the contacts migration ran.
export interface ContactSummary {
  count: number
  primary: { id: string; name: string; title: string | null; email: string | null; status: string } | null
}

export type OutreachLeadRow = OutreachLead & { dnc: boolean; in_db?: boolean; contacts?: ContactSummary }

export interface OutreachMailbox {
  id: string
  address: string
  owner_user_id: string | null
  start_date: string
  is_personal: boolean
  is_active: boolean
  custom_limit: number | null
  created_at: string
}

export interface OutreachMailboxWithUsage extends OutreachMailbox {
  daily_limit: number
  // Sends in the rolling window (window_hours), or since Karachi midnight
  // before the migration (window_hours null).
  sent_today: number
  window_hours: number | null
  next_free_at: string | null // when full: when the next slot frees up
}

export interface OutreachTeamMember {
  user_id: string
  display_name: string
  email: string
  role: string
  works_saturday: boolean
  creators_monthly_target: number
  brands_monthly_target: number
  dm_daily_warning: number
  is_active: boolean
}

export interface OutreachDncEntry {
  id: string
  key_type: string
  key_value: string
  reason: string
  note: string | null
  lead_id: string | null
  created_by: string | null
  created_at: string
}

export interface DuplicateMatch {
  key_type: string
  key_value: string
  lead_type: 'creator' | 'brand'
  lead_id: string
  owner_name: string | null
  status: string | null
  deleted: boolean // the lead holding the key was deleted (admin restores it)
}

export interface FieldChange {
  old: unknown
  new: unknown
}

export interface OutreachActivityRow {
  id: string
  user_id: string | null
  action: string
  mailbox_id: string | null
  channel: string | null
  changes: Record<string, FieldChange> | null
  contact_id?: string | null
  undone_at: string | null
  created_at: string
}

export interface ActionResult {
  activity_id: string
  status: string
  mailbox_id: string | null
  mailbox_sent_today: number | null
  mailbox_limit: number | null
  mailbox_window_hours?: number | null
  contact_id?: string | null
  contact_status?: string | null
}

// ─── Creator Database / Client Database (outreach_database_migration.sql) ────
// Rows as outreach_db_creator_search() / outreach_db_brand_search() return
// them: the lead's own fields plus the Database fields. Internal only.

export interface CreatorRate {
  id: string
  platform: string
  format: string
  price: number
  currency: string
  usage_rights: boolean
  usage_note: string | null
  quoted_at: string | null
  created_at?: string
  updated_at?: string
}

export interface CreatorDbFields {
  availability: string | null
  next_available_date: string | null
  min_lead_days: number | null
  payment_methods: string[]
  upfront_pct: number | null
  audience_countries: string[]
  audience_languages: string[]
  past_collabs: string[]
  followers: Record<string, number>
  quality_rating?: number | null // admins only: the API leaves it out for members
  tags: string[]
  notes: string | null
}

export interface CreatorDbRow extends Omit<CreatorDbFields, 'notes'> {
  lead_id: string
  name: string | null
  platform: string | null
  platform_id: string | null
  profile_url: string | null
  country: string | null
  niche: string | null
  subscribers: number | null
  email: string | null
  linkedin: string | null
  instagram: string | null
  x: string | null
  tiktok: string | null
  website: string | null
  extra: Record<string, string | number | boolean>
  status: string
  owner_user_id: string | null
  db_notes: string | null
  added_at: string
  added_by: string | null
  total_followers: number
  all_platforms: string[]
  rates: CreatorRate[]
  last_quoted_at: string | null
  rate_currency: string | null
  cheapest: number | null
  typical: number | null
  on_infoishai: string | null // public profile username, when the same email signed up
}

export interface BrandContact {
  id: string
  lead_id: string
  first_name: string | null
  last_name: string | null
  title: string | null
  email: string | null
  linkedin: string | null
  is_primary: boolean
  status: string
  date_contacted: string | null
  follow_up_date: string | null
  followed_up_date: string | null
  replied_at: string | null
  mailbox_id: string | null
  channel: string | null
  notes: string | null
  source: string | null
  created_at: string
}

export interface BrandCampaign {
  id: string
  title: string
  run_date: string | null
  creators_used: string | null
  total_budget: number | null
  currency: string
  result_notes: string | null
}

export interface BrandDbFields {
  promotes: string | null
  target_countries: string[]
  niches: string[]
  platforms: string[]
  budget_min: number | null
  budget_max: number | null
  budget_currency: string
  creator_sizes: string[]
  stage: string
  start_date: string | null
  payment_terms: string | null
  notes: string | null
}

export interface BrandDbRow extends Omit<BrandDbFields, 'notes'> {
  lead_id: string
  company: string | null
  website: string | null
  domain: string | null
  country: string | null
  product: string | null
  contact_name: string | null
  role: string | null
  email: string | null
  linkedin: string | null
  status: string
  owner_user_id: string | null
  extra: Record<string, string | number | boolean>
  db_notes: string | null
  added_at: string
  added_by: string | null
  extra_contacts: number // all contacts of the brand, primary included
  campaigns_count: number
  last_campaign_date: string | null
}
