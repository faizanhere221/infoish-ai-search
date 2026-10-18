import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/admin-action'

// Impersonation is disabled (Phase 7A) — it never actually worked end-to-end:
// the token it minted was never consumed by anything in the app (no page
// ever read the `?impersonate=` query param it was passed in), so every
// previous "Impersonate" click just opened a new tab under whatever session
// was already active there. Rather than fix and re-enable a security-
// sensitive feature as a side effect of this cleanup, it's turned off here
// — 410 Gone, not 404, since the route existing-but-retired is the point.
// Planned future work if this is wanted: see docs/ADMIN_AUDIT.md.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  logAdminAction({
    request,
    adminId: request.headers.get('x-user-id'),
    action: 'impersonation_blocked',
    targetType: 'user',
    targetId: params.id,
    reason: 'Impersonation is disabled',
  })

  return NextResponse.json(
    { error: 'Impersonation is disabled. It never worked end-to-end in the app and has been turned off rather than fixed as a side effect — see docs/ADMIN_AUDIT.md for planned future work.' },
    { status: 410 }
  )
}
