import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { dncKeys, leadKeys } from '@/lib/outreach/rules'
import { findDncHits, findDuplicates, getOutreachCaller, parseLeadType, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/admin/outreach/check-duplicate?type=creator&email=&profile_url=
//     /api/admin/outreach/check-duplicate?type=brand&email=&domain=&website=
// Live check for the add-lead form: existing leads and DNC hits.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const sp = request.nextUrl.searchParams
    const leadType = parseLeadType(sp.get('type'))
    if (!leadType) {return NextResponse.json({ error: 'type must be creator or brand' }, { status: 400 })}
    const input = {
      email: sp.get('email'),
      profile_url: sp.get('profile_url'),
      domain: sp.get('domain'),
      website: sp.get('website'),
    }
    const exclude = sp.get('exclude')

    const supabase = createServerSupabase()
    const duplicates = [...(await findDuplicates(supabase, leadKeys(leadType, input))).values()]
      .filter((d) => d.lead_id !== exclude)
    const dnc = [...(await findDncHits(supabase, dncKeys(leadType, input)))]

    return NextResponse.json({ duplicates, dnc })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/check-duplicate' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
