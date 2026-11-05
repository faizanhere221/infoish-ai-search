import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { deleteContact, saveContact } from '@/lib/outreach/contacts'
import { getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string; leadId: string; contactId: string } }

// PATCH: edit a contact (only the fields sent). is_primary: true makes it
// the primary contact. Status changes go through actions.
export async function PATCH(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (params.type !== 'brands') {return NextResponse.json({ error: 'Not found' }, { status: 404 })}
  try {
    const supabase = createServerSupabase()
    const body = await request.json().catch(() => null)
    const outcome = await saveContact(supabase, caller, params.leadId, params.contactId, body, 'PATCH /api/admin/outreach/leads/[leadId]/contacts/[contactId]')
    return NextResponse.json(outcome.body, { status: outcome.status })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/outreach/leads/[leadId]/contacts/[contactId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: remove a contact. If it was the primary, the oldest other
// contact becomes primary. Its email key is freed.
export async function DELETE(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (params.type !== 'brands') {return NextResponse.json({ error: 'Not found' }, { status: 404 })}
  try {
    const supabase = createServerSupabase()
    const outcome = await deleteContact(supabase, caller, params.leadId, params.contactId, 'DELETE /api/admin/outreach/leads/[leadId]/contacts/[contactId]')
    return NextResponse.json(outcome.body, { status: outcome.status })
  } catch (err) {
    captureError(err, { route: 'DELETE /api/admin/outreach/leads/[leadId]/contacts/[contactId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
