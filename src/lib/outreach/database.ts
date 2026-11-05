// Pure rules for the outreach Creator Database and Client Database
// (supabase/outreach_database_migration.sql). No imports, no I/O, erasable
// TS only: scripts/outreach-check.mjs imports this file directly with
// Node's type stripping, like rules.ts.
//
// The SQL tables and functions are the source of truth. The lists here
// mirror their CHECK constraints, and cheapestAndTypical() mirrors the
// price maths in outreach_db_creator_search(), so the shortlist and tests
// agree with the table.

export type DbLeadType = 'creator' | 'brand'

// Same ids as PLATFORMS in src/utils/constants.ts (checked at compile time
// in database-server.ts). Kept here because this file can't import.
export const DB_PLATFORMS = ['youtube', 'linkedin', 'twitter', 'tiktok', 'instagram'] as const
export type DbPlatform = (typeof DB_PLATFORMS)[number]
export const DB_PLATFORM_LABELS: Record<DbPlatform, string> = {
  youtube: 'YouTube', linkedin: 'LinkedIn', twitter: 'X (Twitter)', tiktok: 'TikTok', instagram: 'Instagram',
}

export const RATE_FORMATS = [
  'dedicated_video', 'integration', 'short', 'post', 'thread', 'story', 'live', 'newsletter', 'other',
] as const
export type RateFormat = (typeof RATE_FORMATS)[number]
export const RATE_FORMAT_LABELS: Record<RateFormat, string> = {
  dedicated_video: 'Dedicated video', integration: 'Integration', short: 'Short', post: 'Post',
  thread: 'Thread', story: 'Story', live: 'Live stream', newsletter: 'Newsletter', other: 'Other',
}

export const AVAILABILITY = ['available', 'limited', 'booked'] as const
export const AVAILABILITY_LABELS: Record<string, string> = { available: 'Available', limited: 'Limited', booked: 'Booked' }

export const PAYMENT_METHODS = ['wise', 'payoneer', 'bank', 'paypal', 'crypto'] as const
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  wise: 'Wise', payoneer: 'Payoneer', bank: 'Bank transfer', paypal: 'PayPal', crypto: 'Crypto',
}

export const BRAND_STAGES = ['prospect', 'active', 'paused', 'past'] as const
export const BRAND_STAGE_LABELS: Record<string, string> = { prospect: 'Prospect', active: 'Active', paused: 'Paused', past: 'Past' }

export const CREATOR_SIZES = ['nano', 'micro', 'mid', 'macro', 'mega'] as const
export const CREATOR_SIZE_LABELS: Record<string, string> = {
  nano: 'Nano (<10K)', micro: 'Micro (10K–100K)', mid: 'Mid (100K–500K)', macro: 'Macro (500K–1M)', mega: 'Mega (1M+)',
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'INR', 'PKR'] as const

// Lead actions that offer "Add to Database" afterwards.
export const DB_OFFER_ACTIONS: Record<DbLeadType, readonly string[]> = {
  creator: ['replied'],
  brand: ['call_booked', 'won'],
}

export const RATE_STALE_DAYS = 90

// ─── Platforms ───────────────────────────────────────────────────────────────

// Free-text lead platform → PLATFORMS id. Mirrors outreach_platform_id().
export function platformId(v: unknown): DbPlatform | null {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : ''
  if (s === 'youtube' || s === 'yt') {return 'youtube'}
  if (s === 'linkedin') {return 'linkedin'}
  if (['x', 'twitter', 'x (twitter)', 'x/twitter', 'twitter/x'].includes(s)) {return 'twitter'}
  if (s === 'tiktok') {return 'tiktok'}
  if (s === 'instagram' || s === 'ig') {return 'instagram'}
  return null
}

// ─── Rates ───────────────────────────────────────────────────────────────────

export interface RateLike {
  platform: string
  format: string
  price: number | string
  currency: string
  quoted_at?: string | null
}

