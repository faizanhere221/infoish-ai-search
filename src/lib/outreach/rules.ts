// Pure outreach rules: no imports, no I/O. Shared by the API routes, the
// admin UI (import preview) and scripts/outreach-check.mjs, which imports
// this file directly with Node's built-in TypeScript type stripping. Keep it
// to erasable TS syntax (no enums, no namespaces, no parameter properties)
// and no imports, or that script stops working.
//
// Normalisation and the mailbox limit mirror the SQL functions in
// supabase/outreach_migration.sql. The database is the source of truth;
// these exist so the import preview agrees with what the DB will do.

export const TIME_ZONE = 'Asia/Karachi'
// Asia/Karachi is UTC+5 all year (no DST), which keeps day maths simple.
const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000

export const LEAD_TYPES = ['creator', 'brand'] as const
export type LeadType = (typeof LEAD_TYPES)[number]

export const CHANNELS = ['email', 'linkedin', 'x', 'instagram', 'tiktok'] as const
export type Channel = (typeof CHANNELS)[number]
export const DM_CHANNELS: Channel[] = ['linkedin', 'x', 'instagram', 'tiktok']

export const CREATOR_STATUSES = [
  'found', 'contacted', 'followed_up', 'replied', 'signed_up',
  'not_interested', 'no_reply', 'bounced', 'opted_out',
] as const
export const BRAND_STATUSES = [
  'found', 'contacted', 'followed_up', 'replied', 'call_booked', 'won',
  'not_interested', 'no_reply', 'bounced', 'opted_out',
] as const
export const END_STATUSES = ['not_interested', 'no_reply', 'bounced', 'opted_out'] as const

export const CREATOR_ACTIONS = [
  'contacted', 'followed_up', 'replied', 'signed_up', 'not_interested', 'bounced', 'opted_out',
] as const
export const BRAND_ACTIONS = [
  'contacted', 'followed_up', 'replied', 'call_booked', 'won', 'not_interested', 'bounced', 'opted_out',
] as const
export type LeadAction = (typeof CREATOR_ACTIONS)[number] | (typeof BRAND_ACTIONS)[number]

export const DNC_KEY_TYPES = ['email', 'domain', 'profile_url'] as const
export type DncKeyType = (typeof DNC_KEY_TYPES)[number]
export const DNC_REASONS = ['opted_out', 'bounced', 'removal_request', 'competitor', 'other'] as const

export const STATUS_LABELS: Record<string, string> = {
  found: 'Found',
  contacted: 'Contacted',
  followed_up: 'Followed up',
  replied: 'Replied',
  signed_up: 'Signed up',
  call_booked: 'Call booked',
  won: 'Won',
  not_interested: 'Not interested',
  no_reply: 'No reply',
  bounced: 'Bounced',
  opted_out: 'Opted out',
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  linkedin: 'LinkedIn',
  x: 'X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
}

export const FOLLOW_UP_AFTER_DAYS = 4
export const NO_REPLY_AFTER_DAYS = 7
export const UNDO_WINDOW_MS = 10 * 60 * 1000
export const IMPORT_MAX_ROWS = 5000
export const MAILBOX_MAX_LIMIT = 40
export const PERSONAL_MAILBOX_DEFAULT_LIMIT = 30
export const MAILBOX_WARN_RATIO = 0.8
export const BOUNCE_RATE_FLAG = 0.03
export const OWNER_RULE_SUBSCRIBERS = 100_000

// ─── Normalisation ───────────────────────────────────────────────────────────

function clean(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

export function normalizeEmail(v: unknown): string | null {
  const s = clean(v).replace(/^mailto:/, '')
  return s || null
}

// lowercase, trim, no protocol, no www., no query/fragment, no trailing slash
export function normalizeUrl(v: unknown): string | null {
  const s = clean(v)
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
  return s || null
}

export function normalizeDomain(v: unknown): string | null {
  const url = normalizeUrl(v)
  if (!url) {return null}
  const host = url.split('/')[0].replace(/:[0-9]+$/, '')
  return host || null
}

export function emailDomain(emailNorm: string | null): string | null {
  if (!emailNorm) {return null}
  const at = emailNorm.lastIndexOf('@')
  return at === -1 ? null : emailNorm.slice(at + 1) || null
}

export interface LeadKey {
  type: 'email' | 'profile_url' | 'domain'
  value: string
}

// The keys a lead claims in outreach_keys (duplicate detection).
export function leadKeys(
  leadType: LeadType,
  lead: { email?: unknown; profile_url?: unknown; domain?: unknown; website?: unknown },
): LeadKey[] {
  const keys: LeadKey[] = []
  const email = normalizeEmail(lead.email)
  if (email) {keys.push({ type: 'email', value: email })}
  if (leadType === 'creator') {
    const url = normalizeUrl(lead.profile_url)
    if (url) {keys.push({ type: 'profile_url', value: url })}
  } else {
    const rawDomain = typeof lead.domain === 'string' && lead.domain.trim() ? lead.domain : lead.website
    const domain = normalizeDomain(rawDomain)
    if (domain) {keys.push({ type: 'domain', value: domain })}
  }
  return keys
}

// Keys checked against the DNC list: the lead's own keys plus its email's
// domain (a DNC domain entry blocks every address at that domain).
export function dncKeys(leadType: LeadType, lead: Parameters<typeof leadKeys>[1]): LeadKey[] {
  const keys = leadKeys(leadType, lead)
  const domain = emailDomain(normalizeEmail(lead.email))
  if (domain && !keys.some((k) => k.type === 'domain' && k.value === domain)) {
    keys.push({ type: 'domain', value: domain })
  }
  return keys
}

export function normalizeDncValue(type: DncKeyType, v: unknown): string | null {
  if (type === 'email') {return normalizeEmail(v)}
  if (type === 'domain') {return normalizeDomain(v)}
  return normalizeUrl(v)
}

// ─── Dates (Asia/Karachi) ────────────────────────────────────────────────────

// YYYY-MM-DD for the Karachi calendar day containing `now`.
export function karachiToday(now: Date = new Date()): string {
  return new Date(now.getTime() + KARACHI_OFFSET_MS).toISOString().slice(0, 10)
}

// The UTC instant a Karachi calendar day starts.
export function karachiDayStart(day: string): Date {
  return new Date(Date.parse(`${day}T00:00:00Z`) - KARACHI_OFFSET_MS)
}

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

// 0 = Sunday … 6 = Saturday
export function weekday(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay()
}

// Monday of the week containing `day`.
export function weekStart(day: string): string {
  const wd = weekday(day)
  return addDays(day, wd === 0 ? -6 : 1 - wd)
}

export function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`
}

export function monthEnd(day: string): string {
  const d = new Date(`${monthStart(day)}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + 1)
  d.setUTCDate(0)
  return d.toISOString().slice(0, 10)
}

