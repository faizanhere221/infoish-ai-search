import { createServerSupabase } from '@/lib/db'
import { isMissingSchema } from '@/lib/outreach/schema'

type Supabase = ReturnType<typeof createServerSupabase>

// Outreach data retention: the rules the Privacy Policy promises, run daily
// by outreach_retention() (supabase/outreach_retention_migration.sql) from
// /api/cron/daily-summary. The SQL is the source of truth; these mirror its
// constants for the docs and logs. Change both together.
export const RETENTION_YOUTUBE_DAYS = 28 // YouTube API data cleared (YouTube's rule: 30)
export const RETENTION_NO_CONTACT_MONTHS = 12 // lead deleted after this long with no contact
export const RETENTION_SOFT_DELETED_DAYS = 30 // soft-deleted lead / removed contact deleted for good

export interface RetentionCounts {
  dry_run: boolean
  creators: {
    youtube_cleared: number
    youtube_deleted: number
    stale_deleted: number
    soft_deleted_deleted: number
  }
  brands: {
    youtube_cleared: number
    stale_deleted: number
    soft_deleted_deleted: number
    contacts_stale_deleted: number
    contacts_removed_deleted: number
  }
  dnc_entries_kept: number
}

export type RetentionResult =
  | { ok: true; counts: RetentionCounts }
  | { ok: false; reason: 'needs_migration' | 'failed'; error?: unknown }

// The job changes data only when OUTREACH_RETENTION_LIVE=1. Anything else
// is a dry run: counts what it would do, writes nothing.
export function retentionIsLive(): boolean {
  return process.env.OUTREACH_RETENTION_LIVE === '1'
}

export async function runOutreachRetention(supabase: Supabase, dryRun: boolean): Promise<RetentionResult> {
  const { data, error } = await supabase.rpc('outreach_retention', { p_dry_run: dryRun })
  if (error) {
    return { ok: false, reason: isMissingSchema(error) ? 'needs_migration' : 'failed', error }
  }
  return { ok: true, counts: data as RetentionCounts }
}

// One line for logs: "dry run: creators 12 cleared, 30 deleted (YouTube) ..."
export function retentionSummary(c: RetentionCounts): string {
  return [
    c.dry_run ? 'dry run' : 'live',
    `creators: YouTube data cleared ${c.creators.youtube_cleared}, deleted (YouTube, never contacted) ${c.creators.youtube_deleted}, ` +
      `deleted (no contact ${RETENTION_NO_CONTACT_MONTHS} months) ${c.creators.stale_deleted}, deleted (soft-deleted ${RETENTION_SOFT_DELETED_DAYS}+ days) ${c.creators.soft_deleted_deleted}`,
    `brands: YouTube data cleared ${c.brands.youtube_cleared}, deleted (no contact) ${c.brands.stale_deleted}, ` +
      `deleted (soft-deleted) ${c.brands.soft_deleted_deleted}, contacts deleted (no contact) ${c.brands.contacts_stale_deleted}, ` +
      `contacts deleted (removed) ${c.brands.contacts_removed_deleted}`,
    `do-not-contact entries kept ${c.dnc_entries_kept}`,
  ].join('; ')
}