export interface RateFilter {
  formats?: string[]
  platforms?: string[]
  currency?: string | null
}

// Mirrors outreach_db_creator_search(): rates matching the format/platform
// filters, in the filtered currency, else the currency most of them use
// (USD wins a tie, then alphabetical). typical = median.
export function cheapestAndTypical(rates: RateLike[], f: RateFilter = {}): { currency: string | null; cheapest: number | null; typical: number | null } {
  const m = rates.filter((r) =>
    (!f.formats?.length || f.formats.includes(r.format)) && (!f.platforms?.length || f.platforms.includes(r.platform)))
  let currency = f.currency ? f.currency.toUpperCase() : null
  if (!currency) {
    const counts = new Map<string, number>()
    for (const r of m) {counts.set(r.currency, (counts.get(r.currency) ?? 0) + 1)}
    currency = [...counts.entries()].sort((a, b) =>
      b[1] - a[1] || Number(b[0] === 'USD') - Number(a[0] === 'USD') || a[0].localeCompare(b[0]))[0]?.[0] ?? null
  }
  const prices = m.filter((r) => r.currency === currency).map((r) => Number(r.price)).sort((a, b) => a - b)
  if (prices.length === 0) {return { currency, cheapest: null, typical: null }}
  const mid = Math.floor(prices.length / 2)
  const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
  return { currency, cheapest: prices[0], typical: Math.round(median * 100) / 100 }
}

// Whole days from a YYYY-MM-DD quote date to `today` (YYYY-MM-DD).
export function rateAgeDays(quotedAt: string | null | undefined, today: string): number | null {
  if (!quotedAt || !/^\d{4}-\d{2}-\d{2}/.test(quotedAt)) {return null}
  const ms = Date.parse(`${today.slice(0, 10)}T00:00:00Z`) - Date.parse(`${quotedAt.slice(0, 10)}T00:00:00Z`)
  return Number.isFinite(ms) ? Math.round(ms / 86_400_000) : null
}

export function isRateStale(quotedAt: string | null | undefined, today: string): boolean {
  const d = rateAgeDays(quotedAt, today)
  return d !== null && d > RATE_STALE_DAYS
}

export function rateAgeLabel(quotedAt: string | null | undefined, today: string): string {
  const d = rateAgeDays(quotedAt, today)
  if (d === null) {return 'No quote date'}
  if (d <= 0) {return 'Quoted today'}
  if (d === 1) {return 'Quoted 1 day ago'}
  return `Quoted ${d} days ago`
}

export function formatMoney(amount: number | string | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {return ''}
  const n = Number(amount)
  if (!Number.isFinite(n)) {return ''}
  const cur = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n)
  } catch {
    return `${n.toLocaleString('en-US')} ${cur}`
  }
}

export function formatFollowers(n: number | string | null | undefined): string {
  const v = Number(n)
  if (n === null || n === undefined || !Number.isFinite(v)) {return ''}
  if (v >= 1_000_000) {return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`}
  if (v >= 1_000) {return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`}
  return String(Math.round(v))
}

// ─── Shortlist (copied by the team, sent to a client) ────────────────────────

export interface ShortlistCreator {
  lead_id: string
  name: string | null
  link: string | null
  total_followers: number | null
  platform_label: string | null
  rates: RateLike[]
}

// One clean block per creator: name, link, followers, the rate for the
// chosen format (and platform), or "Rate on request". Internal fields
// (rating, notes, owner, email) never go in.
export function shortlistText(creators: ShortlistCreator[], opts: { format?: string | null; platform?: string | null; currency?: string | null }): string {
  const fmtLabel = opts.format ? RATE_FORMAT_LABELS[opts.format as RateFormat] ?? opts.format : null
  return creators.map((c, i) => {
    const lines = [`${i + 1}. ${c.name?.trim() || c.lead_id}`]
    if (c.link) {lines.push(`   ${c.link}`)}
    const followers = formatFollowers(c.total_followers)
    if (followers) {lines.push(`   ${followers} followers${c.platform_label ? ` (${c.platform_label})` : ''}`)}
    const { cheapest, currency } = cheapestAndTypical(c.rates, {
      formats: opts.format ? [opts.format] : [],
      platforms: opts.platform ? [opts.platform] : [],
      currency: opts.currency ?? null,
    })
    const what = fmtLabel ?? 'Rate'
    lines.push(`   ${what}: ${cheapest === null ? 'on request' : `${opts.format ? '' : 'from '}${formatMoney(cheapest, currency)}`}`)
    return lines.join('\n')
  }).join('\n\n')
}

