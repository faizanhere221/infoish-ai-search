import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { emailDomain, listsFor, type LeadType } from '@/lib/outreach/rules'
import type { DuplicateMatch, OutreachLead, OutreachTeamMember } from '@/lib/outreach/types'

type Supabase = ReturnType<typeof createServerSupabase>

// ─── Caller / permissions ────────────────────────────────────────────────────
// middleware.ts only lets admin, super_admin and outreach tokens reach
// /api/admin/outreach/*. Inside the section:
//   outreach      view + edit leads, log actions, import
//   admin         + delete/restore, bulk changes, mailboxes, targets, DNC, erase
//   super_admin   + add team members

export interface OutreachCaller {
  userId: string
  role: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export function getOutreachCaller(request: NextRequest): OutreachCaller | null {
  const userId = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role') ?? ''
  if (!userId || !['admin', 'super_admin', 'outreach'].includes(role)) {return null}
  return {
    userId,
    role,
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
  }
}

export const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
export const adminOnly = () => NextResponse.json({ error: 'Admin access required' }, { status: 403 })
export const superAdminOnly = () => NextResponse.json({ error: 'Super admin only' }, { status: 403 })

export function leadTable(leadType: LeadType): 'outreach_creators' | 'outreach_brands' {
  return leadType === 'creator' ? 'outreach_creators' : 'outreach_brands'
}

export function parseLeadType(v: string | null): LeadType | null {
  return v === 'creator' || v === 'brand' ? v : null
}

// URL segment (/leads/creators, /leads/brands) → lead type
export function leadTypeFromSegment(segment: string): LeadType | null {
  if (segment === 'creators') {return 'creator'}
  if (segment === 'brands') {return 'brand'}
  return null
}

export function leadTypeFromId(leadId: string): LeadType | null {
  if (/^C-\d+$/.test(leadId)) {return 'creator'}
  if (/^B-\d+$/.test(leadId)) {return 'brand'}
  return null
}

// ─── RPC / trigger errors ────────────────────────────────────────────────────
// The SQL functions raise short codes as the error message (see the
// migration). Map them to user-facing text here, in one place.

const RPC_ERRORS: Record<string, [number, string]> = {
  outreach_bad_action: [400, 'This action does not apply to this lead.'],
  outreach_not_found: [404, 'Lead not found.'],
  outreach_dnc: [409, 'This lead is on the do-not-contact list.'],
  outreach_not_contacted: [409, 'Mark the lead as contacted before you log a follow-up.'],
  outreach_mailbox_required: [400, 'Pick a mailbox for email outreach.'],
  outreach_mailbox_inactive: [409, 'This mailbox is paused or no longer exists.'],
  outreach_mailbox_full: [409, 'This mailbox reached its daily limit. Use another mailbox or wait until tomorrow.'],
  outreach_undo_not_yours: [403, 'Only the person who logged an action undoes it.'],
  outreach_undo_done: [409, 'This action is already undone.'],
  outreach_undo_expired: [409, 'Undo is available for 10 minutes after an action.'],
  outreach_undo_not_latest: [409, 'A newer action exists on this lead. Only the latest action is undone.'],
  outreach_undo_unsupported: [409, 'This action has no undo.'],
  outreach_import_too_large: [400, 'Import up to 5,000 rows at a time.'],
  outreach_bad_field: [400, 'This field is not editable.'],
  outreach_deleted: [409, 'This lead was deleted. An admin restores it from the Deleted filter first.'],
  outreach_too_many: [400, 'Send up to 1,000 leads at a time.'],
  outreach_db_not_found: [404, 'This lead is not in the Database.'],
  outreach_contact_required: [409, 'Pick which contact this was. Every contact of this brand is past this step.'],
  outreach_contact_not_found: [404, 'Contact not found. Reload the page.'],
  outreach_db_item_not_found: [404, 'This row no longer exists. Reload the page.'],
}

export interface MappedDbError {
  status: number
  message: string
  code: string | null
  detail: string | null
}

export function mapDbError(error: { message?: string; code?: string; details?: string } | null): MappedDbError | null {
  if (!error) {return null}
  const known = error.message ? RPC_ERRORS[error.message] : undefined
  if (known) {
    return { status: known[0], message: known[1], code: error.message ?? null, detail: error.details ?? null }
  }
  // A CHECK constraint: the API validates first, so this is a value the
  // validators missed. Still the caller's input, not a server fault.
  if (error.code === '23514') {
    return { status: 400, message: 'A value is out of range. Check the fields and try again.', code: 'outreach_check', detail: null }
  }
  if (error.code === '23505' || error.message === 'outreach_duplicate') {
    return { status: 409, message: 'A lead with this email, URL or domain already exists.', code: 'outreach_duplicate', detail: error.details ?? null }
  }
  return null
}

// ─── Team ────────────────────────────────────────────────────────────────────

export async function loadTeam(supabase: Supabase): Promise<OutreachTeamMember[]> {
  const { data: team, error } = await supabase
    .from('outreach_team')
    .select('user_id, display_name, works_saturday, creators_monthly_target, brands_monthly_target, dm_daily_warning, is_active')
    .order('display_name')
  if (error) {throw error}
  const ids = (team ?? []).map((t) => t.user_id as string)
  if (ids.length === 0) {return []}
  const { data: users, error: usersError } = await supabase.from('users').select('id, email, role').in('id', ids)
  if (usersError) {throw usersError}
  const byId = new Map((users ?? []).map((u) => [u.id as string, u]))
  return (team ?? []).map((t) => ({
    ...(t as Omit<OutreachTeamMember, 'email' | 'role'>),
    email: (byId.get(t.user_id)?.email as string) ?? '',
    role: (byId.get(t.user_id)?.role as string) ?? '',
  }))
}

export function teamNameMap(team: OutreachTeamMember[]): Map<string, string> {
  return new Map(team.map((t) => [t.user_id, t.display_name]))
}

// ─── Duplicates / DNC ────────────────────────────────────────────────────────

export interface KeyMatches {
  // "type:value" → existing lead holding that key
  duplicates: Map<string, DuplicateMatch>
  // "type:value" of every DNC entry hit
  dnc: Set<string>
}

// One SQL call (outreach_match_keys) for any number of keys.
export async function matchKeys(supabase: Supabase, keys: { type: string; value: string }[]): Promise<KeyMatches> {
  const result: KeyMatches = { duplicates: new Map(), dnc: new Set() }
  const values = [...new Set(keys.map((k) => k.value))]
  if (values.length === 0) {return result}

  const { data, error } = await supabase.rpc('outreach_match_keys', { p_values: values })
  if (error) {throw error}
  const payload = (data ?? {}) as {
    leads?: { key_type: string; key_value: string; lead_type: LeadType; lead_id: string; owner_user_id: string | null; status: string | null; deleted?: boolean }[]
    dnc?: { key_type: string; key_value: string }[]
  }

  const wanted = new Set(keys.map((k) => `${k.type}:${k.value}`))
  const leads = (payload.leads ?? []).filter((h) => wanted.has(`${h.key_type}:${h.key_value}`))
  const names = leads.length > 0 ? teamNameMap(await loadTeam(supabase)) : new Map<string, string>()
  for (const h of leads) {
    result.duplicates.set(`${h.key_type}:${h.key_value}`, {
      key_type: h.key_type,
      key_value: h.key_value,
      lead_type: h.lead_type,
      lead_id: h.lead_id,
      owner_name: h.owner_user_id ? names.get(h.owner_user_id) ?? null : null,
      status: h.status,
      deleted: h.deleted === true,
    })
  }
  for (const d of payload.dnc ?? []) {
    if (wanted.has(`${d.key_type}:${d.key_value}`)) {result.dnc.add(`${d.key_type}:${d.key_value}`)}
  }
  return result
}

export async function findDuplicates(supabase: Supabase, keys: { type: string; value: string }[]): Promise<Map<string, DuplicateMatch>> {
  return (await matchKeys(supabase, keys)).duplicates
}

export async function findDncHits(supabase: Supabase, keys: { type: string; value: string }[]): Promise<Set<string>> {
  return (await matchKeys(supabase, keys)).dnc
}

// The DNC keys of a stored lead: its normalised columns plus its email domain.
export function storedLeadDncKeys(lead: Partial<OutreachLead>): { type: string; value: string }[] {
  const keys: { type: string; value: string }[] = []
  const l = lead as Record<string, unknown>
  if (typeof l.email_norm === 'string') {
    keys.push({ type: 'email', value: l.email_norm })
    const d = emailDomain(l.email_norm)
    if (d) {keys.push({ type: 'domain', value: d })}
  }
  if (typeof l.profile_url_norm === 'string') {keys.push({ type: 'profile_url', value: l.profile_url_norm })}
  if (typeof l.domain_norm === 'string') {keys.push({ type: 'domain', value: l.domain_norm })}
  return keys
}

// Adds `dnc: true|false` to each lead of a page.
export async function withDncFlags<T extends Partial<OutreachLead>>(supabase: Supabase, leads: T[]): Promise<(T & { dnc: boolean })[]> {
  const keysByLead = leads.map((l) => storedLeadDncKeys(l))
  const hits = await findDncHits(supabase, keysByLead.flat())
  return leads.map((l, i) => ({ ...l, dnc: keysByLead[i].some((k) => hits.has(`${k.type}:${k.value}`)) }))
}

// ─── Lead list filters (tables + CSV export) ─────────────────────────────────

export interface LeadFilters {
  owner: string | null // user id, 'none', or null for everyone
  status: string[]
  country: string | null
  niche: string | null
  platform: string | null
  channel: string | null
  missingEmail: boolean
  deleted: boolean // true: only deleted leads (admin "Deleted" filter); false: deleted leads hidden
  list: string | null // needs the contacts/lists migration; routes clear it before then
  q: string | null
  sort: string
  dir: 'asc' | 'desc'
}

const SORTABLE: Record<LeadType, string[]> = {
  creator: ['lead_id', 'name', 'platform', 'country', 'niche', 'subscribers', 'avg_views', 'engagement_pct', 'status', 'date_contacted', 'follow_up_date', 'created_at', 'updated_at'],
  brand: ['lead_id', 'company', 'country', 'score', 'team_size', 'status', 'date_contacted', 'follow_up_date', 'created_at', 'updated_at'],
}

const SEARCH_COLUMNS: Record<LeadType, string[]> = {
  creator: ['lead_id', 'name', 'email', 'profile_url', 'sponsor_brands', 'notes', 'extra_text'],
  brand: ['lead_id', 'company', 'domain', 'email', 'contact_name', 'product', 'why_them', 'notes', 'extra_text'],
}

export function parseLeadFilters(leadType: LeadType, params: URLSearchParams, callerId: string): LeadFilters {
  const owner = params.get('owner')
  const sort = params.get('sort') ?? 'created_at'
  return {
    owner: owner === 'me' ? callerId : owner || null,
    status: (params.get('status') ?? '').split(',').filter(Boolean),
    country: params.get('country') || null,
    niche: leadType === 'creator' ? params.get('niche') || null : null,
    platform: leadType === 'creator' ? params.get('platform') || null : null,
    channel: params.get('channel') || null,
    missingEmail: params.get('missing') === 'email',
    deleted: params.get('deleted') === '1',
    list: (listsFor(leadType) as readonly string[]).includes(params.get('list') ?? '') ? params.get('list') : null,
    // PostgREST's or() syntax treats , ( ) as separators; strip them and the
    // ilike wildcards so a search term can't change the filter itself.
    q: (params.get('q') ?? '').replace(/[,()%*\\"]/g, ' ').trim().slice(0, 100) || null,
    sort: SORTABLE[leadType].includes(sort) ? sort : 'created_at',
    dir: params.get('dir') === 'asc' ? 'asc' : 'desc',
  }
}

export function leadListQuery(
  supabase: Supabase,
  leadType: LeadType,
  f: LeadFilters,
  // true: rows + count, 'head': count only, 'ids': lead ids only
  mode: boolean | 'head' | 'ids',
) {
  let query = supabase.from(leadTable(leadType)).select(
    mode === 'head' || mode === 'ids' ? 'lead_id' : '*',
    mode === true || mode === 'head' ? { count: 'exact', head: mode === 'head' } : undefined,
  )
  if (f.owner === 'none') {query = query.is('owner_user_id', null)}
  else if (f.owner) {query = query.eq('owner_user_id', f.owner)}
  if (f.status.length > 0) {query = query.in('status', f.status)}
  if (f.country) {query = query.ilike('country', f.country)}
  if (f.niche) {query = query.ilike('niche', f.niche)}
  if (f.platform) {query = query.ilike('platform', f.platform)}
  if (f.channel) {query = query.eq('channel', f.channel)}
  if (f.missingEmail) {query = query.is('email', null)}
  if (f.list) {query = query.eq('list', f.list)}
  query = f.deleted ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null)
  if (f.q) {
    const term = f.q
    query = query.or(SEARCH_COLUMNS[leadType].map((c) => `${c}.ilike.%${term}%`).join(','))
  }
  return query
    .order(f.sort, { ascending: f.dir === 'asc', nullsFirst: false })
    .order('lead_id', { ascending: true })
}

export interface FilterValues {
  countries: string[]
  niches: string[]
  platforms: string[]
}

// Distinct values for the filter dropdowns (SQL, so it sees every row).
export async function filterValues(supabase: Supabase, leadType: LeadType): Promise<FilterValues> {
  const { data, error } = await supabase.rpc('outreach_filter_values')
  if (error) {throw error}
  const v = (data ?? {}) as Record<string, string[]>
  return leadType === 'creator'
    ? { countries: v.creator_countries ?? [], niches: v.creator_niches ?? [], platforms: v.creator_platforms ?? [] }
    : { countries: v.brand_countries ?? [], niches: [], platforms: [] }
}

// Pages through a query 1,000 rows at a time (PostgREST's response cap).
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
  max: number,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await page(from, Math.min(from + 999, max - 1))
    if (error) {throw error}
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) {break}
  }
  return rows
}
