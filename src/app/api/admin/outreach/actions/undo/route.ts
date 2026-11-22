import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import type { LeadType } from '@/lib/outreach/rules'
import { outreachFeatures } from '@/lib/outreach/schema'
import { undoSchema } from '@/lib/outreach/schemas'
import { assignLeads, getOutreachCaller, leadTable, mapDbError, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Supabase = ReturnType<typeof createServerSupabase>

// The Interested rule moved the lead when this action was logged: put the
// previous owner back, unless someone has moved the lead again since.
async function revertInterestedHandOff(
  supabase: Supabase,
  act: { lead_type: LeadType; lead_id: string; created_at: string },
  userId: string,
) {
  const { data: handOff } = await supabase
    .from('outreach_activity')
    .select('id, changes')
    .eq('lead_type', act.lead_type).eq('lead_id', act.lead_id).eq('action', 'owner_changed')
    .eq('user_id', userId).eq('changes->rule->>new', 'interested').is('undone_at', null)
    .gte('created_at', act.created_at)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!handOff) {return}
  const change = (handOff.changes as { owner_user_id?: { old: string | null; new: string | null } } | null)?.owner_user_id
  if (!change) {return}
  const { data: lead } = await supabase.from(leadTable(act.lead_type)).select('owner_user_id').eq('lead_id', act.lead_id).maybeSingle()
  if (!lead || lead.owner_user_id !== change.new) {return}
  await assignLeads(supabase, act.lead_type, [act.lead_id], change.old ?? null, userId)
  await supabase.from('outreach_activity').update({ undone_at: new Date().toISOString() }).eq('id', handOff.id)
}

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
    // Ownership isn't checked here: the SQL only undoes the caller's own
    // action (10 minutes, latest on the lead), and the Interested rule can
    // have handed the lead to someone else in between.
    const { data: act } = await supabase
      .from('outreach_activity').select('lead_type, lead_id, created_at').eq('id', parsed.data.activity_id).maybeSingle()
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

    if (act && (await outreachFeatures(supabase)).assignment) {
      try {
        await revertInterestedHandOff(supabase, act as { lead_type: LeadType; lead_id: string; created_at: string }, caller.userId)
      } catch (revertError) {
        captureError(revertError, { route: 'POST /api/admin/outreach/actions/undo', step: 'revert interested rule' })
      }
    }
    return NextResponse.json({ message: 'Undone', result: data })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/actions/undo' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