// ─── "Find matching creators" ────────────────────────────────────────────────

export interface ClientMatchInput {
  niches?: string[] | null
  target_countries?: string[] | null
  country?: string | null
  platforms?: string[] | null
  budget_max?: number | string | null
  budget_min?: number | string | null
  budget_currency?: string | null
}

// Query string for /admin/outreach/database/creators, pre-filtered by the
// client's niches, countries, platforms and budget (a rate <= budget).
export function matchingCreatorsQuery(c: ClientMatchInput): string {
  const p = new URLSearchParams()
  const countries = (c.target_countries?.length ? c.target_countries : c.country ? [c.country] : []).filter(Boolean)
  if (c.niches?.length) {p.set('niche', c.niches.join(','))}
  if (countries.length) {p.set('country', countries.join(','))}
  if (c.platforms?.length) {p.set('platform', c.platforms.join(','))}
  const budget = c.budget_max ?? c.budget_min
  if (budget !== null && budget !== undefined && budget !== '' && Number(budget) > 0) {
    p.set('max_price', String(Number(budget)))
    p.set('currency', (c.budget_currency || 'USD').toUpperCase())
  }
  return p.toString()
}

// ─── Validation (Database fields and item rows) ──────────────────────────────
// Same shape as validateLeadField(): empty → null (or [] for lists), every
// unknown key is an error, never silently dropped.

export type DbFieldResult = { ok: true; value: unknown } | { ok: false; error: string }

type DbFieldKind =
  | 'text' | 'longtext' | 'date' | 'int' | 'pct' | 'money' | 'rating' | 'currency' | 'bool'
  | 'list' | 'followers' | { oneOf: readonly string[] } | { listOf: readonly string[] }

const CREATOR_DB_FIELDS: Record<string, DbFieldKind> = {
  availability: { oneOf: AVAILABILITY },
  next_available_date: 'date',
  min_lead_days: 'int',
  payment_methods: { listOf: PAYMENT_METHODS },
  upfront_pct: 'pct',
  audience_countries: 'list',
  audience_languages: 'list',
  past_collabs: 'list',
  followers: 'followers',
  quality_rating: 'rating',
  tags: 'list',
  notes: 'longtext',
}

const BRAND_DB_FIELDS: Record<string, DbFieldKind> = {
  promotes: 'longtext',
  target_countries: 'list',
  niches: 'list',
  platforms: { listOf: DB_PLATFORMS },
  budget_min: 'money',
  budget_max: 'money',
  budget_currency: 'currency',
  creator_sizes: { listOf: CREATOR_SIZES },
  stage: { oneOf: BRAND_STAGES },
  start_date: 'date',
  payment_terms: 'longtext',
  notes: 'longtext',
}

// Brand contacts are not a Database item: they belong to the lead
// (/api/admin/outreach/leads/brands/[leadId]/contacts).
export const DB_ITEM_KINDS = { creator: ['rates'], brand: ['campaigns'] } as const
export type DbItemKind = 'rates' | 'campaigns'
// URL segment → the kind name outreach_db_item() takes
export const DB_ITEM_SQL_KIND: Record<DbItemKind, string> = { rates: 'rate', campaigns: 'campaign' }