export function followUpDate(dateContacted: string): string {
  return addDays(dateContacted, FOLLOW_UP_AFTER_DAYS)
}

export function noReplyDate(followedUpDate: string): string {
  return addDays(followedUpDate, NO_REPLY_AFTER_DAYS)
}

export function isWorkingDay(day: string, worksSaturday: boolean): boolean {
  const wd = weekday(day)
  if (wd === 0) {return false}
  if (wd === 6) {return worksSaturday}
  return true
}

// Working days in [from, to], both inclusive.
export function workingDaysBetween(from: string, to: string, worksSaturday: boolean): number {
  let n = 0
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (isWorkingDay(d, worksSaturday)) {n += 1}
  }
  return n
}

export interface Pace {
  target: number
  done: number
  workingDaysTotal: number
  workingDaysLeft: number // including today
  expectedByNow: number // target share of working days already finished
  perDayNeeded: number
  onTrack: boolean
}

// Month pace for one person. "Expected by now" counts working days before
// today, so nobody is "behind" at 9am for sends they haven't had a day for.
export function monthPace(target: number, done: number, today: string, worksSaturday: boolean): Pace {
  const start = monthStart(today)
  const end = monthEnd(today)
  const total = workingDaysBetween(start, end, worksSaturday)
  const left = workingDaysBetween(today, end, worksSaturday)
  const elapsed = total - left
  const expected = total > 0 ? Math.round((target * elapsed) / total) : 0
  const remaining = Math.max(target - done, 0)
  return {
    target,
    done,
    workingDaysTotal: total,
    workingDaysLeft: left,
    expectedByNow: expected,
    perDayNeeded: left > 0 ? Math.ceil(remaining / left) : remaining,
    onTrack: done >= expected,
  }
}

// ─── Mailboxes ───────────────────────────────────────────────────────────────

export interface MailboxLimitInput {
  start_date: string
  is_personal: boolean
  custom_limit: number | null
}

// Week 1 = 10/day, week 2 = 15, week 3 = 25, week 4+ = 30. A custom limit
// (max 40) replaces the schedule. Personal mailboxes have no warm-up:
// custom limit, or 30.
export function mailboxDailyLimit(mb: MailboxLimitInput, today: string): number {
  if (mb.custom_limit !== null && mb.custom_limit !== undefined) {
    return Math.min(mb.custom_limit, MAILBOX_MAX_LIMIT)
  }
  if (mb.is_personal) {return PERSONAL_MAILBOX_DEFAULT_LIMIT}
  const age = daysBetween(mb.start_date, today)
  if (age < 7) {return 10}
  if (age < 14) {return 15}
  if (age < 21) {return 25}
  return 30
}

export type MailboxState = 'ok' | 'warn' | 'full'

export function mailboxState(sent: number, limit: number): MailboxState {
  if (sent >= limit) {return 'full'}
  if (sent >= Math.ceil(limit * MAILBOX_WARN_RATIO)) {return 'warn'}
  return 'ok'
}

// ─── Owner rule ──────────────────────────────────────────────────────────────

export interface OwnerRuleIds {
  faizan: string | null
  va: string | null
}

// Creators who do sponsorships or have 100K+ subscribers → Faizan, other
// creators → VA, brands → Faizan.
export function suggestOwner(
  leadType: LeadType,
  lead: { does_sponsorships?: boolean | null; subscribers?: number | null },
  ids: OwnerRuleIds,
): string | null {
  if (leadType === 'brand') {return ids.faizan}
  if (lead.does_sponsorships === true || (lead.subscribers ?? 0) >= OWNER_RULE_SUBSCRIBERS) {
    return ids.faizan
  }
  return ids.va
}

// ─── Value parsing ───────────────────────────────────────────────────────────

// "5,076" → 5076, "5k" → 5000, "1.2M" → 1200000, "12%" → 12. null if not a number.
export function parseNumber(v: unknown): number | null {
  if (typeof v === 'number') {return Number.isFinite(v) ? v : null}
  if (typeof v !== 'string') {return null}
  const s = v.trim().toLowerCase().replace(/[,\s%]/g, '')
  if (!s) {return null}
  const m = s.match(/^(-?\d+(?:\.\d+)?)([kmb])?$/)
  if (!m) {return null}
  const mult = m[2] === 'k' ? 1e3 : m[2] === 'm' ? 1e6 : m[2] === 'b' ? 1e9 : 1
  return Number(m[1]) * mult
}

export function parseInteger(v: unknown): number | null {
  const n = parseNumber(v)
  return n === null ? null : Math.round(n)
}

