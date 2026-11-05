import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { getOutreachCaller, mapDbError, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string; leadId: string; kind: string; itemId: string } }

// POST /api/admin/outreach/database/brands/[leadId]/contacts/[itemId]/primary
// Makes an extra contact the primary one: it moves onto the lead (so its
// email becomes a duplicate key) and the old primary takes its place.
// 409 when the email already belongs to another lead.
export async function POST(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (params.type !== 'brands' || params.kind !== 'contacts') {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase.rpc('outreach_db_make_primary', {
      p_lead_id: params.leadId, p_contact_id: params.itemId, p_user_id: caller.userId,
    })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {
        const message = mapped.code === 'outreach_duplicate'
          ? `This email already belongs to ${String(mapped.detail ?? '').split(':')[0] || 'another lead'}.`
          : mapped.message
        return NextResponse.json({ error: message }, { status: mapped.status })
      }
      captureError(error, { route: 'POST /api/admin/outreach/database/contacts/primary' })
      return NextResponse.json({ error: 'Failed to change the primary contact' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Primary contact changed', contact: data })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/database/contacts/primary' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