const ITEM_FIELDS: Record<DbItemKind, Record<string, DbFieldKind>> = {
  rates: {
    platform: { oneOf: DB_PLATFORMS },
    format: { oneOf: RATE_FORMATS },
    price: 'money',
    currency: 'currency',
    usage_rights: 'bool',
    usage_note: 'text',
    quoted_at: 'date',
  },
  campaigns: {
    title: 'text',
    run_date: 'date',
    creators_used: 'longtext',
    total_budget: 'money',
    currency: 'currency',
    result_notes: 'longtext',
  },
}

const ITEM_REQUIRED: Record<DbItemKind, string[]> = {
  rates: ['platform', 'format', 'price'],
  campaigns: ['title'],
}

const LIST_MAX = 50

function parseAmount(v: unknown): number | null {
  if (typeof v === 'number') {return Number.isFinite(v) ? v : null}
  if (typeof v !== 'string') {return null}
  const s = v.trim().toLowerCase().replace(/[,$€£\s]/g, '')
  const m = /^(\d+(?:\.\d+)?)(k|m)?$/.exec(s)
  if (!m) {return null}
  return Number(m[1]) * (m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1)
}

function isEmpty(raw: unknown): boolean {
  return raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '')
}

function toList(raw: unknown): string[] | null {
  if (isEmpty(raw)) {return []}
  const parts = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : null
  if (!parts || parts.some((x) => typeof x !== 'string')) {return null}
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of parts as string[]) {
    const s = p.trim()
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase())
      out.push(s)
    }
  }
  return out
}

export function validateDbValue(kind: DbFieldKind, raw: unknown): DbFieldResult {
  if (typeof kind === 'object' && 'oneOf' in kind) {
    if (isEmpty(raw)) {return { ok: true, value: null }}
    return typeof raw === 'string' && kind.oneOf.includes(raw.trim())
      ? { ok: true, value: raw.trim() }
      : { ok: false, error: `Pick one of: ${kind.oneOf.join(', ')}` }
  }
  if (typeof kind === 'object' && 'listOf' in kind) {
    const list = toList(raw)
    if (!list) {return { ok: false, error: 'Send a list' }}
    const bad = list.find((x) => !kind.listOf.includes(x))
    return bad ? { ok: false, error: `"${bad}" is not an option` } : { ok: true, value: list }
  }
  switch (kind) {
    case 'list': {
      const list = toList(raw)
      if (!list) {return { ok: false, error: 'Send a list' }}
      if (list.length > LIST_MAX) {return { ok: false, error: `Up to ${LIST_MAX} entries` }}
      if (list.some((x) => x.length > 100)) {return { ok: false, error: 'Keep each entry under 100 characters' }}
      return { ok: true, value: list }
    }
    case 'followers': {
      if (isEmpty(raw)) {return { ok: true, value: {} }}
      if (typeof raw !== 'object' || Array.isArray(raw)) {return { ok: false, error: 'Followers must be platform → number' }}
      const out: Record<string, number> = {}
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (!(DB_PLATFORMS as readonly string[]).includes(k)) {return { ok: false, error: `"${k}" is not a supported platform` }}
        if (isEmpty(v)) {continue}
        const n = parseAmount(v)
        if (n === null || n < 0) {return { ok: false, error: `Enter a number for ${DB_PLATFORM_LABELS[k as DbPlatform]}, like 12000 or 12k` }}
        out[k] = Math.round(n)
      }
      return { ok: true, value: out }
    }
    case 'bool': {
      if (isEmpty(raw)) {return { ok: true, value: false }}
      if (typeof raw === 'boolean') {return { ok: true, value: raw }}
      const s = String(raw).trim().toLowerCase()
      if (['yes', 'true', '1', 'y'].includes(s)) {return { ok: true, value: true }}
      if (['no', 'false', '0', 'n'].includes(s)) {return { ok: true, value: false }}
      return { ok: false, error: 'Choose Yes or No' }
    }
  }
  if (isEmpty(raw)) {return { ok: true, value: null }}
  switch (kind) {
    case 'date': {
      const s = typeof raw === 'string' ? raw.trim().slice(0, 10) : ''
      return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
        ? { ok: true, value: s }
        : { ok: false, error: 'Enter a date (YYYY-MM-DD)' }
    }
    case 'int': {
      const n = parseAmount(raw)
      return n !== null && Number.isInteger(n) && n >= 0 && n <= 365 ? { ok: true, value: n } : { ok: false, error: 'Enter whole days, 0 to 365' }
    }
    case 'pct': {
      const n = parseAmount(typeof raw === 'string' ? raw.replace('%', '') : raw)
      return n !== null && n >= 0 && n <= 100 ? { ok: true, value: Math.round(n) } : { ok: false, error: 'Enter 0 to 100' }
    }
    case 'money': {
      const n = parseAmount(raw)
      return n !== null && n >= 0 && n < 10_000_000_000 ? { ok: true, value: Math.round(n * 100) / 100 } : { ok: false, error: 'Enter an amount, like 1500 or 1.5k' }
    }
    case 'rating': {
      const n = parseAmount(raw)
      return n !== null && Number.isInteger(n) && n >= 1 && n <= 5 ? { ok: true, value: n } : { ok: false, error: 'Rate 1 to 5' }
    }
    case 'currency': {
      const s = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
      return /^[A-Z]{3}$/.test(s) ? { ok: true, value: s } : { ok: false, error: 'Enter a 3-letter currency code, like USD' }
    }
    case 'text': {
      const s = typeof raw === 'string' ? raw.trim() : typeof raw === 'number' ? String(raw) : null
      if (s === null) {return { ok: false, error: 'Enter text' }}
      return s.length <= 255 ? { ok: true, value: s } : { ok: false, error: 'Keep it under 255 characters' }
    }
    case 'longtext': {
      const s = typeof raw === 'string' ? raw.trim() : null
      if (s === null) {return { ok: false, error: 'Enter text' }}
      return s.length <= 20_000 ? { ok: true, value: s } : { ok: false, error: 'Keep it under 20,000 characters' }
    }
  }
  return { ok: false, error: 'Invalid value' }
}