export function parseBool(v: unknown): boolean | null {
  if (typeof v === 'boolean') {return v}
  if (typeof v !== 'string') {return null}
  const s = v.trim().toLowerCase()
  if (['yes', 'y', 'true', '1'].includes(s)) {return true}
  if (['no', 'n', 'false', '0'].includes(s)) {return false}
  return null
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

// RFC 4180: quoted fields, "" escapes, commas and newlines inside quotes,
// CRLF or LF line endings, optional UTF-8 BOM. Blank lines are dropped.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0

  for (; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') {i++}
      row.push(field)
      if (row.some((f) => f !== '')) {rows.push(row)}
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  row.push(field)
  if (row.some((f) => f !== '')) {rows.push(row)}
  return rows
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) {return ''}
  let s = String(v)
  // Spreadsheet formula injection: a leading =, +, - or @ runs as a formula
  // when the export is opened in Excel/Sheets.
  if (/^[=+\-@]/.test(s)) {s = `'${s}`}
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  return [headers.map(csvCell).join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\r\n')
}

// ─── Field validation (edits and manual adds) ────────────────────────────────

export const CREATOR_EDIT_FIELDS = [
  'name', 'platform', 'profile_url', 'country', 'niche', 'subscribers', 'avg_views', 'engagement_pct',
  'does_sponsorships', 'sponsor_brands', 'email', 'instagram', 'x', 'linkedin', 'tiktok', 'website',
  'owner_user_id', 'mailbox_id', 'channel', 'notes', 'source', 'extra',
] as const
export const BRAND_EDIT_FIELDS = [
  'company', 'website', 'domain', 'country', 'product', 'team_size', 'why_them', 'score', 'contact_name',
  'role', 'email', 'linkedin', 'owner_user_id', 'mailbox_id', 'channel', 'notes', 'source', 'extra',
] as const

export function editableFields(leadType: LeadType): readonly string[] {
  return leadType === 'creator' ? CREATOR_EDIT_FIELDS : BRAND_EDIT_FIELDS
}

type FieldKind = 'text' | 'email' | 'url' | 'social' | 'domain' | 'int' | 'number' | 'bool' | 'channel' | 'id' | 'extra'

const FIELD_KINDS: Record<string, FieldKind> = {
  email: 'email',
  profile_url: 'url', website: 'url', linkedin: 'url',
  instagram: 'social', x: 'social', tiktok: 'social',
  domain: 'domain',
  subscribers: 'int', avg_views: 'int',
  engagement_pct: 'number', score: 'number',
  does_sponsorships: 'bool',
  channel: 'channel',
  owner_user_id: 'id', mailbox_id: 'id',
  extra: 'extra',
}

const TEXT_LIMITS: Record<string, number> = {
  notes: 20000, product: 5000, why_them: 5000, sponsor_brands: 5000, platform: 50, team_size: 50,
  country: 100, niche: 100,
}

const SOCIAL_BASE: Record<string, string> = {
  instagram: 'https://instagram.com/',
  x: 'https://x.com/',
  tiktok: 'https://www.tiktok.com/@',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/
const HANDLE_RE = /^@?[A-Za-z0-9._]{1,40}$/

// "acme.io/pricing" → "https://acme.io/pricing". null when it isn't a web
// address (other schemes such as javascript: are refused, not rewritten).
export function withHttps(raw: string): string | null {
  const s = raw.trim()
  if (!s || /\s/.test(s)) {return null}
  let candidate = s
  if (!/^https?:\/\//i.test(s)) {
    if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s)) {return null}
    candidate = `https://${s.replace(/^\/+/, '')}`
  }
  try {
    const u = new URL(candidate)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {return null}
    if (!u.hostname.includes('.')) {return null}
    return candidate
  } catch {
    return null
  }
}

// ─── Profile links (Name cell + Links column) ────────────────────────────────
// Only http(s) links come out of here: withHttps() refuses javascript:,
// data:, mailto: and every other scheme, and anything without a real host.

export type LinkKind = 'youtube' | 'linkedin' | 'x' | 'instagram' | 'tiktok' | 'website'

export const LINK_LABELS: Record<LinkKind, string> = {
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  website: 'Website',
}

export interface LeadLink {
  kind: LinkKind
  url: string
}

// Platform of a URL by its host; anything else is a website.
export function linkKind(url: string): LinkKind {
  let host = ''
  try { host = new URL(url).hostname.toLowerCase().replace(/^(www|m)\./, '') } catch { return 'website' }
  const is = (...domains: string[]) => domains.some((d) => host === d || host.endsWith(`.${d}`))
  if (is('youtube.com', 'youtu.be')) {return 'youtube'}
  if (is('linkedin.com')) {return 'linkedin'}
  if (is('x.com', 'twitter.com')) {return 'x'}
  if (is('instagram.com')) {return 'instagram'}
  if (is('tiktok.com')) {return 'tiktok'}
  return 'website'
}

// Every usable link of a lead, main one first, duplicates removed.
// Creators: profile_url, then youtube (extra), linkedin, x, instagram,
// tiktok, website. Brands: website (or the domain), then linkedin.
export function leadLinks(leadType: LeadType, lead: Record<string, unknown>): LeadLink[] {
  const extra = (lead.extra && typeof lead.extra === 'object' ? lead.extra : {}) as Record<string, unknown>
  const sources: [unknown, LinkKind | null][] = leadType === 'creator'
    ? [
        [lead.profile_url, null],
        [extra.youtube ?? extra.youtube_url, 'youtube'],
        [lead.linkedin, 'linkedin'],
        [lead.x, 'x'],
        [lead.instagram, 'instagram'],
        [lead.tiktok, 'tiktok'],
        [lead.website, null],
      ]
    : [
        [lead.website || lead.domain, null],
        [lead.linkedin, 'linkedin'],
      ]

  const links: LeadLink[] = []
  const seen = new Set<string>()
  for (const [raw, kind] of sources) {
    if (typeof raw !== 'string') {continue}
    const url = withHttps(raw)
    if (!url) {continue}
    const key = normalizeUrl(url) ?? url
    if (seen.has(key)) {continue}
    seen.add(key)
    const detected = linkKind(url)
    links.push({ kind: detected !== 'website' ? detected : kind ?? 'website', url })
  }
  return links
}

