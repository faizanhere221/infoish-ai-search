import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { restoreContact } from '@/lib/outreach/contacts'
import { getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string; leadId: string; contactId: string } }

// POST /api/admin/outreach/leads/brands/[leadId]/contacts/[contactId]/restore
// Admins only. Logged as contact_restored.
export async function POST(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (params.type !== 'brands') {return NextResponse.json({ error: 'Not found' }, { status: 404 })}
  try {
    const supabase = createServerSupabase()
    const outcome = await restoreContact(supabase, caller, params.leadId, params.contactId, 'POST /api/admin/outreach/leads/[leadId]/contacts/[contactId]/restore')
    return NextResponse.json(outcome.body, { status: outcome.status })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/leads/[leadId]/contacts/[contactId]/restore' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