export interface DbValidation {
  values: Record<string, unknown>
  errors: Record<string, string>
}

// Database fields of an entry. quality_rating is admin only.
export function validateDbFields(leadType: DbLeadType, body: Record<string, unknown>, opts: { isAdmin: boolean }): DbValidation {
  const fields = leadType === 'creator' ? CREATOR_DB_FIELDS : BRAND_DB_FIELDS
  const values: Record<string, unknown> = {}
  const errors: Record<string, string> = {}
  for (const [k, raw] of Object.entries(body)) {
    const kind = fields[k]
    if (!kind) {
      errors[k] = 'This field is not editable'
      continue
    }
    if (k === 'quality_rating' && !opts.isAdmin) {
      errors[k] = 'Only admins set the quality rating'
      continue
    }
    const r = validateDbValue(kind, raw)
    if (r.ok) {values[k] = r.value}
    else {errors[k] = r.error}
  }
  const min = values.budget_min as number | null | undefined
  const max = values.budget_max as number | null | undefined
  if (typeof min === 'number' && typeof max === 'number' && min > max) {errors.budget_max = 'Max budget must be at least the min budget'}
  return { values, errors }
}

// A rate / contact / campaign row. partial = an edit (only keys sent).
export function validateDbItem(kind: DbItemKind, body: Record<string, unknown>, partial: boolean): DbValidation {
  const fields = ITEM_FIELDS[kind]
  const values: Record<string, unknown> = {}
  const errors: Record<string, string> = {}
  for (const [k, raw] of Object.entries(body)) {
    const fk = fields[k]
    if (!fk) {
      errors[k] = 'Unknown field'
      continue
    }
    const r = validateDbValue(fk, raw)
    if (r.ok) {values[k] = r.value}
    else {errors[k] = r.error}
  }
  for (const req of ITEM_REQUIRED[kind]) {
    const sent = req in body
    if ((!partial || sent) && (values[req] === null || values[req] === undefined) && !errors[req]) {errors[req] = 'Required'}
  }
  // Defaults the SQL would apply anyway; explicit so the API response is complete.
  if (!partial && (kind === 'rates' || kind === 'campaigns') && !values.currency) {values.currency = 'USD'}
  return { values, errors }
}

