import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { undoSchema } from '@/lib/outreach/schemas'
import { getOutreachCaller, mapDbError, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/admin/outreach/actions/undo: { activity_id }. Same user,
// latest action on the lead, within 10 minutes (all checked in SQL).
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const parsed = undoSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase.rpc('outreach_undo_action', {
      p_activity_id: parsed.data.activity_id,
      p_user_id: caller.userId,
    })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status })}
      captureError(error, { route: 'POST /api/admin/outreach/actions/undo' })
      return NextResponse.json({ error: 'Failed to undo' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Undone', result: data })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/actions/undo' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