export function primaryLink(leadType: LeadType, lead: Record<string, unknown>): LeadLink | null {
  return leadLinks(leadType, lead)[0] ?? null
}

export type FieldResult = { ok: true; value: unknown } | { ok: false; error: string }

function asText(raw: unknown): string | null {
  if (raw === null || raw === undefined) {return null}
  if (typeof raw === 'number' || typeof raw === 'boolean') {return String(raw)}
  if (typeof raw !== 'string') {return null}
  return raw.trim() || null
}

// One field of a lead, as typed in a cell or the edit panel. Empty → null.
export function validateLeadField(field: string, raw: unknown): FieldResult {
  const kind = FIELD_KINDS[field] ?? 'text'

  if (kind === 'extra') {
    if (raw === null || raw === undefined) {return { ok: true, value: {} }}
    if (typeof raw !== 'object' || Array.isArray(raw)) {return { ok: false, error: 'Extra fields must be a list of name/value pairs' }}
    const out: Record<string, string | number | boolean> = {}
    const entries = Object.entries(raw as Record<string, unknown>)
    if (entries.length > 60) {return { ok: false, error: 'Up to 60 extra fields' }}
    for (const [k, v] of entries) {
      const key = headerKey(k)
      if (!key) {return { ok: false, error: `"${k}" is not a valid field name` }}
      if (v === null || v === undefined || v === '') {continue}
      if (typeof v === 'string') {
        if (v.length > 5000) {return { ok: false, error: `${key} is too long` }}
        if (v.trim()) {out[key] = v.trim()}
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        out[key] = v
      } else {
        return { ok: false, error: `${key} must be text, a number or yes/no` }
      }
    }
    return { ok: true, value: out }
  }

  if (kind === 'bool') {
    if (raw === null || raw === undefined || raw === '') {return { ok: true, value: null }}
    const b = parseBool(raw)
    return b === null ? { ok: false, error: 'Choose Yes or No' } : { ok: true, value: b }
  }

  if (kind === 'int' || kind === 'number') {
    if (raw === null || raw === undefined || raw === '') {return { ok: true, value: null }}
    const n = parseNumber(raw)
    if (n === null) {return { ok: false, error: 'Enter a number, like 5076 or 5k' }}
    if (n < 0) {return { ok: false, error: 'Enter 0 or more' }}
    return { ok: true, value: kind === 'int' ? Math.round(n) : n }
  }

  const text = asText(raw)
  if (text === null) {return { ok: true, value: null }}

  switch (kind) {
    case 'email': {
      const e = normalizeEmail(text)
      return e && EMAIL_RE.test(e) && e.length <= 255 ? { ok: true, value: e } : { ok: false, error: 'Enter a valid email address' }
    }
    case 'url': {
      const url = withHttps(text)
      return url && url.length <= 2000 ? { ok: true, value: url } : { ok: false, error: 'Enter a web address, like acme.io or https://acme.io' }
    }
    case 'social': {
      // "@jane" or "jane" → the platform's profile URL
      if (HANDLE_RE.test(text) && (text.startsWith('@') || !text.includes('.'))) {
        return { ok: true, value: `${SOCIAL_BASE[field]}${text.replace(/^@/, '')}` }
      }
      const url = withHttps(text)
      return url && url.length <= 2000 ? { ok: true, value: url } : { ok: false, error: 'Enter a profile URL or an @handle' }
    }
    case 'domain': {
      const d = normalizeDomain(text)
      return d && DOMAIN_RE.test(d) ? { ok: true, value: d } : { ok: false, error: 'Enter a domain, like acme.io' }
    }
    case 'channel':
      return (CHANNELS as readonly string[]).includes(text) ? { ok: true, value: text } : { ok: false, error: 'Pick a channel' }
    case 'id':
      return text.length <= 255 ? { ok: true, value: text } : { ok: false, error: 'Invalid value' }
    default: {
      const max = TEXT_LIMITS[field] ?? 255
      return text.length <= max ? { ok: true, value: text } : { ok: false, error: `Keep it under ${max.toLocaleString('en-US')} characters` }
    }
  }
}

// Validates every key of an edit. Unknown or non-editable keys are errors,
// never silently dropped.
export function validateLeadUpdates(
  leadType: LeadType,
  body: Record<string, unknown>,
): { values: Record<string, unknown>; errors: Record<string, string> } {
  const allowed = editableFields(leadType)
  const values: Record<string, unknown> = {}
  const errors: Record<string, string> = {}
  for (const [field, raw] of Object.entries(body)) {
    if (!allowed.includes(field)) {
      errors[field] = 'This field is not editable'
      continue
    }
    const r = validateLeadField(field, raw)
    if (r.ok) {values[field] = r.value}
    else {errors[field] = r.error}
  }
  return { values, errors }
}

// ─── Import mapping ──────────────────────────────────────────────────────────

export type ImportFileType = 'creators_new' | 'creators_review_new' | 'sponsor_brands_new' | 'yc_brands_new'

export const IMPORT_FILE_TYPES: Record<ImportFileType, { leadType: LeadType; label: string }> = {
  creators_new: { leadType: 'creator', label: 'Creators (new)' },
  creators_review_new: { leadType: 'creator', label: 'Creators (review)' },
  sponsor_brands_new: { leadType: 'brand', label: 'Sponsor brands' },
  yc_brands_new: { leadType: 'brand', label: 'YC brands' },
}

