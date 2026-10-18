import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { z } from 'zod'

const patchSchema = z.record(z.string(), z.unknown())

const DEFAULT_SETTINGS: Record<string, unknown> = {
  site_name:           'Infoishai',
  site_description:    'Influencer Marketing Platform',
  default_page_size:   20,
  enable_messaging:    true,
  enable_reviews:      true,
  enable_deals:        true,
  maintenance_mode:    false,
  session_timeout_min: 240,
  max_login_attempts:  5,
  ip_whitelist:        [],
  ip_blacklist:        [],
}

export async function GET() {
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value')

    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return NextResponse.json({ settings: DEFAULT_SETTINGS, missing_table: true })
      }
      throw error
    }

    const settings = { ...DEFAULT_SETTINGS }
    for (const row of (data ?? [])) {
      settings[row.key] = row.value
    }

    return NextResponse.json({ settings })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/settings' })
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role') ?? ''
    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
    }

    const body = await request.json()
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const { reason: _reason, ...settingsBody } = body as Record<string, unknown>
    const parsed = patchSchema.safeParse(settingsBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings' }, { status: 400 })
    }

    const adminId = request.headers.get('x-user-id') ?? null
    const supabase = createServerSupabase()

    const { data: beforeRows } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', Object.keys(parsed.data))

    const upserts = Object.entries(parsed.data).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: adminId,
    }))

    const { error } = await supabase
      .from('platform_settings')
      .upsert(upserts, { onConflict: 'key' })

    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return NextResponse.json({ error: 'Run settings migration first' }, { status: 503 })
      }
      captureError(error, { route: 'PATCH /api/admin/settings' })
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    const before = Object.fromEntries((beforeRows ?? []).map((r) => [r.key, r.value]))
    logAdminAction({
      request,
      adminId,
      action: 'settings_updated',
      targetType: 'platform_settings',
      targetId: 'global',
      reason: reasonCheck.reason,
      before,
      after: parsed.data,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/settings' })
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
