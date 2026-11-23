import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-action'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { NEEDS_PURGE_MIGRATION, outreachFeatures } from '@/lib/outreach/schema'
import { getOutreachCaller, mapDbError, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const schema = z.object({
  lead_ids: z.array(z.string().min(1).max(255)).min(1).max(500),
  commit: z.boolean(),
})

export interface PurgeCounts {
  dry_run: boolean
  brands: number
  skipped_not_deleted: number
  contacts: number
  database_entries: number
  keys: number
  activity_unlinked: number
  dnc_blocked: number
}

// POST /api/admin/outreach/leads/brands/purge (super admin): { lead_ids (up
// to 500), commit }. Permanently deletes SOFT-DELETED brands with their
// contacts, keys and Client Database entry, so the same domains and emails
// import again; other ids are skipped. Activity rows stay for the stats,
// unlinked. The do-not-contact list is never touched. commit: false = dry
// run (counts only). outreach_purge_deleted_brands() in
// supabase/outreach_purge_migration.sql.
export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  const route = 'POST /api/admin/outreach/leads/brands/purge'
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  const denied = requireSuperAdmin(request)
  if (denied) {return denied}
  if (params.type !== 'brands') {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const ids = [...new Set(parsed.data.lead_ids)]
    const { commit } = parsed.data

    const supabase = createServerSupabase()
    if (!(await outreachFeatures(supabase)).purge) {return NextResponse.json(NEEDS_PURGE_MIGRATION, { status: 409 })}

    const { data, error } = await supabase.rpc('outreach_purge_deleted_brands', { p_lead_ids: ids, p_dry_run: !commit })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
      captureError(error, { route })
      return NextResponse.json({ error: 'Failed to delete brands' }, { status: 500 })
    }
    const counts = data as PurgeCounts

    if (commit && counts.brands > 0) {
      logAdminAction({
        request, adminId: caller.userId, action: 'outreach_brands_purged', targetType: 'outreach_brands',
        targetId: ids.length === 1 ? ids[0] : `${counts.brands} brands`,
        reason: 'Permanently delete soft-deleted brands (allow re-import)',
        before: { lead_ids: ids },
        after: { ...counts },
      })
    }

    const noun = counts.brands === 1 ? 'brand' : 'brands'
    return NextResponse.json({
      message: commit ? `${counts.brands} ${noun} permanently deleted` : `${counts.brands} ${noun} will be permanently deleted`,
      purge: counts,
    })
  } catch (err) {
    captureError(err, { route })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
