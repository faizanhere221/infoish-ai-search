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
export type OutreachLeadRow = OutreachLead & { dnc: boolean }

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
  sent_today: number
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
  undone_at: string | null
  created_at: string
}

export interface ActionResult {
  activity_id: string
  status: string
  mailbox_id: string | null
  mailbox_sent_today: number | null
  mailbox_limit: number | null
}
