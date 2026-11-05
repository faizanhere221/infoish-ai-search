import { createServerSupabase } from '@/lib/db'
import { isCreatorPublic } from '@/lib/creators/visibility'
import type { PlatformId } from '@/utils/constants'
import type { DbLeadType, DbPlatform } from '@/lib/outreach/database'
import { leadTable, type OutreachCaller } from '@/lib/outreach/server'
import type { BrandDbRow, CreatorDbRow } from '@/lib/outreach/types'

type Supabase = ReturnType<typeof createServerSupabase>

// database.ts can't import constants.ts (outreach-check imports it raw), so
// it keeps its own copy of the platform ids. These two lines fail the type
// check the day the lists drift apart.
const _platformsMatch: PlatformId extends DbPlatform ? (DbPlatform extends PlatformId ? true : never) : never = true
void _platformsMatch

export function dbTable(leadType: DbLeadType): 'outreach_creator_db' | 'outreach_brand_db' {
  return leadType === 'creator' ? 'outreach_creator_db' : 'outreach_brand_db'
}

// Rates, budgets and the rating are internal. The rating is admin only on
// top of that: members never receive it.
export function forCaller<T extends { quality_rating?: number | null }>(row: T, caller: OutreachCaller): T {
  if (caller.isAdmin) {return row}
  const rest = { ...row }
  delete rest.quality_rating
  return rest
}

// Lead ids (of `ids`) that are in the Database right now.
export async function dbMembership(supabase: Supabase, leadType: DbLeadType, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) {return new Set()}
  const { data, error } = await supabase.from(dbTable(leadType)).select('lead_id').in('lead_id', ids).is('removed_at', null)
  if (error) {throw error}
  return new Set((data ?? []).map((r) => r.lead_id as string))
}

// Adds `in_db` to each lead of a page (the leads tables' "DB" badge).
export async function withDbFlags<T extends { lead_id: string }>(supabase: Supabase, leadType: DbLeadType, leads: T[]): Promise<(T & { in_db: boolean })[]> {
  const inDb = await dbMembership(supabase, leadType, leads.map((l) => l.lead_id))
  return leads.map((l) => ({ ...l, in_db: inDb.has(l.lead_id) }))
}

// "On Infoishai": the lead's normalised email matches a creator account
// whose public profile is live. Read-only, nothing is merged. Emails are
// stored lowercase on signup and email_norm is lowercase + trimmed.
export async function infoishaiProfiles(supabase: Supabase, emails: (string | null)[]): Promise<Map<string, string>> {
  const wanted = [...new Set(emails.filter((e): e is string => !!e))]
  const out = new Map<string, string>()
  if (wanted.length === 0) {return out}
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, deleted_at, is_active')
    .eq('user_type', 'creator')
    .in('email', wanted)
  if (error) {throw error}
  if (!users || users.length === 0) {return out}
  const { data: creators, error: cErr } = await supabase
    .from('creators')
    .select('user_id, username, hidden_from_marketplace')
    .in('user_id', users.map((u) => u.id as string))
  if (cErr) {throw cErr}
  const byUser = new Map((creators ?? []).map((c) => [c.user_id as string, c]))
  for (const u of users) {
    const c = byUser.get(u.id as string)
    if (c?.username && isCreatorPublic(u as { deleted_at: string | null; is_active: boolean }, c as { hidden_from_marketplace: boolean })) {
      out.set(String(u.email).trim().toLowerCase(), c.username as string)
    }
  }
  return out
}

export interface SearchResult<T> {
  total: number
  rows: T[]
}

type RawCreatorRow = Omit<CreatorDbRow, 'on_infoishai'> & { email_norm: string | null }

export async function searchCreatorDb(
  supabase: Supabase,
  caller: OutreachCaller,
  filters: Record<string, unknown>,
  limit: number,
  offset: number,
): Promise<SearchResult<CreatorDbRow>> {
  const { data, error } = await supabase.rpc('outreach_db_creator_search', { p: filters, p_limit: limit, p_offset: offset })
  if (error) {throw error}
  const result = (data ?? { total: 0, rows: [] }) as SearchResult<RawCreatorRow>
  const profiles = await infoishaiProfiles(supabase, result.rows.map((r) => r.email_norm))
  return {
    total: Number(result.total ?? 0),
    rows: result.rows.map((r) => {
      const { email_norm, ...rest } = r
      return forCaller({ ...rest, on_infoishai: email_norm ? profiles.get(email_norm) ?? null : null }, caller)
    }),
  }
}

export async function searchBrandDb(
  supabase: Supabase,
  filters: Record<string, unknown>,
  limit: number,
  offset: number,
): Promise<SearchResult<BrandDbRow>> {
  const { data, error } = await supabase.rpc('outreach_db_brand_search', { p: filters, p_limit: limit, p_offset: offset })
  if (error) {throw error}
  const result = (data ?? { total: 0, rows: [] }) as SearchResult<BrandDbRow>
  return { total: Number(result.total ?? 0), rows: result.rows ?? [] }
}

// Distinct tags in use (creator filter dropdown).
export async function creatorDbTags(supabase: Supabase): Promise<string[]> {
  const { data, error } = await supabase.from('outreach_creator_db').select('tags').is('removed_at', null).limit(1000)
  if (error) {throw error}
  const tags = new Map<string, string>()
  for (const r of data ?? []) {
    for (const t of (r.tags as string[] | null) ?? []) {
      if (!tags.has(t.toLowerCase())) {tags.set(t.toLowerCase(), t)}
    }
  }
  return [...tags.values()].sort((a, b) => a.localeCompare(b))
}

export interface DbEntry {
  lead: Record<string, unknown>
  entry: Record<string, unknown> | null // null: the lead isn't in the Database (or was removed)
  removed: boolean
}

// The lead plus its Database row. Deleted leads come back as null (404).
export async function loadDbEntry(supabase: Supabase, leadType: DbLeadType, leadId: string): Promise<DbEntry | null> {
  const { data: lead, error } = await supabase.from(leadTable(leadType)).select('*').eq('lead_id', leadId).maybeSingle()
  if (error) {throw error}
  if (!lead || lead.deleted_at) {return null}
  const { data: entry, error: eErr } = await supabase.from(dbTable(leadType)).select('*').eq('lead_id', leadId).maybeSingle()
  if (eErr) {throw eErr}
  return { lead, entry: entry && !entry.removed_at ? entry : null, removed: !!entry?.removed_at }
}