// Longest prefix first, so creators_review_new_ wins over creators_.
export function detectFileType(fileName: string): ImportFileType | null {
  const base = fileName.split(/[\\/]/).pop()?.toLowerCase() ?? ''
  if (!base.endsWith('.csv')) {return null}
  if (base.startsWith('creators_review_new_')) {return 'creators_review_new'}
  if (base.startsWith('creators_new_')) {return 'creators_new'}
  if (base.startsWith('sponsor_brands_new_')) {return 'sponsor_brands_new'}
  if (base.startsWith('yc_brands_new_')) {return 'yc_brands_new'}
  return null
}

// Excel/Numbers/ODS files need saving as CSV first (no spreadsheet library).
export function isSpreadsheetFile(fileName: string): boolean {
  return /\.(xlsx|xlsm|xls|ods|numbers)$/i.test(fileName.trim())
}

// Mapping targets: a lead field, EXTRA (kept in the lead's `extra` JSON
// under the column's name) or '' (ignored). 'notes' is a field too: every
// column mapped to it is appended as "header: value".
export const EXTRA = 'extra'

export const CREATOR_IMPORT_FIELDS = [
  'name', 'platform', 'profile_url', 'country', 'niche', 'subscribers', 'avg_views',
  'engagement_pct', 'does_sponsorships', 'sponsor_brands', 'email', 'instagram', 'x',
  'linkedin', 'tiktok', 'website', 'notes',
] as const
export const BRAND_IMPORT_FIELDS = [
  'company', 'website', 'domain', 'country', 'product', 'team_size', 'why_them', 'score',
  'contact_name', 'role', 'email', 'linkedin', 'notes',
] as const

export type ImportMapping = Record<string, string> // CSV header → field | EXTRA | ''

// Columns ignored on purpose (every import starts at 'found'). The import
// screen says so next to them.
export const IGNORED_COLUMNS: Record<string, string> = {
  status: 'Every import starts at Found',
  status_outreach: 'Every import starts at Found',
}

// Exact names first, then prefixes, since the sheets truncate some headers
// (channel_n…, sponsor_b…). The user can change every mapping on screen.
const DEFAULT_MATCHERS: Record<LeadType, { field: string; exact?: string[]; prefix?: string[] }[]> = {
  creator: [
    { field: 'name', exact: ['name', 'channel_name', 'creator', 'creator_name'], prefix: ['channel_n'] },
    { field: 'profile_url', exact: ['profile_url', 'channel_url', 'url'], prefix: ['channel_u'] },
    { field: 'platform', exact: ['platform'] },
    { field: 'country', exact: ['country'] },
    { field: 'niche', exact: ['niche', 'category'] },
    { field: 'subscribers', exact: ['subscribers', 'followers'], prefix: ['subscriber'] },
    { field: 'avg_views', exact: ['avg_views', 'average_views'], prefix: ['avg_view'] },
    { field: 'engagement_pct', exact: ['engagement_pct', 'engagement'], prefix: ['engagem'] },
    { field: 'does_sponsorships', exact: ['does_sponsorships'], prefix: ['does_spo'] },
    { field: 'sponsor_brands', exact: ['sponsor_brands'], prefix: ['sponsor_b'] },
    { field: 'email', exact: ['email', 'email_address'] },
    { field: 'instagram', exact: ['instagram'], prefix: ['instagr'] },
    { field: 'x', exact: ['x', 'x_twitter', 'twitter'], prefix: ['x_tw'] },
    { field: 'linkedin', exact: ['linkedin'] },
    { field: 'tiktok', exact: ['tiktok'] },
    { field: 'website', exact: ['website'], prefix: ['website'] },
    {
      field: EXTRA,
      exact: ['date_found', 'found_by', 'views_to_subs', 'days_since_last_upload', 'recent_video', 'recent_videos'],
      prefix: ['views_to', 'days_sinc', 'uploads_', 'recent_vi', 'date_fou', 'found_b'],
    },
  ],
  brand: [
    { field: 'company', exact: ['company', 'name', 'company_name', 'sponsor_name', 'sponsor_label', 'brand'], prefix: ['sponsor_l', 'sponsor_n'] },
    { field: 'website', exact: ['website', 'url'] },
    { field: 'domain', exact: ['domain'] },
    { field: 'country', exact: ['country'] },
    { field: 'product', exact: ['product', 'one_liner', 'description'], prefix: ['one_lin'] },
    { field: 'team_size', exact: ['team_size'], prefix: ['team_s'] },
    { field: 'why_them', exact: ['why_them', 'evidence'] },
    { field: 'score', exact: ['score'] },
    { field: 'contact_name', exact: ['contact_name', 'contact'] },
    { field: 'role', exact: ['role', 'title'] },
    { field: 'email', exact: ['email'] },
    { field: 'linkedin', exact: ['linkedin'] },
    {
      // outreach_brands has no niche/category column, so industry goes here.
      field: EXTRA,
      exact: ['batch', 'batch_year', 'locations', 'industry', 'tags', 'is_hiring', 'yc_url', 'creators', 'creators_count',
        'first_seen', 'sponsors_creators', 'sponsor_creators'],
      prefix: ['creators_c', 'example_', 'sponsors_', 'sponsor_c'],
    },
  ],
}

