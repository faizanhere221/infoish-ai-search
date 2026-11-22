import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { getOutreachCaller, superAdminOnly, unauthorized } from '@/lib/outreach/server'
import { checkAccount } from '@/lib/outreach/team'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const emailSchema = z.string().trim().toLowerCase().email().max(255)

// GET /api/admin/outreach/team/lookup?email= (super admin): find an account
// before adding it to the team. Read-only. { account, can_add, promote,
// error } where promote = it becomes role 'outreach' on add.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isSuperAdmin) {return superAdminOnly()}

  try {
    const parsed = emailSchema.safeParse(request.nextUrl.searchParams.get('email') ?? '')
    if (!parsed.success) {return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 })}
    const check = await checkAccount(createServerSupabase(), parsed.data)
    return check.ok
      ? NextResponse.json({ account: check.account, can_add: true, promote: check.promote, error: null })
      : NextResponse.json({ account: check.account ?? null, can_add: false, promote: false, error: check.error })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/team/lookup' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
