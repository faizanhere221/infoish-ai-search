import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'

export const dynamic = 'force-dynamic'

// GET — admin-only via middleware. Shape matches what
// src/app/admin/newsletter/page.tsx expects (it was previously calling this
// exact path, which never existed — only the oddly-suffixed
// newsletter-subscriptions-new did, with a different response shape
// entirely: {subscribers: <raw rows>} instead of {subscriptions: [{id,
// email, date, source, status}]}).
export async function GET() {
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, subscribed_at, is_active, source')
      .order('subscribed_at', { ascending: false })

    if (error) {
      captureError(error, { route: 'GET /api/admin/newsletter-subscriptions' })
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
    }

    const subscriptions = (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      date: row.subscribed_at,
      source: row.source ?? 'unknown',
      status: row.is_active ? 'active' as const : 'unsubscribed' as const,
    }))

    return NextResponse.json({ subscriptions })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/newsletter-subscriptions' })
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
  }
}

// DELETE — not currently wired to any UI (the admin newsletter page is
// read-only). Kept functional and brought up to the same reason+log
// standard as every other mutating admin route, rather than left as a
// hand-rolled, unlogged hard delete.
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, source')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id)
    if (error) {
      captureError(error, { route: 'DELETE /api/admin/newsletter-subscriptions' })
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'newsletter_subscriber_deleted',
      targetType: 'newsletter_subscriber',
      targetId: id,
      reason: reasonCheck.reason,
      before: existing,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    captureError(err, { route: 'DELETE /api/admin/newsletter-subscriptions' })
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
