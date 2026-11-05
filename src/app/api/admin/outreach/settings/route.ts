import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'
import { MAILBOX_WINDOW_MAX, MAILBOX_WINDOW_MIN, mailboxWindowHours } from '@/lib/outreach/rules'
import { isMissingSchema, NEEDS_MIGRATION } from '@/lib/outreach/schema'
import { adminOnly, getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const patchSchema = z.object({
  mailbox_window_hours: z.number().int().min(MAILBOX_WINDOW_MIN).max(MAILBOX_WINDOW_MAX),
})

// GET /api/admin/outreach/settings: { mailbox_window_hours } (null before
// outreach_contacts_lists_migration.sql: the limit then resets at Karachi
// midnight).
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase.from('outreach_settings').select('key, value').eq('key', 'mailbox_window_hours').maybeSingle()
    if (error) {
      if (isMissingSchema(error)) {return NextResponse.json({ settings: { mailbox_window_hours: null }, migrated: false })}
      throw error
    }
    return NextResponse.json({ settings: { mailbox_window_hours: mailboxWindowHours(data?.value) }, migrated: true })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/settings' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH (admins): { mailbox_window_hours: 12..24 }. Takes effect on the
// next send: outreach_log_action() reads it every time.
export async function PATCH(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}
  try {
    const parsed = patchSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Pick ${MAILBOX_WINDOW_MIN} to ${MAILBOX_WINDOW_MAX} hours`, fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const hours = parsed.data.mailbox_window_hours
    const supabase = createServerSupabase()
    const { error } = await supabase
      .from('outreach_settings')
      .upsert({ key: 'mailbox_window_hours', value: hours, updated_by: caller.userId, updated_at: new Date().toISOString() })
    if (error) {
      if (isMissingSchema(error)) {return NextResponse.json(NEEDS_MIGRATION, { status: 409 })}
      throw error
    }
    void logActivity({
      userId: caller.userId,
      action: 'outreach_settings_changed',
      entityType: 'outreach_settings',
      details: { mailbox_window_hours: hours },
    })
    return NextResponse.json({ message: `A send now counts for ${hours} hours`, settings: { mailbox_window_hours: hours } })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/outreach/settings' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