export function isDbItemKind(leadType: DbLeadType, v: string): v is DbItemKind {
  return (DB_ITEM_KINDS[leadType] as readonly string[]).includes(v)
}

// ─── Table filters (URL ↔ search function) ───────────────────────────────────

export const CREATOR_DB_SORTS = ['added', 'name', 'price', 'followers', 'rating', 'rate_date'] as const
export const BRAND_DB_SORTS = ['added', 'company', 'budget', 'start_date'] as const

function csvParam(p: URLSearchParams, key: string, max = 30): string[] {
  return (p.get(key) ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, max).map((s) => s.slice(0, 100))
}

function numParam(p: URLSearchParams, key: string): number | null {
  const n = parseAmount(p.get(key) ?? '')
  return n === null ? null : n
}

// URL params → the JSON outreach_db_creator_search() takes. The rating
// filter and sort are dropped for members (the rating is admin only).
export function creatorDbFilters(p: URLSearchParams, opts: { isAdmin: boolean; callerId: string }): Record<string, unknown> {
  const sort = p.get('sort') ?? 'added'
  const owner = p.get('owner')
  const rating = numParam(p, 'min_rating')
  const currency = (p.get('currency') ?? '').trim().toUpperCase()
  return {
    q: (p.get('q') ?? '').trim().slice(0, 100) || null,
    niches: csvParam(p, 'niche'),
    countries: csvParam(p, 'country'),
    platforms: csvParam(p, 'platform').filter((x) => (DB_PLATFORMS as readonly string[]).includes(x)),
    formats: csvParam(p, 'format').filter((x) => (RATE_FORMATS as readonly string[]).includes(x)),
    availability: csvParam(p, 'availability').filter((x) => (AVAILABILITY as readonly string[]).includes(x)),
    tags: csvParam(p, 'tag'),
    max_price: numParam(p, 'max_price'),
    currency: /^[A-Z]{3}$/.test(currency) ? currency : null,
    min_rating: opts.isAdmin && rating !== null && rating >= 1 && rating <= 5 ? Math.round(rating) : null,
    owner: owner === 'me' ? opts.callerId : owner || null,
    sort: (CREATOR_DB_SORTS as readonly string[]).includes(sort) && (sort !== 'rating' || opts.isAdmin) ? sort : 'added',
    dir: p.get('dir') === 'asc' ? 'asc' : 'desc',
  }
}

export function brandDbFilters(p: URLSearchParams, opts: { callerId: string }): Record<string, unknown> {
  const sort = p.get('sort') ?? 'added'
  const owner = p.get('owner')
  const currency = (p.get('currency') ?? '').trim().toUpperCase()
  return {
    q: (p.get('q') ?? '').trim().slice(0, 100) || null,
    stages: csvParam(p, 'stage').filter((x) => (BRAND_STAGES as readonly string[]).includes(x)),
    countries: csvParam(p, 'country'),
    niches: csvParam(p, 'niche'),
    platforms: csvParam(p, 'platform').filter((x) => (DB_PLATFORMS as readonly string[]).includes(x)),
    min_budget: numParam(p, 'min_budget'),
    currency: /^[A-Z]{3}$/.test(currency) ? currency : null,
    owner: owner === 'me' ? opts.callerId : owner || null,
    sort: (BRAND_DB_SORTS as readonly string[]).includes(sort) ? sort : 'added',
    dir: p.get('dir') === 'asc' ? 'asc' : 'desc',
  }
}
