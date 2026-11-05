import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadContacts, saveContact } from '@/lib/outreach/contacts'
import { outreachFeatures } from '@/lib/outreach/schema'
import { getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string; leadId: string } }

// GET /api/admin/outreach/leads/brands/[leadId]/contacts: the brand's active
// contacts, primary first. removed=1 (admins): the removed ones, to restore.
// Before the contacts migration: an empty list and migrated: false.
export async function GET(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (params.type !== 'brands') {return NextResponse.json({ error: 'Not found' }, { status: 404 })}
  try {
    const supabase = createServerSupabase()
    const features = await outreachFeatures(supabase)
    if (!features.contacts) {return NextResponse.json({ contacts: [], migrated: false, removal: false })}
    const removed = request.nextUrl.searchParams.get('removed') === '1'
    if (removed && !caller.isAdmin) {return NextResponse.json({ error: 'Admin access required' }, { status: 403 })}
    if (removed && !features.contactRemoval) {return NextResponse.json({ contacts: [], migrated: true, removal: false })}
    const contacts = await loadContacts(supabase, params.leadId, { softDelete: features.contactRemoval, removed })
    return NextResponse.json({ contacts, migrated: true, removal: features.contactRemoval })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/leads/[leadId]/contacts' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: add a contact { first_name, last_name, title, email, linkedin,
// notes, is_primary }. Members and admins both add, edit and remove
// contacts; every change is logged (contact_added / _edited / _removed).
export async function POST(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (params.type !== 'brands') {return NextResponse.json({ error: 'Not found' }, { status: 404 })}
  try {
    const supabase = createServerSupabase()
    const body = await request.json().catch(() => null)
    const outcome = await saveContact(supabase, caller, params.leadId, null, body, 'POST /api/admin/outreach/leads/[leadId]/contacts')
    return NextResponse.json(outcome.body, { status: outcome.status })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/leads/[leadId]/contacts' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