export function headerKey(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export function defaultMapping(leadType: LeadType, headers: string[]): ImportMapping {
  const mapping: ImportMapping = {}
  const taken = new Set<string>()
  const matchers = DEFAULT_MATCHERS[leadType]
  for (const h of headers) {
    if (IGNORED_COLUMNS[headerKey(h)]) {mapping[h] = ''}
  }
  // Exact matches first across all headers, then prefixes, so a prefix never
  // steals a field an exact header claims later in the row.
  for (const pass of ['exact', 'prefix'] as const) {
    for (const h of headers) {
      if (mapping[h] !== undefined) {continue}
      const key = headerKey(h)
      const m = matchers.find((mm) =>
        pass === 'exact' ? mm.exact?.includes(key) : mm.prefix?.some((p) => key.startsWith(p)),
      )
      if (!m) {continue}
      const multi = m.field === 'notes' || m.field === EXTRA
      if (!multi && taken.has(m.field)) {continue}
      mapping[h] = m.field
      taken.add(m.field)
    }
  }
  for (const h of headers) {
    if (mapping[h] === undefined) {mapping[h] = ''}
  }
  return mapping
}

// "San Francisco, CA, USA; Remote" → "USA"
export function countryFromLocations(v: unknown): string | null {
  if (typeof v !== 'string') {return null}
  const first = v.split(/[;|\n]/)[0]?.trim()
  if (!first) {return null}
  const parts = first.split(',').map((s) => s.trim()).filter(Boolean)
  return parts[parts.length - 1] ?? null
}

function truthyFlag(v: unknown): boolean {
  if (v === null || v === undefined) {return false}
  const b = parseBool(v)
  if (b !== null) {return b}
  const n = parseNumber(v)
  if (n !== null) {return n > 0}
  return typeof v === 'string' && v.trim() !== ''
}

// why_them for a brand row with none: "YC W24, hiring, sponsors creators".
export function buildWhyThem(extra: Record<string, unknown>, fileType?: ImportFileType | null): string | null {
  const parts: string[] = []
  const batch = typeof extra.batch === 'string' ? extra.batch.trim() : ''
  if (batch) {parts.push(fileType === 'yc_brands_new' || extra.yc_url ? `YC ${batch}` : batch)}
  if (truthyFlag(extra.is_hiring)) {parts.push('hiring')}
  if (truthyFlag(extra.sponsors_creators) || truthyFlag(extra.sponsor_creators)) {parts.push('sponsors creators')}
  return parts.length > 0 ? parts.join(', ') : null
}

export type ImportValue = string | number | boolean | null
export type ImportLead = {
  _row: number
  extra?: Record<string, string>
  [field: string]: ImportValue | Record<string, string> | undefined
}

export interface MappedRow {
  lead: ImportLead
  errors: string[]
}

const NUMBER_FIELDS = new Set(['subscribers', 'avg_views', 'engagement_pct', 'score'])
const INTEGER_FIELDS = new Set(['subscribers', 'avg_views'])
const BOOL_FIELDS = new Set(['does_sponsorships'])

// Turns one CSV row into a typed lead using the mapping. _row is the
// 1-based line number in the file (header = line 1).
export function mapRow(
  leadType: LeadType,
  headers: string[],
  cells: string[],
  mapping: ImportMapping,
  rowNumber: number,
  defaults: { platform?: string; fileType?: ImportFileType | null } = {},
): MappedRow {
  const lead: ImportLead = { _row: rowNumber }
  const extra: Record<string, string> = {}
  const errors: string[] = []
  const notes: string[] = []

  headers.forEach((h, idx) => {
    const field = mapping[h]
    const raw = (cells[idx] ?? '').trim()
    if (!field || !raw) {return}
    if (field === EXTRA) {
      const key = headerKey(h)
      if (key) {extra[key] = raw}
      return
    }
    if (field === 'notes') {
      notes.push(`${h}: ${raw}`)
      return
    }
    if (BOOL_FIELDS.has(field)) {
      const b = parseBool(raw)
      if (b === null) {errors.push(`${h}: "${raw}" is not Yes or No`)}
      else {lead[field] = b}
      return
    }
    if (NUMBER_FIELDS.has(field)) {
      const n = INTEGER_FIELDS.has(field) ? parseInteger(raw) : parseNumber(raw)
      if (n === null) {errors.push(`${h}: "${raw}" is not a number`)}
      else {lead[field] = n}
      return
    }
    lead[field] = raw
  })

  if (notes.length > 0) {lead.notes = notes.join('\n')}
  if (Object.keys(extra).length > 0) {lead.extra = extra}
  if (leadType === 'creator' && !lead.platform && defaults.platform) {lead.platform = defaults.platform}

  if (typeof lead.email === 'string') {
    const e = normalizeEmail(lead.email)
    if (!e || !EMAIL_RE.test(e)) {errors.push(`email: "${lead.email}" is not a valid address`)}
  }

  if (leadType === 'creator') {
    if (!lead.name && !lead.profile_url) {errors.push('Needs a name or a profile URL')}
    if (!lead.profile_url && !lead.email) {errors.push('Needs a profile URL or an email to check for duplicates')}
  } else {
    if (!lead.company && !lead.domain && !lead.website) {errors.push('Needs a company, domain or website')}
    if (!lead.domain && !lead.website && !lead.email) {errors.push('Needs a domain, website or email to check for duplicates')}
    if (!lead.company) {
      const d = normalizeDomain(lead.domain ?? lead.website)
      if (d) {lead.company = d}
    }
    if (!lead.country) {
      const c = countryFromLocations(extra.locations)
      if (c) {lead.country = c}
    }
    if (!lead.why_them) {
      const why = buildWhyThem(extra, defaults.fileType)
      if (why) {lead.why_them = why}
    }
  }

  return { lead, errors }
}

// ─── Rolling mailbox window ──────────────────────────────────────────────────
// A send counts against its mailbox for N hours after it was logged (an
// admin setting, outreach_settings.mailbox_window_hours). Mirrors
// outreach_mailbox_window_hours(): anything unreadable or out of range → 15.

export const MAILBOX_WINDOW_DEFAULT = 15
export const MAILBOX_WINDOW_MIN = 12
export const MAILBOX_WINDOW_MAX = 24

export function mailboxWindowHours(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) && n >= MAILBOX_WINDOW_MIN && n <= MAILBOX_WINDOW_MAX ? Math.round(n) : MAILBOX_WINDOW_DEFAULT
}

// "14:05" in Karachi time (UTC+5, no DST) for an ISO timestamp.
export function karachiClock(iso: string | null | undefined): string | null {
  if (!iso) {return null}
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) {return null}
  const d = new Date(t + 5 * 3600_000)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "14:05" today, "6 Nov 14:05" on another day (Karachi).
