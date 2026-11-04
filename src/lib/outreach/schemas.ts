import { z } from 'zod'
import { CHANNELS, parseNumber, parseBool, BRAND_STATUSES, CREATOR_STATUSES, DNC_KEY_TYPES, DNC_REASONS } from '@/lib/outreach/rules'

// Empty strings from forms and CSVs become null.
const text = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() || null : v ?? null),
    z.string().max(max).nullable(),
  ).optional()

const num = (max: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : typeof v === 'string' ? parseNumber(v) : v),
    z.number().min(0).max(max).nullable(),
  ).optional()

// bigint columns: 1.25k → 1250, 12.5 → 13
const int = (max: number) =>
  z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) {return null}
      const n = typeof v === 'string' ? parseNumber(v) : v
      return typeof n === 'number' ? Math.round(n) : n
    },
    z.number().int().min(0).max(max).nullable(),
  ).optional()

const bool = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : typeof v === 'boolean' ? v : parseBool(v)),
  z.boolean().nullable(),
).optional()

const email = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/^mailto:/, '') || null : v ?? null),
  z.string().email().max(255).nullable(),
).optional()

const owner = text(255)
const extra = z.record(z.union([z.string().max(5000), z.number(), z.boolean(), z.null()])).optional()
const channel = z.enum(CHANNELS).nullable().optional()

export const creatorFieldsSchema = z.object({
  name: text(255),
  platform: text(50),
  profile_url: text(2000),
  country: text(100),
  niche: text(100),
  subscribers: int(1e12),
  avg_views: int(1e12),
  engagement_pct: num(100000),
  does_sponsorships: bool,
  sponsor_brands: text(5000),
  email,
  instagram: text(2000),
  x: text(2000),
  linkedin: text(2000),
  tiktok: text(2000),
  website: text(2000),
  owner_user_id: owner,
  mailbox_id: text(255),
  channel,
  notes: text(20000),
  source: text(255),
  extra,
})

export const brandFieldsSchema = z.object({
  company: text(255),
  website: text(2000),
  domain: text(255),
  country: text(100),
  product: text(5000),
  team_size: text(50),
  why_them: text(5000),
  score: num(1e9),
  contact_name: text(255),
  role: text(255),
  email,
  linkedin: text(2000),
  owner_user_id: owner,
  mailbox_id: text(255),
  channel,
  notes: text(20000),
  source: text(255),
  extra,
})

export const creatorStatusSchema = z.enum(CREATOR_STATUSES)
export const brandStatusSchema = z.enum(BRAND_STATUSES)

export const actionSchema = z.object({
  lead_id: z.string().min(1).max(255),
  action: z.string().min(1).max(30),
  mailbox_id: z.string().max(255).nullable().optional(),
  channel,
})

export const undoSchema = z.object({ activity_id: z.string().min(1).max(255) })

export const bulkSchema = z.object({
  lead_ids: z.array(z.string().min(1).max(255)).min(1).max(500),
  owner_user_id: z.string().max(255).nullable().optional(),
  status: z.string().max(30).optional(),
  reason: z.string().min(3).max(500),
})

export const dncCreateSchema = z.object({
  key_type: z.enum(DNC_KEY_TYPES),
  value: z.string().trim().min(1).max(2000),
  reason: z.enum(DNC_REASONS),
  note: text(1000),
})

export const mailboxCreateSchema = z.object({
  address: z.string().trim().toLowerCase().email().max(255),
  owner_user_id: z.string().max(255).nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_personal: z.boolean().default(false),
  is_active: z.boolean().default(true),
  custom_limit: z.number().int().min(1).max(40).nullable().optional(),
})

export const mailboxUpdateSchema = mailboxCreateSchema.partial()

export const teamCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  display_name: z.string().trim().min(1).max(255),
  role: z.enum(['outreach', 'admin']),
  // Required only when the email has no account yet.
  temp_password: z.string().min(10).max(200).optional(),
  works_saturday: z.boolean().default(false),
  creators_monthly_target: z.number().int().min(0).max(100000).default(0),
  brands_monthly_target: z.number().int().min(0).max(100000).default(0),
  reason: z.string().min(3).max(500),
})

export const teamUpdateSchema = z.object({
  display_name: z.string().trim().min(1).max(255).optional(),
  works_saturday: z.boolean().optional(),
  creators_monthly_target: z.number().int().min(0).max(100000).optional(),
  brands_monthly_target: z.number().int().min(0).max(100000).optional(),
  dm_daily_warning: z.number().int().min(1).max(500).optional(),
  is_active: z.boolean().optional(),
})
