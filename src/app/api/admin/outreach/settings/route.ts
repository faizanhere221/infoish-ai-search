import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'
import {
  ASSIGN_SETTING_KEYS, CLAIM_DAILY_CAP_MAX, claimDailyCap, MAILBOX_WINDOW_MAX, MAILBOX_WINDOW_MIN, mailboxWindowHours, type AssignRule,
} from '@/lib/outreach/rules'
import {
  isMissingSchema, NEEDS_ASSIGNMENT_MIGRATION, NEEDS_CLAIM_MIGRATION, NEEDS_MIGRATION, outreachFeatures,
} from '@/lib/outreach/schema'
import { adminOnly, getOutreachCaller, loadAssignDefaults, loadTeam, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const ownerId = z.string().min(1).max(255).nullable().optional()

const patchSchema = z.object({
  mailbox_window_hours: z.number().int().min(MAILBOX_WINDOW_MIN).max(MAILBOX_WINDOW_MAX).optional(),
  // Default owner rules (user id, or null to switch the rule off).
  assign_priority_creator_owner: ownerId,
  assign_creator_owner: ownerId,
  assign_brand_owner: ownerId,
  assign_interested_owner: ownerId,
  // Leads one member claims per Karachi day (outreach_claim_migration.sql).
  claim_daily_cap: z.number().int().min(1).max(CLAIM_DAILY_CAP_MAX).optional(),
})

// GET /api/admin/outreach/settings: { mailbox_window_hours, assign } (mailbox
// window null before outreach_contacts_lists_migration.sql: the limit then
// resets at Karachi midnight; assign = default owner rules, all null before
// outreach_assignment_migration.sql). `assignment` says whether that ran.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase.from('outreach_settings').select('key, value').eq('key', 'mailbox_window_hours').maybeSingle()
    if (error) {
      if (isMissingSchema(error)) {
        return NextResponse.json({ settings: { mailbox_window_hours: null }, assign: { creator: null, brand: null, interested: null }, migrated: false, assignment: false })
      }
      throw error
    }
    const [assign, features, capRow] = await Promise.all([
      loadAssignDefaults(supabase),
      outreachFeatures(supabase),
      supabase.from('outreach_settings').select('value').eq('key', 'claim_daily_cap').maybeSingle(),
    ])
    return NextResponse.json({
      settings: {
        mailbox_window_hours: mailboxWindowHours(data?.value),
        claim_daily_cap: features.claim ? claimDailyCap(capRow.data?.value) : null,
      },
      assign,
      migrated: true,
      assignment: features.assignment,
      claim: features.claim,
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/settings' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH (admins): { mailbox_window_hours?: 12..24, assign_creator_owner?,
// assign_brand_owner?, assign_interested_owner? }. The mailbox window takes
// effect on the next send (outreach_log_action() reads it every time); the
// owner rules on the next import / Interested status.
export async function PATCH(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}
  try {
    const parsed = patchSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Pick ${MAILBOX_WINDOW_MIN} to ${MAILBOX_WINDOW_MAX} hours, and team members for the owner rules`, fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const supabase = createServerSupabase()
    const now = new Date().toISOString()
    const rows: { key: string; value: unknown; updated_by: string; updated_at: string }[] = []
    // A rule switched off is a deleted row (read back as null): `value` is
    // JSONB NOT NULL, and PostgREST turns a JSON null into SQL NULL.
    const offKeys: string[] = []

    const hours = parsed.data.mailbox_window_hours
    if (hours !== undefined) {rows.push({ key: 'mailbox_window_hours', value: hours, updated_by: caller.userId, updated_at: now })}

    const rules = (Object.keys(ASSIGN_SETTING_KEYS) as AssignRule[]).filter((r) => parsed.data[ASSIGN_SETTING_KEYS[r]] !== undefined)
    if (rules.length > 0) {
      if (!(await outreachFeatures(supabase)).assignment) {return NextResponse.json(NEEDS_ASSIGNMENT_MIGRATION, { status: 409 })}
      const active = new Set((await loadTeam(supabase)).filter((t) => t.is_active).map((t) => t.user_id))
      for (const r of rules) {
        const v = parsed.data[ASSIGN_SETTING_KEYS[r]] ?? null
        if (v && !active.has(v)) {
          return NextResponse.json({ error: 'Pick an active team member for each rule', fields: { [ASSIGN_SETTING_KEYS[r]]: ['Not an active team member'] } }, { status: 400 })
        }
        if (v) {rows.push({ key: ASSIGN_SETTING_KEYS[r], value: v, updated_by: caller.userId, updated_at: now })}
        else {offKeys.push(ASSIGN_SETTING_KEYS[r])}
      }
    }
    const claimCap = parsed.data.claim_daily_cap
    if (claimCap !== undefined) {
      if (!(await outreachFeatures(supabase)).claim) {return NextResponse.json(NEEDS_CLAIM_MIGRATION, { status: 409 })}
      rows.push({ key: 'claim_daily_cap', value: claimCap, updated_by: caller.userId, updated_at: now })
    }
    if (rows.length === 0 && offKeys.length === 0) {return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })}

    if (rows.length > 0) {
      const { error } = await supabase.from('outreach_settings').upsert(rows)
      if (error) {
        if (isMissingSchema(error)) {return NextResponse.json(NEEDS_MIGRATION, { status: 409 })}
        throw error
      }
    }
    if (offKeys.length > 0) {
      const { error } = await supabase.from('outreach_settings').delete().in('key', offKeys)
      if (error) {throw error}
    }
    void logActivity({
      userId: caller.userId,
      action: 'outreach_settings_changed',
      entityType: 'outreach_settings',
      details: { ...Object.fromEntries(rows.map((r) => [r.key, r.value])), ...Object.fromEntries(offKeys.map((k) => [k, null])) },
    })
    const message = hours !== undefined && rules.length === 0 && claimCap === undefined ? `A send now counts for ${hours} hours` : 'Settings saved'
    return NextResponse.json({
      message,
      settings: { mailbox_window_hours: hours ?? null, claim_daily_cap: claimCap ?? null },
      assign: await loadAssignDefaults(supabase),
    })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/outreach/settings' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