export function karachiSlotLabel(iso: string | null | undefined, now: Date = new Date()): string | null {
  const clock = karachiClock(iso)
  if (!clock || !iso) {return null}
  const day = karachiToday(new Date(Date.parse(iso)))
  if (day === karachiToday(now)) {return clock}
  const d = new Date(`${day}T00:00:00Z`)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${clock}`
}

// outreach_mailbox_full's DETAIL is "sent/limit/next_free_at" (a Postgres
// timestamptz text, e.g. "2026-11-06 13:21:20.94+05").
export function parseMailboxFullDetail(detail: string | null | undefined): { sent: number; limit: number; nextFreeAt: string | null } | null {
  if (!detail) {return null}
  const [sent, limit, ...rest] = detail.split('/')
  const s = Number(sent)
  const l = Number(limit)
  if (!Number.isFinite(s) || !Number.isFinite(l)) {return null}
  const at = rest.join('/').trim()
  if (!at) {return { sent: s, limit: l, nextFreeAt: null }}
  const t = Date.parse(at.replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'))
  return { sent: s, limit: l, nextFreeAt: Number.isFinite(t) ? new Date(t).toISOString() : null }
}

// ─── Lists ───────────────────────────────────────────────────────────────────
// Which list a lead came from. Mirrors outreach_list_from_source().

export const BRAND_LISTS = ['yc', 'sponsor', 'apollo', 'manual'] as const
export const CREATOR_LISTS = ['creators_new', 'creators_review', 'manual'] as const
export const LIST_LABELS: Record<string, string> = {
  yc: 'YC', sponsor: 'Sponsor', apollo: 'Apollo', manual: 'Manual',
  creators_new: 'Creators (new)', creators_review: 'Creators (review)',
}

export function listsFor(leadType: LeadType): readonly string[] {
  return leadType === 'creator' ? CREATOR_LISTS : BRAND_LISTS
}

export function listFromSource(leadType: LeadType, source: unknown): string {
  const s = typeof source === 'string' ? source.trim().toLowerCase() : ''
  if (leadType === 'brand') {
    if (s.startsWith('yc_brands')) {return 'yc'}
    if (s.startsWith('sponsor_brands')) {return 'sponsor'}
    if (s.startsWith('apollo')) {return 'apollo'}
    return 'manual'
  }
  if (s.startsWith('creators_review')) {return 'creators_review'}
  if (s.startsWith('creators')) {return 'creators_new'}
  return 'manual'
}

// ─── Brand contacts ──────────────────────────────────────────────────────────

export const CONTACT_STATUSES = [
  'found', 'contacted', 'followed_up', 'replied', 'bounced', 'opted_out', 'not_interested', 'no_reply',
] as const
// Brand actions that apply to one contact (call booked / won are brand level).
export const CONTACT_ACTIONS = ['contacted', 'followed_up', 'replied', 'bounced', 'opted_out', 'not_interested'] as const

// The brand's old contact_name, split the same way as the SQL migration.
export function splitName(full: unknown): { first_name: string | null; last_name: string | null } {
  const s = typeof full === 'string' ? full.trim().replace(/\s+/g, ' ') : ''
  if (!s) {return { first_name: null, last_name: null }}
  const i = s.indexOf(' ')
  return i === -1 ? { first_name: s, last_name: null } : { first_name: s.slice(0, i), last_name: s.slice(i + 1) }
}

export function contactName(c: { first_name?: string | null; last_name?: string | null; email?: string | null }): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.email || 'No name'
}

// Mirrors outreach_brand_rollup(): furthest along wins (replied >
// followed_up > contacted); with none of those, an end state beats found;
// call_booked / won stay.
export function brandStatusFromContacts(statuses: string[], current: string): string {
  if (statuses.length === 0 || current === 'call_booked' || current === 'won') {return current}
  for (const s of ['replied', 'followed_up', 'contacted', 'not_interested', 'opted_out', 'bounced', 'no_reply']) {
    if (statuses.includes(s)) {return s}
  }
  return 'found'
}

const CONTACT_TEXT_FIELDS = ['first_name', 'last_name', 'title', 'notes', 'source']

// One contact as typed in the table or the edit panel. partial = an edit.
// Status and dates move through actions, never here.
export function validateContactFields(body: Record<string, unknown>, partial: boolean): { values: Record<string, unknown>; errors: Record<string, string> } {
  const values: Record<string, unknown> = {}
  const errors: Record<string, string> = {}
  for (const [k, raw] of Object.entries(body)) {
    if (CONTACT_TEXT_FIELDS.includes(k)) {
      const t = raw === null || raw === undefined ? '' : typeof raw === 'string' ? raw.trim() : null
      const max = k === 'notes' ? 20000 : 255
      if (t === null) {errors[k] = 'Enter text'}
      else if (t.length > max) {errors[k] = `Keep it under ${max.toLocaleString('en-US')} characters`}
      else {values[k] = t || null}
    } else if (k === 'email' || k === 'linkedin') {
      const r = validateLeadField(k, raw)
      if (r.ok) {values[k] = r.value}
      else {errors[k] = r.error}
    } else if (k === 'is_primary') {
      if (typeof raw !== 'boolean') {errors[k] = 'Choose Yes or No'}
      else {values[k] = raw}
    } else {
      errors[k] = 'This field is not editable'
    }
  }
  if (!partial && !values.first_name && !values.last_name && !values.email && !values.linkedin && Object.keys(errors).length === 0) {
    errors.first_name = 'Add a name, email or LinkedIn'
  }
  return { values, errors }
}

// ─── Apollo contacts import ──────────────────────────────────────────────────
// Detected by headers, not the file name: Company Name, Website, Employes
// size, First Name, Last Name, Tittle, Email, Linkedin (Apollo's own
// spellings). Matched case-insensitively, ignoring spaces and punctuation,
// with one or two typos allowed on longer names.

export const APOLLO_FIELDS = ['company', 'website', 'team_size', 'first_name', 'last_name', 'title', 'email', 'linkedin'] as const
export type ApolloField = (typeof APOLLO_FIELDS)[number]
export const APOLLO_FIELD_LABELS: Record<ApolloField, string> = {
  company: 'Company', website: 'Website (+ domain)', team_size: 'Team size', first_name: 'First name',
  last_name: 'Last name', title: 'Title', email: 'Email', linkedin: 'LinkedIn',
}

const APOLLO_HEADERS: Record<ApolloField, string[]> = {
  company: ['companyname', 'company', 'organization', 'organizationname', 'account'],
  website: ['website', 'companywebsite', 'url', 'domain'],
  team_size: ['employessize', 'employeessize', 'employees', 'employeecount', 'numberofemployees', 'companysize'],
  first_name: ['firstname', 'first'],
  last_name: ['lastname', 'last', 'surname'],
  title: ['tittle', 'title', 'jobtitle', 'position'],
  email: ['email', 'emailaddress', 'workemail'],
  linkedin: ['linkedin', 'linkedinurl', 'personlinkedinurl', 'linkedinprofile'],
}

function squash(h: string): string {
  return h.toLowerCase().replace(/[^a-z]/g, '')
}

// Edits between two strings; a swap of two neighbours counts as one.
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)}
    }
  }
  return d[a.length][b.length]
}

// CSV header → Apollo field ('' when nothing matches). Exact names win,
// then the closest typo; each field is used once.
export function apolloMapping(headers: string[]): Record<string, ApolloField | ''> {
  const out: Record<string, ApolloField | ''> = {}
  const used = new Set<ApolloField>()
  for (const pass of ['exact', 'fuzzy'] as const) {
    for (const h of headers) {
      if (out[h]) {continue}
      const s = squash(h)
      let best: ApolloField | null = null
      let bestD = Infinity
      for (const f of APOLLO_FIELDS) {
        if (used.has(f)) {continue}
        for (const name of APOLLO_HEADERS[f]) {
          const max = pass === 'exact' ? 0 : name.length >= 7 ? 2 : name.length >= 4 ? 1 : 0
          const d = s === name ? 0 : pass === 'exact' ? Infinity : editDistance(s, name)
          if (d <= max && d < bestD) {
            best = f
            bestD = d
          }
        }
      }
      if (best) {
        out[h] = best
        used.add(best)
      } else {
        out[h] = ''
      }
    }
  }
  return out
}

// An Apollo export: company, email and first name, five fields in all.
export function isApolloHeaders(headers: string[]): boolean {
  const fields = new Set(Object.values(apolloMapping(headers)).filter(Boolean))
  return fields.has('company') && fields.has('email') && fields.has('first_name') && fields.size >= 5
}

export interface ApolloRow {
  _row: number
  company: string | null
  website: string | null
  domain: string | null
  team_size: string | null
  first_name: string | null
  last_name: string | null
  title: string | null
  email: string | null
  linkedin: string | null
}

export function mapApolloRow(headers: string[], cells: string[], mapping: Record<string, ApolloField | ''>, rowNumber: number): { row: ApolloRow; errors: string[] } {
  const row: ApolloRow = {
    _row: rowNumber, company: null, website: null, domain: null, team_size: null,
    first_name: null, last_name: null, title: null, email: null, linkedin: null,
  }
  headers.forEach((h, i) => {
    const f = mapping[h]
    const raw = (cells[i] ?? '').trim()
    if (f && raw) {row[f] = raw}
  })
  return cleanApolloRow(row)
}

// Validates one mapped row (in the browser, and again on the server).
export function cleanApolloRow(input: Partial<Record<keyof ApolloRow, unknown>>): { row: ApolloRow; errors: string[] } {
  const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
  const row: ApolloRow = {
    _row: typeof input._row === 'number' ? input._row : 0,
    company: text(input.company, 255), website: text(input.website, 2000), domain: null,
    team_size: text(input.team_size, 50), first_name: text(input.first_name, 255), last_name: text(input.last_name, 255),
    title: text(input.title, 255), email: text(input.email, 255), linkedin: text(input.linkedin, 2000),
  }
  const errors: string[] = []
  if (row.email) {
    const e = validateLeadField('email', row.email)
    if (e.ok) {row.email = e.value as string}
    else {errors.push(`email: "${row.email}" is not a valid address`)}
  }
  if (row.website) {
    const w = validateLeadField('website', row.website)
    if (w.ok) {
      row.website = w.value as string
      row.domain = normalizeDomain(row.website)
    } else {
      errors.push(`website: "${row.website}" is not a web address`)
    }
  }
  if (row.linkedin) {
    const l = validateLeadField('linkedin', row.linkedin)
    if (l.ok) {row.linkedin = l.value as string}
    else {errors.push(`linkedin: "${row.linkedin}" is not a web address`)}
  }
  if (!row.company && !row.domain) {errors.push('Needs a company name or website to find the brand')}
  if (!row.email && !row.linkedin && !row.first_name && !row.last_name) {errors.push('Needs a name, email or LinkedIn for the contact')}
  if (!row.company && row.domain) {row.company = row.domain}
  return { row, errors }
}

// "Previously removed contact of B-0012" / "Previously deleted: C-0123" for a
// duplicate whose holder was removed or deleted; null for a live one.
export function previouslyLabel(d: { lead_id: string; deleted?: boolean; contact_removed?: boolean }): string | null {
  if (d.contact_removed) {return `Previously removed contact of ${d.lead_id}`}
  if (d.deleted) {return `Previously deleted: ${d.lead_id}`}
  return null
}
